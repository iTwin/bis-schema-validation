/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs-extra";
import * as path from "path";

import { Schema, SchemaContext } from "@bentley/ecschema-metadata";
import { ISchemaCompareReporter, SchemaComparer } from "@bentley/ecschema-editing";
import { FileSchemaCompareReporter } from "./FileSchemaCompareReporter";
import { CollectionSchemaCompareReporter, IFormattedSchemaChange } from "./CollectionSchemaCompareReporter";
import { SchemaDeserializer } from "@bentley/native-schema-locater";

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
  compareCode?: string;
  resultType?: ComparisonResultType;
  resultText: string;
}

/**
 * Holds options needed to perform schema comparison
 */
export class CompareOptions {
  private _schemaAPath: string;
  private _schemaBPath: string;
  private _referenceDirectoriesA: string[];
  private _referenceDirectoriesB: string[];
  private _outputDir?: string;

  /**
   * Initializes a new CompareOptions instance.
   * @param schemaAPath The path to a EC XML schema file.
   * @param referenceDirectories Optional paths in which to search for referenced schemas.
   * @param outputDir The directory where the output file(s) will be created.
   */
  constructor(schemaAPath: string, schemaBPath: string, referenceDirectoriesA: string[], referenceDirectoriesB: string[], outputDir?: string) {
    this._schemaAPath = schemaAPath;
    this._schemaBPath = schemaBPath;
    this._referenceDirectoriesA = referenceDirectoriesA;
    this._referenceDirectoriesB = referenceDirectoriesB;

    if (outputDir)
      this._outputDir = path.normalize(outputDir);
  }

  /** Gets the path to the first schema. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public get SchemaAPath(): string {
    return this._schemaAPath;
  }

  /** Gets the path to the second schema. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public get SchemaBPath(): string {
    return this._schemaBPath;
  }

  /** Gets the collection of directories to search for references belonging to Schema A. */
  public get referenceDirectoriesA(): string[] {
    return this._referenceDirectoriesA;
  }

  /** Gets the collection of directories to search for references belonging to Schema B. */
  public get referenceDirectoriesB(): string[] {
    return this._referenceDirectoriesB;
  }

  /** Gets the output directory. */
  public get outputDir(): string | undefined {
    return this._outputDir;
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
   * Compares two EC Schema XML files by de-serializing the schemas and reporting differences.
   * @param schemaAPath The path to first schema.
   * @param schemaBPath The path to second schema.
   * @param options The CompareOptions options.
   */
  public static async compareSchemas(schemaAPath: string, schemaBPath: string, options: CompareOptions): Promise<IComparisonResult[]> {

    let results: IComparisonResult[] = [];

    if (!await this.isValidPathToXmlSchema(schemaBPath)) {
      results.push({ resultType: ComparisonResultType.Error, resultText: `The schema B path '${options.SchemaBPath} is not a valid path to a schema file.` });
      return results;
    }

    const headerText = "Schema Comparison Results";

    results.push({ resultType: ComparisonResultType.Message, resultText: headerText });

    const baseLineSchema = await this.getSchema(schemaAPath, results, options.referenceDirectoriesA);
    if (!baseLineSchema)
      return results;

    const schemaToCompare = await this.getSchema(schemaBPath, results, options.referenceDirectoriesB);
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

  private static async getSchema(schemaPath: string, results: IComparisonResult[], referencePaths: string[]): Promise<Schema | undefined> {
    const isJson = schemaPath.endsWith(".json");

    let schema: Schema | undefined;
    try {
      const context = new SchemaContext();
      const deserializer = new SchemaDeserializer();

      if (isJson)
        schema = await deserializer.deserializeJsonFile(schemaPath, context, referencePaths);
      else
        schema = await deserializer.deserializeXmlFile(schemaPath, context, referencePaths);

      return schema;
    } catch (err) {
      const msg = ` An error occurred de-serializing the schema ${schemaPath}: ${err.message}`;
      results.push({ resultType: ComparisonResultType.Error, resultText: msg });
    }

    return schema;
  }

  private static async waitForReporterToFlush(reporter: FileSchemaCompareReporter, message?: string): Promise<void> {
    return new Promise((resolve) => {
      reporter.end(message, () => {
        resolve();
      });
    });
  }

  private static createComparisonResults(diagnostics: IFormattedSchemaChange[], results: IComparisonResult[]) {
    for (const diag of diagnostics) {
      const code = diag.change ? diag.change.diagnostic.code : undefined;
      results.push({ resultType: ComparisonResultType.Delta, resultText: " " + diag.message, compareCode: code });
    }
  }
}
