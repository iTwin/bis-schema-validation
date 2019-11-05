/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import { ECSchemaXmlContext, SchemaKey, IModelHost } from "@bentley/imodeljs-backend";
import { Config } from "@bentley/imodeljs-clients";
import * as EC from "@bentley/ecschema-metadata";
import { StubSchemaFileLocater } from "./StubSchemaFileLocater";

/**
 * Deserializes ECXml.
 */
export class SchemaDeserializer {
  private _processedStandardSchemas = false;
  private _standardSchemasToIgnore = ["Units", "Formats"];
  /**
   * Deserializes the specified ECXml schema file in the given schema context.
   * @param schemaFilePath The path to a valid ECXml schema file.
   * @param schemaContext The schema context in which to deserialize the schema.
   * @param referencePaths Optional paths to search when locating schema references.
   */
  public async deserializeXmlFile(schemaFilePath: string, schemaContext: EC.SchemaContext, referencePaths?: string[]): Promise<EC.Schema> {
    // Needed to avoid crash in backend when calling IModelHost.startup.  This
    // can be removed once the backed is no longer need for de-serialization.
    (Config as any)._appConfig = new (Config as any)();
    IModelHost.startup();

    this._processedStandardSchemas = false;
    const locater = new StubSchemaFileLocater();
    const xmlContext = this.createXmlContext();

    if (referencePaths) {
      locater.addSchemaSearchPaths(referencePaths);
      referencePaths.forEach((dir) => xmlContext.addSchemaPath(dir));
    }

    try {
      return await this.deserializeECSchemaXmlFile(schemaFilePath, schemaContext, xmlContext, locater);
    } finally {
      IModelHost.shutdown();
    }
  }

  private async deserializeECSchemaXmlFile(schemaPath: string, schemaContext: EC.SchemaContext, xmlContext: ECSchemaXmlContext, locater: StubSchemaFileLocater): Promise<EC.Schema> {
    const directory = path.dirname(schemaPath);
    locater.addSchemaSearchPaths([directory]);

    const stubSchemaContext = new EC.SchemaContext();
    stubSchemaContext.addLocater(locater);

    // Attempt to de-serialize units/formats schema first. They might not be found in the provided reference paths. If not found,
    // and any schema in the graph references them, an "Unable to locate schema XML file" error will occur.
    if (!this._processedStandardSchemas)
      await this.loadStandardSchemas(schemaContext, xmlContext, stubSchemaContext, locater);

    const schemaFileData = await locater.readUtf8FileToString(schemaPath).catch(() => undefined);
    if (!schemaFileData)
      throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, "Unable to locate schema XML file at " + schemaPath);

    const schemaKey = locater.getSchemaKey(schemaFileData);
    const stubSchema = await locater.getSchema(schemaKey, EC.SchemaMatchType.Exact, stubSchemaContext);
    if (stubSchema === undefined)
      throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, `Unable to locate schema XML file for '${schemaKey.name}'`);

    const orderedSchemas = EC.SchemaGraphUtil.buildDependencyOrderedSchemaList(stubSchema!);

    for (const schema of orderedSchemas) {
      if (this._standardSchemasToIgnore.includes(schema.name))
        continue;

      await this.deserializeSchema(schema, schemaContext, xmlContext);
    }

    const result = await schemaContext.getSchema(schemaKey, EC.SchemaMatchType.Exact);
    if (!result)
      throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, `Unable to locate schema ${schemaKey.name} after de-serialization.`);

    return result;
  }

  private async deserializeSchema (stubSchema: EC.Schema, schemaContext: EC.SchemaContext, xmlContext: ECSchemaXmlContext): Promise<EC.Schema> {
    const xmlKey = stubSchema.schemaKey as EC.FileSchemaKey;
    const jsonSchema = xmlContext.readSchemaFromXmlFile(path.normalize(xmlKey.fileName));

    return EC.Schema.fromJson(jsonSchema, schemaContext);
  }

  private async loadStandardSchemas(schemaContext: EC.SchemaContext, xmlContext: ECSchemaXmlContext, stubContext: EC.SchemaContext, locater: StubSchemaFileLocater) {
    if (this._processedStandardSchemas)
      return;

    // must de-serialize Units first
    await this.loadStandardSchema("Units", schemaContext, xmlContext, stubContext, locater);
    await this.loadStandardSchema("Formats", schemaContext, xmlContext, stubContext, locater);

    this._processedStandardSchemas = true;
  }

  private async loadStandardSchema(schemaName: string, schemaContext: EC.SchemaContext, xmlContext: ECSchemaXmlContext, stubContext: EC.SchemaContext, locater: StubSchemaFileLocater) {
    const schemaKey = new EC.SchemaKey(schemaName.toString());
    const existingSchema = await schemaContext.getSchema(schemaKey, EC.SchemaMatchType.Latest);
    if (existingSchema)
      return;

    const stubSchema = await locater.getSchema(schemaKey, EC.SchemaMatchType.Latest, stubContext);
    // the units/formats schema might not be found, which is OK unless
    // a schema references them, in which case the validation will fail
    if (stubSchema === undefined)
      return;

    await this.deserializeSchema(stubSchema, schemaContext, xmlContext);
  }

  private createXmlContext(): ECSchemaXmlContext {
    const xmlContext = new ECSchemaXmlContext();
    xmlContext.setSchemaLocater((_key: SchemaKey) => {
    });
    return xmlContext;
  }
}
