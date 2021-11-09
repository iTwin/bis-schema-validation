/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs-extra";
import * as path from "path";
import { DOMParser, XMLSerializer } from "xmldom";
import { SchemaXmlFileLocater } from "@bentley/ecschema-locaters";
import { ComparisonResultType, IComparisonResult, SchemaComparison } from "@bentley/schema-comparer";
import { ECVersion, Schema, SchemaContext, SchemaKey, SchemaMatchType } from "@bentley/ecschema-metadata";

/**
 * Defines the possible message types associated with
 * messages returned from schema comparison.
 */
export enum RoundTripResultType {
  Message,
  Error,
  Delta,
}

/**
 * Defines the object returned after schema comparison.
 */
export interface IRoundTripResult {
  resultType?: RoundTripResultType;
  resultText: string;
}

/**
 * Holds options needed to perform schema comparison
 */
export class RoundTripOptions {
  private _schemaPath: string;
  private _referenceDirectories: string[];
  private _outputDir: string;
  private _compareSchemas: boolean;

  /**
   * Initializes a new CompareOptions instance.
   * @param schemaPath The path to a schema file or a directory holding the same
   * @param referenceDirectories Optional paths in which to search for referenced schemas.
   * @param outputDir The directory where the output file(s) will be created.
   */
  constructor(schemaPath: string, referenceDirectories: string[], outputDir: string, compareSchemas: boolean) {
    this._schemaPath = schemaPath;
    this._referenceDirectories = referenceDirectories;
    this._outputDir = path.normalize(outputDir);
    this._compareSchemas = compareSchemas;
  }

  /** Gets the path to the first schema. */
  public get schemaPath(): string {
    return this._schemaPath;
  }

  /** Gets the collection of directories to search for references. */
  public get referenceDirectories(): string[] {
    return this._referenceDirectories;
  }

  /** Gets the output directory. */
  public get outputDir(): string {
    return this._outputDir;
  }

  /** Gets the compareSchemas flag. */
  public get compareSchemas(): boolean {
    return this._compareSchemas;
  }
}

/**
 * The SchemaRoundTrip utility class that de-serializes and then re-serializes a schema, optional validating
 * the results.
 */
export class SchemaRoundTrip {
  public static extensions: string[] = [".ecschema.xml"];

  /**
   * De-serializes and re-serializes an EC Schema XML file.
   * @param options The RoundTripOptions which includes the schema file path and other settings.
   */
  public static async roundTripSchema(options: RoundTripOptions): Promise<IRoundTripResult[]> {
    const results: IRoundTripResult[] = [];

    const headerText = "Schema Round Trip Results";
    results.push({ resultType: RoundTripResultType.Message, resultText: headerText });

    if (!(await this.isValidPathToXmlSchema(options.schemaPath))) {
      results.push({ resultType: RoundTripResultType.Error, resultText: `The schema path '${options.schemaPath}' is not a valid path to a schema file.` });
      return results;
    }

    // De-serialize schema
    const schema = await this.getSchemaFromXmlFile(options.schemaPath, results, options.referenceDirectories);
    if (!schema)
      return results;

    // Serialize schema to the document object
    let doc = this.createEmptyXmlDocument();
    try {
      doc = await schema.toXml(doc);
    } catch (err) {
      const msg = `An error occurred serializing schema '${schema.fullName}': ${err.message}`;
      results.push({ resultType: RoundTripResultType.Error, resultText: msg });
    }

    // Write the serialized schema to the out dir specified in the options.
    try {
      await this.writeSchemaXmlFile(schema, doc, options, results);
    } catch (err) {
      const msg = `An error occurred writing xml file for schema '${schema.fullName}': ${err.message}`;
      results.push({ resultType: RoundTripResultType.Error, resultText: msg });
    }

    const resultMsg = `Schema re-serialized successfully to ${path.resolve(options.outputDir, schema.name + ".ecschema.xml")}`;
    results.push({ resultType: RoundTripResultType.Message, resultText: resultMsg });

    // If we are not comparing the results to the original, return.
    if (!options.compareSchemas)
      return results;

    // De-serialize the newly created schema XML file so that we can perform an in-memory comparison
    const newSchemaPath = this.getSchemaPath(schema, options, results);
    if (!newSchemaPath)
      return results;

    const newSchema = await this.getSchemaFromXmlFile(newSchemaPath, results, options.referenceDirectories);
    if (!newSchema)
      return results;

    // Performs comparison and then converts the results to IRoundTripResult objects
    const compareResults = await SchemaComparison.compareLoadedSchemas(schema, newSchema, options.outputDir);
    for (const entry of compareResults) {
      results.push(this.getResultFromCompareResult(entry));
    }

    return results;
  }

