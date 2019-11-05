/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs-extra";
import * as path from "path";

import { Schema, SchemaContext, SchemaXmlFileLocater, SchemaMatchType, SchemaKey, ECVersion, SchemaComparer, ISchemaCompareReporter } from "@bentley/ecschema-metadata";
import { FileSchemaCompareReporter } from "./FileSchemaCompareReporter";
import { CollectionSchemaCompareReporter } from "./CollectionSchemaCompareReporter";
import { SchemaDeserializer } from "./SchemaDeserializer";

/**
 * Defines the possible message types associated with
 * messages returned from schema comparison.
 */
export enum ComparisonResultType {
  Message,
  Error,
  Delta,
}

/**
 * Defines the object returned after schema comparison.
 */
export interface IComparisonResult {
  resultType?: ComparisonResultType;
  resultText: string;
}

/**
 * Holds options needed to perform schema comparison
 */
export class CompareOptions {
  private _schemaAPath: string;
  private _schemaBPath?: string;
  private _referenceDirectories: string[];
  private _outputDir?: string;
  private _compareToNativeDeserialization: boolean;

  /**
   * Initializes a new CompareOptions instance.
   * @param schemaAPath The path to a EC XML schema file.
   * @param referenceDirectories Optional paths in which to search for referenced schemas.
   * @param outputDir The directory where the output file(s) will be created.
   */
  constructor(schemaAPath: string, schemaBPath: string | undefined, referenceDirectories: string[], outputDir?: string,
              compareToNativeDeserialization: boolean = false) {
    this._schemaAPath = schemaAPath;
    this._schemaBPath = schemaBPath;
    this._referenceDirectories = referenceDirectories;
    this._compareToNativeDeserialization = compareToNativeDeserialization;
    if (outputDir)
      this._outputDir = path.normalize(outputDir);
  }

  /** Gets the path to the first schema. */
  public get SchemaAPath(): string {
    return this._schemaAPath;
  }

  /** Gets the path to the second schema. */
  public get SchemaBPath(): string | undefined {
    return this._schemaBPath;
  }

  /** Gets the collection of directories to search for references. */
  public get referenceDirectories(): string[] {
    return this._referenceDirectories;
  }

  /** Gets the output directory. */
  public get outputDir(): string | undefined {
    return this._outputDir;
  }

  /**
   * Indicates if the schema comparison should be done on one schema de-serialized in two ways:
   * typescript deserialization and native deserialization.
   */
  public get compareToNativeDeserialization(): boolean {
    return this._compareToNativeDeserialization;
  }
}

/**
 * The SchemaComparison utility class that compares two schemas and reports the differences.
 */
export class SchemaComparison {
  public static extensions: string[] = [".ecschema.xml"];

  /**
   * Compares two EC Schema XML files by de-serializing the schemas and returning the differences.
   * @param options The CompareOptions which includes the schema file paths and other settings.
   */
  public static async compare(options: CompareOptions): Promise<IComparisonResult[]> {
    if (! await this.isValidPathToXmlSchema(options.SchemaAPath)) {
      const results: IComparisonResult[] = [];
      results.push({ resultType: ComparisonResultType.Error, resultText: `The schema A path '${options.SchemaAPath} is not a valid path to a schema file.` });
      return results;
    }

    return this.compareSchemas(options.SchemaAPath, options.SchemaBPath, options);
  }

  /**
   * Compares two EC Schema XML files by de-serializing the schemas and reporting differences. If no schemaBPath is specified,
   * or the CompareOptions.compareToNativeDeserialization is true, the schema identified by schemaAPath will be de-serialized
   * twice - once using typescript de-serializer and once using the native de-serializer. The two in-memory schemas will then
   * be compared as if two schema paths were specified.
   * @param schemaAPath The path to first schema.
   * @param schemaBPath The path to second schema.
   * @param options The CompareOptions options.
   */
  public static async compareSchemas(schemaAPath: string, schemaBPath: string | undefined, options: CompareOptions): Promise<IComparisonResult[]> {
    if (options.compareToNativeDeserialization || undefined === schemaBPath) {
      return this.compareToNativeDeserialization(schemaAPath, options);
    }

    let results: IComparisonResult[] = [];

    if (!await this.isValidPathToXmlSchema(schemaBPath)) {
      results.push({ resultType: ComparisonResultType.Error, resultText: `The schema B path '${options.SchemaBPath} is not a valid path to a schema file.` });
      return results;
    }

    const headerText = "Schema Comparison Results";

    results.push({ resultType: ComparisonResultType.Message, resultText: headerText });

    const baseLineSchema = await this.getSchemaFromXmlFile(schemaAPath, results, options.referenceDirectories);
    if (!baseLineSchema)
      return results;

    const schemaToCompare = await this.getSchemaFromXmlFile(schemaBPath, results, options.referenceDirectories);
    if (!schemaToCompare)
      return results;

    results = results.concat(await this.compareLoadedSchemas(baseLineSchema, schemaToCompare, options.outputDir));

    return results;
  }

