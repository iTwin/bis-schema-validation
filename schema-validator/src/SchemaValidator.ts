/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs-extra";
import * as path from "path";
import { DOMParser } from "xmldom";

import {
  ECRuleSet, Schema, SchemaContext, IDiagnosticReporter, SchemaDiagnostic,
  IRuleSet, SchemaValidationVisitor, SchemaWalker, ISchemaPartVisitor, createSchemaDiagnosticClass,
} from "@bentley/ecschema-metadata";
import { BisRuleSet } from "@bentley/bis-rules";
import { FileDiagnosticReporter } from "./FileDiagnosticReporter";
import { CollectionDiagnosticReporter } from "./CollectionDiagnosticReporter";
import { SchemaDeserializer } from "./SchemaDeserializer";

interface SchemaReferenceInfo {
  name: string;
  alias: string;
}

export const standardSchemaNames = [
  "Bentley_Standard_CustomAttributes",
  "Bentley_Standard_Classes",
  "Bentley_ECSchemaMap",
  "EditorCustomAttributes",
  "Bentley_Common_Classes",
  "Dimension_Schema",
  "iip_mdb_customAttributes",
  "KindOfQuantity_Schema",
  "rdl_customAttributes",
  "SIUnitSystemDefaults",
  "Unit_Attributes",
  "Units_Schema",
  "USCustomaryUnitSystemDefaults",
  "ECDbMap",
  "CoreCustomAttributes", // New EC3 Standard Schema
  "SchemaLocalizationCustomAttributes", // New EC3 Standard Schema
  "Units", // New EC3 Standard Schema
  "Formats", // New EC3 Standard Schema
];

/**
 * Defines the possible message types associated with
 * messages returned from schema validation.
 */
export enum ValidationResultType {
  Message,
  Error,
  RuleViolation,
}

/**
 * Defines the object returned after schema validation.
 */
export interface IValidationResult {
  resultType?: ValidationResultType;
  resultText: string;
}

/**
 * Hold validation options needed to perform schema validation
 */
export class ValidationOptions {
  private _schemaPath: string;
  private _referenceDirectories: string[];
  private _outputDir?: string;
  private _validateFullSchemaGraph: boolean;

  /**
   * Initializes a new ValidationOptions instance.
   * @param schemaPath The path to a schema file or a directory holding the same.
   * @param referenceDirectories Optional paths in which to search for referenced schemas.
   * @param outputDir The directory where the output file(s) will be created.
   * @param validateFullSchemaGraph Indicates if the full schema graph should be validated.
   */
  constructor(schemaPath: string, referenceDirectories: string[], validateFullSchemaGraph: boolean, outputDir?: string) {
    this._schemaPath = schemaPath;
    this._referenceDirectories = referenceDirectories;
    if (undefined !== outputDir)
      this._outputDir = path.normalize(outputDir);
    this._validateFullSchemaGraph = validateFullSchemaGraph;
  }

  /** Gets the schema path. */
  public get schemaPath(): string { return this._schemaPath; }

  /** Gets the collection of directories to search for references. */
  public get referenceDirectories(): string[] { return this._referenceDirectories; }

  /** Gets the output directory. */
  public get outputDir(): string | undefined { return this._outputDir; }

  /** Gets the flag indicating if the full schema graph should be validated. */
  public get validateFullSchemaGraph(): boolean { return this._validateFullSchemaGraph; }
}

/**
 * The ECSchemaValidater validates EC3 Bis schemas and outputs the results to file.
 */
export class SchemaValidator {
  // Used to create a new schema diagnostic for the Schema Reference alias EC Rule.
  private static _schemaReferenceAliasDiagnostic = createSchemaDiagnosticClass<[string, string, string]>("VALIDATOR-001",
    "The schema reference for '{0}' uses the alias '{1}' which does not match the alias '{2}' found in the original schema.");

  public static extensions: string[] = [".ecschema.xml", ".ecschema.json"];

  /**
   * Validates schema files against Core EC and BIS rules. If the supplied schema path is a directory,
   * all schema files (ECXml and/or ECJson) will be validated. The results will be written to a file,
   * with the same name as the schema, in the output directory provided. If the output directory
   * does not exist, the file will not be created.
   * @param options The ValidationOptions which includes the schema file path and other settings.
   */
  public static async validate(options: ValidationOptions): Promise<IValidationResult[]> {
    const stat = await fs.lstat(options.schemaPath);
    if (stat.isFile())
      return this.validateFile(options.schemaPath, options);

    let results: IValidationResult[] = [];
    const files = await fs.readdir(options.schemaPath);
    const schemaFiles = files.filter((f) => this.isSchemaFile(f));

    for (const schemaFile of schemaFiles) {
      const fullPath = path.join(options.schemaPath, schemaFile);
      results = results.concat(await this.validateFile(fullPath, options));
    }
    return results;
  }

