/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as fs from "fs";
import * as EC from "@itwin/ecschema-metadata";
import { SchemaJsonFileLocater } from "@itwin/ecschema-locaters";
import { IModelHost } from "@itwin/core-backend";
import { SchemaXmlFileLocater } from "./SchemaXmlFileLocater";

/**
 * Deserializes ECXml and ECJson schema files.
 */
export class SchemaDeserializer {
  /**
   * Deserializes the specified ECXml schema file in the given schema context.
   * @param schemaFilePath The path to a valid ECXml schema file.
   * @param schemaContext The schema context in which to deserialize the schema.
   * @param referencePaths Optional paths to search when locating schema references.
   */
  public async deserializeXmlFile(schemaFilePath: string, schemaContext: EC.SchemaContext, referencePaths?: string[]): Promise<EC.Schema> {
    if (!referencePaths)
      referencePaths = [];
    referencePaths.push(path.dirname(schemaFilePath));

    // The following line can be removed (and shutdown below) when/if the SchemaXmlFileLocater (native deserialization) is removed
    await IModelHost.startup();

    const locater = this.configureFileLocater(schemaContext, referencePaths);

    try {
      const schema = locater.loadSchemaFromFile(schemaFilePath, schemaContext);
      if (!schema)
        throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, `Unable to locate schema XML file at ${schemaFilePath}`);

      return schema;
    } finally {
      // This can be removed when/if the SchemaXmlFIleLocater (native deserialization) is removed
      await IModelHost.shutdown();
    }
  }

  /**
   * Deserializes the specified ECJson schema file in the given schema context.
   * @param schemaFilePath The path to a valid ECJson schema file.
   * @param context The schema context in which to deserialize the schema.
   * @param referencePaths Optional paths to search when locating schema references.
   */
  public async deserializeJsonFile(schemaFilePath: string, context: EC.SchemaContext, referencePaths?: string[]): Promise<EC.Schema> {
    // If the schema file doesn't exist, throw an error
    if (!fs.existsSync(schemaFilePath))
      throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, "Unable to locate schema JSON file at " + schemaFilePath);

    // add locater to the context
    if (!referencePaths)
      referencePaths = [];
    referencePaths.push(path.dirname(schemaFilePath));

    const locater = new SchemaJsonFileLocater();
    locater.addSchemaSearchPaths(referencePaths);
    context.addLocater(locater);

    // If the file cannot be parsed, throw an error.
    const schemaString = fs.readFileSync(schemaFilePath, "utf8");
    let schemaJson: any;
    try {
      schemaJson = JSON.parse(schemaString);
    } catch (e: any) {
      throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidECJson, e.message);
    }
    return EC.Schema.fromJson(schemaJson, context);
  }

  private configureFileLocater(schemaContext: EC.SchemaContext, referencePaths: string[]): SchemaXmlFileLocater {
    const xmlSchemaLocater = new SchemaXmlFileLocater();
    schemaContext.addLocater(xmlSchemaLocater);
    xmlSchemaLocater.addSchemaSearchPaths(referencePaths);
    return xmlSchemaLocater;
  }
}
