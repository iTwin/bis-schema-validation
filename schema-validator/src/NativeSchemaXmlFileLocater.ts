/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import { ECSchemaXmlContext, IModelHost } from "@bentley/imodeljs-backend";
import * as EC from "@bentley/ecschema-metadata";
import { Config } from "@bentley/imodeljs-clients";

/**
 * A SchemaLocater implementation for locating XML Schema files
 * from the file system using configurable search paths.
 * @internal This is a workaround the current lack of a full xml parser.
 */
export class NativeSchemaXmlFileLocater extends EC.SchemaFileLocater implements EC.ISchemaLocater {

  public constructor() {
    super();

    // Needed to avoid crash in backend when calling IModelHost.startup.  This
    // can be removed once the backed is no longer need for de-serialization.
    (Config as any)._appConfig = new (Config as any)();
    IModelHost.startup();
  }

  /**
   * Attempts to retrieve a Schema with the given SchemaKey by using the configured search paths
   * to locate the XML Schema file from the file system.
   * @param key The SchemaKey of the Schema to retrieve.
   * @param matchType The SchemaMatchType.
   * @param context The SchemaContext that will control the lifetime of the schema.
   */
  public async getSchema<T extends EC.Schema>(key: EC.SchemaKey, matchType: EC.SchemaMatchType, context: EC.SchemaContext): Promise<T | undefined> {
    return this.getSchemaSync(key, matchType, context) as T;
  }

  /**
   * Attempts to retrieve a Schema with the given SchemaKey by using the configured search paths
   * to locate the XML Schema file from the file system.
   * @param key The SchemaKey of the Schema to retrieve.
   * @param matchType The SchemaMatchType.
   * @param context The SchemaContext that will control the lifetime of the schema.
   */
  public getSchemaSync<T extends EC.Schema>(key: EC.SchemaKey, matchType: EC.SchemaMatchType, context: EC.SchemaContext): T | undefined {
    const candidates: EC.FileSchemaKey[] = this.findEligibleSchemaKeys(key, matchType, "xml");

    if (!candidates || candidates.length === 0)
      return undefined;

    const maxCandidate = candidates.sort(this.compareSchemaKeyByVersion)[candidates.length - 1];
    const schemaPath = maxCandidate.fileName;

    // Load the file
    if (!this.fileExistsSync(schemaPath))
      return undefined;

    const schemaText = this.readUtf8FileToStringSync(schemaPath);
    if (!schemaText)
      return undefined;

    if (!this.isEC31Schema(schemaText))
      return undefined;

    this.addSchemaSearchPaths([path.dirname(schemaPath)]);

    const nativeContext = new ECSchemaXmlContext();
    for (const refPath of this.searchPaths) {
      nativeContext.addSchemaPath(refPath);
    }

    try {
    const schemaJson = nativeContext!.readSchemaFromXmlFile(schemaPath);
    return EC.Schema.fromJsonSync(schemaJson, context) as T;
    } catch (err) {
      if (err.message === "ReferencedSchemaNotFound")
        throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, `Unable to load schema '${key.name}'. A referenced schema could not be found.`);
      throw (err);
    }
  }

  /**
   * Constructs a SchemaKey based on the information in the Schema XML.
   * @param data The Schema XML as a string.
   */
  public getSchemaKey(schemaXml: string): EC.SchemaKey {
    const match = schemaXml.match(/<ECSchema.*schemaName="(?<name>\w+)".*version="(?<version>[\d|\.]+)"/) as any;
    if (!match || !match.groups.name || !match.groups.version) {
      throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidSchemaXML, `Could not find the ECSchema 'schemaName' or 'version' tag in the given file.`);
    }

    const key = new EC.SchemaKey(match.groups.name, EC.ECVersion.fromString(match.groups.version));
    return key;
  }

  private isEC31Schema(schemaText: string): boolean {
    return /<ECSchema.*xmlns=".*ECXML.3.1"/.test(schemaText);
  }
}