  /**
   * Validates a schema de-serialized from the given path.
   * @param schemaPath The path to a schema.
   * @param options The validation options.
   */
  public static async validateFile(schemaPath: string, options: ValidationOptions): Promise<IValidationResult[]> {
    const isJson = schemaPath.endsWith(".json");
    const fileName = path.basename(schemaPath);
    const schemaName = isJson ? fileName.replace(".ecschema.json", "") : fileName.replace(".ecschema.xml", "");
    const headerText = schemaName + " Validation Results";

    let results: IValidationResult[] = [];
    results.push({ resultType: ValidationResultType.Message, resultText: headerText });

    // skip validation on all standard schemas
    if (this.isStandardSchema(schemaName))
      results.push({ resultType: ValidationResultType.Error, resultText: " Standard schemas are not supported by this tool." });

    const schema = await this.getSchema(schemaPath, results, options.referenceDirectories);
    if (!schema)
      return results;

    // Creates the Validator rule set that will be added to the validation along with EC and BIS rule sets.
    const ruleSet = this.createRuleSet(schemaPath);

    results = results.concat(await this.validateLoadedSchema(schema, options, ruleSet));

    return results;
  }

  /**
   * Validates a schema against Core EC and BIS rules.
   * @param options The validation options.
   */
  public static async validateLoadedSchema(schema: Schema, options: ValidationOptions, validaterRuleSet?: IRuleSet): Promise<IValidationResult[]> {
    const schemaName = schema.fullName;

    // skip validation on all standard schemas
    if (this.isStandardSchema(schema))
      return [];

    const collectionReporter = new CollectionDiagnosticReporter();
    const reporters: IDiagnosticReporter[] = [collectionReporter];

    let fileReporter: FileDiagnosticReporter | undefined;
    if (options.outputDir) {
      fileReporter = new FileDiagnosticReporter(schemaName, options.outputDir);
      reporters.push(fileReporter);
      fileReporter.start(schemaName + " Validation Results");
    }

    const ruleSets = [ECRuleSet, BisRuleSet];
    if (validaterRuleSet)
      ruleSets.push(validaterRuleSet);

    let results: IValidationResult[] = [];
    let message: string | undefined;
    let msgType: ValidationResultType;

    try {
      const visitor = this.createNewVisitor(ruleSets, reporters);
      const reader = new SchemaWalker(visitor);
      await reader.traverseSchema(schema);

      // create validation results out of diagnostic messages
      this.createValidationResults(collectionReporter.diagnostics, results);

      message = collectionReporter.diagnostics.length === 0 ? " Schema Validation Succeeded. No rule violations found." : undefined;
      msgType = ValidationResultType.Message;
    } catch (err) {
      message = ` An error occurred validating the schema ${schemaName}: ${err.message}`;
      msgType = ValidationResultType.Error;
    }

    if (message) {
      results.push({ resultType: msgType, resultText: message });
    }
    // message can be null, but we must end the reporter
    if (fileReporter)
      await this.waitForReporterToFlush(fileReporter, message);

    // Recursively validate referenced schemas
    if (options.validateFullSchemaGraph) {
      for (const ref of schema.references) {
        results = results.concat(await this.validateLoadedSchema(ref, options));
      }
    }

    return results;
  }

  private static createRuleSet(schemaPath: string): IRuleSet {
    // Rule set to check schema reference aliases
    const schemaReferenceAliasRule = async function* (schemaParam: Schema): AsyncIterable<SchemaDiagnostic<any[]>> {
      const result = await SchemaValidator.validateSchemaReferenceAliases(schemaPath, schemaParam);
      if (result)
        yield result;
    };

    const ruleSet = { // tslint:disable-line:variable-name
      name: "VALIDATOR",
      schemaRules: [
        schemaReferenceAliasRule,
      ],
    };

    return ruleSet;
  }