  private static async writeSchemaXmlFile(schema: Schema, xmlDoc: Document, options: RoundTripOptions, results: IRoundTripResult[]) {
    const baseFile = this.getSchemaPath(schema, options, results);
    if (!baseFile)
      return;

    const serializer = new XMLSerializer();
    const xml = serializer.serializeToString(xmlDoc);
    try {
      await fs.writeFile(baseFile, xml);
    } catch (err) {
      const msg = `An error occurred writing to file '${baseFile}': ${err.message}`;
      results.push({ resultType: RoundTripResultType.Error, resultText: msg });
    }
  }

  private static getSchemaPath(schema: Schema, options: RoundTripOptions, results: IRoundTripResult[]): string | undefined {
    const realDir = path.normalize(options.outputDir) + path.sep;
    const test = fs.pathExistsSync(realDir);
    if (!test) {
      const msg = `The out directory '${realDir}' does not exist.`;
      results.push({ resultType: RoundTripResultType.Error, resultText: msg });
      return;
    }

    return path.resolve(realDir, schema.name + ".ecschema.xml");
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

  private static async getSchemaFromXmlFile(schemaPath: string, results: IRoundTripResult[], referencePaths?: string[]): Promise<Schema | undefined> {
    let schemaText: string;
    try {
      schemaText = fs.readFileSync(schemaPath, "utf-8");
    } catch (err) {
      const msg = ` An error occurred reading the schema XML file '${schemaPath}': ${err.message}`;
      results.push({ resultType: RoundTripResultType.Error, resultText: msg });
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
      const msg = `An error occurred retrieving the schema '${schemaKey.toString()}': ${err.message}`;
      results.push({ resultType: RoundTripResultType.Error, resultText: msg });
    }

    return;
  }

  /**
   * Constructs a SchemaKey based on the information in the Schema XML.
   * @param data The Schema XML as a string.
   */
  private static getSchemaKey(data: string, schemaPath: string, results: IRoundTripResult[]): SchemaKey | undefined {
    const matches = data.match(/<ECSchema ([^]+?)>/g);
    if (!matches || matches.length !== 1) {
      const msg = ` Could not find '<ECSchema>' tag in the file '${schemaPath}'`;
      results.push({ resultType: RoundTripResultType.Error, resultText: msg });
      return;
    }

    const name = matches[0].match(/schemaName="(.+?)"/);
    if (!name || name.length !== 2) {
      const msg = ` Could not find the ECSchema 'schemaName' tag in the file '${schemaPath}'`;
      results.push({ resultType: RoundTripResultType.Error, resultText: msg });
      return;
    }
    const version = matches[0].match(/version="(.+?)"/);
    if (!version || version.length !== 2) {
      const msg = ` Could not find the ECSchema 'version' tag in the file '${schemaPath}'`;
      results.push({ resultType: RoundTripResultType.Error, resultText: msg });
      return;
    }

    const key = new SchemaKey(name[1], ECVersion.fromString(version[1]));
    return key;
  }

  private static createEmptyXmlDocument(): Document {
    return new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?>`, "application/xml");
  }

  private static getResultFromCompareResult(compareResult: IComparisonResult): IRoundTripResult {
    let resultType: RoundTripResultType;
    switch (compareResult.resultType) {
      case ComparisonResultType.Delta:
        resultType = RoundTripResultType.Delta;
        break;
      case ComparisonResultType.Error:
        resultType = RoundTripResultType.Error;
        break;
      case ComparisonResultType.Message:
        resultType = RoundTripResultType.Message;
        break;
      default:
        resultType = RoundTripResultType.Message;
    }

    return { resultType, resultText: compareResult.resultText };
  }
}