  /**
   * Compares two schemas loaded into memory.
   * @param baseLineSchema The first schema that will be traversed and compared to the second.
   * @param schemaToCompare The schema to compare to the baseline schema.
   * @param options The compare options.
   */
  public static async compareLoadedSchemas(baseLineSchema: Schema, schemaToCompare: Schema, outputDir?: string): Promise<IComparisonResult[]> {
    const schemaName = schemaToCompare.fullName;

    const collectionReporter = new CollectionSchemaCompareReporter(baseLineSchema, schemaToCompare);
    const reporters: ISchemaCompareReporter[] = [collectionReporter];

    let fileReporter: FileSchemaCompareReporter | undefined;
    if (outputDir) {
      fileReporter = new FileSchemaCompareReporter(baseLineSchema, schemaToCompare, outputDir);
      reporters.push(fileReporter);
      fileReporter.start("Comparison Results");
    }

    const results: IComparisonResult[] = [];
    let message: string | undefined;
    let msgType: ComparisonResultType;

    try {
      const comparer = new SchemaComparer(...reporters);
      await comparer.compareSchemas(baseLineSchema, schemaToCompare);

      // create comparison results out of diagnostic messages
      this.createComparisonResults(collectionReporter.changeMessages, results);

      message = collectionReporter.changeMessages.length === 0 ? " Schema Comparison Succeeded. No differences found." : undefined;
      msgType = ComparisonResultType.Message;
    } catch (err) {
      message = ` An error occurred comparing the schema ${schemaName}: ${err.message}`;
      msgType = ComparisonResultType.Error;
    }

    if (message) {
      results.push({ resultType: msgType, resultText: message });
    }
    // message can be null, but we must end the reporter
    if (fileReporter)
      await this.waitForReporterToFlush(fileReporter, message);

    return results;
  }

  private static async isValidPathToXmlSchema(schemaPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(schemaPath);
      if (!stat.isFile()) {
        return false;
      }
    } catch (e) {
      return false;
    }

    return schemaPath.endsWith(".ecschema.xml");
  }

  private static async compareToNativeDeserialization(schemaPath: string, options: CompareOptions): Promise<IComparisonResult[]> {
    let results: IComparisonResult[] = [];

    const headerText = "Schema Comparison Results";

    results.push({ resultType: ComparisonResultType.Message, resultText: headerText });

    const baseLineSchema = await this.getXmlSchemaUsingJsonDeserializer(schemaPath, results, options.referenceDirectories);
    if (!baseLineSchema)
      return results;

    const schema = await this.getSchemaFromXmlFile(schemaPath, results, options.referenceDirectories);
    if (!schema)
      return results;

    results = results.concat(await this.compareLoadedSchemas(baseLineSchema, schema, options.outputDir));

    return results;
  }

  private static async getSchemaFromXmlFile(schemaPath: string, results: IComparisonResult[], referencePaths?: string[]): Promise<Schema | undefined> {
    let schemaText: string;
    try {
      schemaText = fs.readFileSync(schemaPath, "utf-8");
    } catch (err) {
      const msg = ` An error occurred reading the schema XML file ${schemaPath}: ${err.message}`;
      results.push({ resultType: ComparisonResultType.Error, resultText: msg });
      return;
    }

    const locater = new SchemaXmlFileLocater();
    const context = new SchemaContext();
    context.addLocater(locater);

    if (referencePaths) {
      locater.addSchemaSearchPaths(referencePaths);
    }

    const directory = path.dirname(schemaPath);
    locater.addSchemaSearchPaths([directory]);

    const schemaKey = this.getSchemaKey(schemaText, schemaPath, results);
    if (!schemaKey)
      return;

    try {
      return await context.getSchema(schemaKey, SchemaMatchType.Exact);
    } catch (err) {
      const msg = `An error occurred retrieving schema '${schemaKey.toString()}': ${err.message}`;
      results.push({ resultType: ComparisonResultType.Error, resultText: msg });
    }

    return;
  }

  private static async getXmlSchemaUsingJsonDeserializer(schemaPath: string, results: IComparisonResult[], referencePaths?: string[]): Promise<Schema | undefined> {
    let schema: Schema | undefined;
    try {
      const context = new SchemaContext();
      const deserializer = new SchemaDeserializer();
      schema = await deserializer.deserializeXmlFile(schemaPath, context, referencePaths);

      return schema;
    } catch (err) {
      const msg = ` An error occurred de-serializing the schema ${schemaPath}: ${err.message}`;
      results.push({ resultType: ComparisonResultType.Error, resultText: msg });
    }

    return;
  }

  private static async waitForReporterToFlush(reporter: FileSchemaCompareReporter, message?: string): Promise<void> {
    return new Promise((resolve) => {
      reporter.end(message, () => {
        resolve();
      });
    });
  }

  private static createComparisonResults(diagnostics: string[], results: IComparisonResult[]) {
    for (const diag of diagnostics) {
      results.push({ resultType: ComparisonResultType.Delta, resultText: " " + diag });
    }
  }

  /**
   * Constructs a SchemaKey based on the information in the Schema XML.
   * @param data The Schema XML as a string.
   */
  private static getSchemaKey(data: string, schemaPath: string, results: IComparisonResult[]): SchemaKey | undefined {
    const matches = data.match(/<ECSchema ([^]+?)>/g);
    if (!matches || matches.length !== 1) {
      const msg = ` Could not find '<ECSchema>' tag in the file '${schemaPath}'`;
      results.push({ resultType: ComparisonResultType.Error, resultText: msg });
      return;
    }

    const name = matches[0].match(/schemaName="(.+?)"/);
    if (!name || name.length !== 2 ) {
      const msg = ` Could not find the ECSchema 'schemaName' tag in the file '${schemaPath}'`;
      results.push({ resultType: ComparisonResultType.Error, resultText: msg });
      return;
    }
    const version = matches[0].match(/version="(.+?)"/);
    if (!version || version.length !== 2) {
      const msg = ` Could not find the ECSchema 'version' tag in the file '${schemaPath}'`;
      results.push({ resultType: ComparisonResultType.Error, resultText: msg });
      return;
    }

    const key = new SchemaKey(name[1], ECVersion.fromString(version[1]));
    return key;
  }
}