  private static async validateSchemaReferenceAliases(schemaPath: string, loadedSchema: Schema): Promise<SchemaDiagnostic<any[]> | undefined> {
    const isJson = schemaPath.endsWith(".json");
    if (isJson)
      return;

    const schemaText = await this.readUtf8FileToString(schemaPath);
    if (undefined === schemaText)
      return;

    const parser = new DOMParser();
    const document = parser.parseFromString(schemaText);

    const schemaReferences = this.getElementChildrenByTagName(document.documentElement, "ECSchemaReference");
    for (const ref of schemaReferences) {
      const referenceInfo = this.getSchemaReferenceInfo(ref);
      const schemaReference = await loadedSchema.getReference(referenceInfo.name);
      if (!schemaReference) {
        return;
      }

      if (schemaReference.alias !== referenceInfo.alias) {
        const refAlias = schemaReference.alias || "undefined";
        return new this._schemaReferenceAliasDiagnostic(loadedSchema, [referenceInfo.name, referenceInfo.alias, refAlias]);
      }
    }

    return undefined;
  }

  private static async getSchema(schemaPath: string, results: IValidationResult[], referencePaths?: string[]): Promise<Schema | undefined> {
    const isJson = schemaPath.endsWith(".json");

    let schema: Schema | undefined;
    try {
      const context = new SchemaContext();
      const deserializer = new SchemaDeserializer();

      if (isJson)
        schema = await deserializer.deserializeJsonFile(schemaPath, context, referencePaths);
      schema = await deserializer.deserializeXmlFile(schemaPath, context, referencePaths);

      const msg = ` Successfully de-serialized schema ${schema.schemaKey.toString()}`;
      results.push({ resultType: ValidationResultType.Message, resultText: msg });

      return schema;
    } catch (err) {
      const msg = ` An error occurred de-serializing the schema ${schemaPath}: ${err.message}`;
      results.push({ resultType: ValidationResultType.Error, resultText: msg });
    }

    return schema;
  }

  private static async waitForReporterToFlush(reporter: FileDiagnosticReporter, message?: string): Promise<void> {
    return new Promise((resolve) => {
      reporter.end(message, () => {
        resolve();
      });
    });
  }

  private static createValidationResults(diagnostics: string[], results: IValidationResult[]) {
    for (const diag of diagnostics) {
      results.push({ resultType: ValidationResultType.RuleViolation, resultText: " " + diag });
    }
  }

  private static createNewVisitor(ruleSets: IRuleSet[], reporters: IDiagnosticReporter[]): ISchemaPartVisitor {
    const visitor = new SchemaValidationVisitor();
    ruleSets.forEach((set) => visitor.registerRuleSet(set));
    reporters.forEach((reporter) => visitor.registerReporter(reporter));

    return visitor;
  }

  private static isSchemaFile(file: string) {
    for (const ext of this.extensions) {
      if (file.endsWith(ext))
        return true;
    }
    return false;
  }

  private static isStandardSchema(schema: Schema | string): boolean {
    const name = schema instanceof Schema ? schema.name : schema;
    return standardSchemaNames.includes(name);
  }

  private static getAttributeValue(xmlElement: Element, attributeName: string): string | null {
    if (xmlElement.hasAttribute(attributeName))
      return xmlElement.getAttribute(attributeName);

    return null;
  }

  private static getSchemaReferenceInfo(xmlElement: Element): SchemaReferenceInfo {
    let name = this.getAttributeValue(xmlElement, "name");
    if (!name) {
      name = "";
    }

    const alias = this.getAttributeValue(xmlElement, "alias");
    if (!alias) {
      throw new Error(`Schema reference '${name}' has an invalid schema alias.`);
    }

    return {
      name,
      alias,
    };
  }

  private static getElementChildren(xmlElement: Element): Element[] {
    // NodeListOf<T> does not define [Symbol.iterator]
    const children = Array.from(xmlElement.childNodes).filter((child) => {
      // (node.nodeType === 1) implies instanceof Element
      // https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/children#Polyfill
      return child.nodeType === 1;
    });
    return children as Element[];
  }

  private static getElementChildrenByTagName(xmlElement: Element, tagName: string): Element[] {
    const children = this.getElementChildren(xmlElement);
    let result = new Array<Element>();
    result = children.filter((child) => {
      return tagName.toLowerCase() === child.nodeName.toLowerCase();
    });
    return result;
  }

  public static async readUtf8FileToString(filePath: string): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve, reject) => {
      fs.readFile(filePath, "utf-8", (err, data) => {
        if (err)
          reject(err);
        else
          resolve(data);
      });
    });
  }
}
