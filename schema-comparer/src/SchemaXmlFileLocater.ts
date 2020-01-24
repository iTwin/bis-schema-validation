/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import { DOMParser } from "xmldom";
import { ECSchemaXmlContext } from "@bentley/imodeljs-backend";
import { FileSchemaKey, SchemaFileLocater } from "@bentley/ecschema-locaters";
import { ISchemaLocater, SchemaMatchType, Schema, SchemaKey, SchemaContext, SchemaReadHelper,
  ECObjectsError, ECObjectsStatus, XmlParser, ECVersion } from "@bentley/ecschema-metadata";

/**
 * A SchemaLocater implementation for locating XML Schema files
 * from the file system using configurable search paths. For EC v31 and v2 schemas, the
 * native context (ECSchemaXmlContext from imodeljs-backend) will used for deserialization.
 * The [[SchemaMatchType]] can be specified in the constructor which will override the match
 * type specified in the [[SchemaXmlFileLocater.getSchema]] method.
 * @internal This is a workaround the current lack of a full xml parser.
 */
export class SchemaXmlFileLocater extends SchemaFileLocater implements ISchemaLocater {
  private _matchType?: SchemaMatchType;

  /**
   * Initializes a new [[SchemaXmlFileLocater]] object.
   * @param matchType If specified, the SchemaMatchType will override the match type specified
   * in subsequent calls to [[SchemaXmlFileLocater.getSchema]].
   */
  constructor(matchType?: SchemaMatchType) {
    super();
    this._matchType = matchType;
  }

  /**
   * Attempts to retrieve a Schema with the given SchemaKey by using the configured search paths
   * to locate the XML Schema file from the file system.
   * @param key The SchemaKey of the Schema to retrieve.
   * @param matchType The SchemaMatchType.
   * @param context The SchemaContext that will control the lifetime of the schema.
   */
  public async getSchema<T extends Schema>(key: SchemaKey, matchType: SchemaMatchType, context: SchemaContext): Promise<T | undefined> {
    return this.getSchemaSync(key, matchType, context) as T;
  }

  /**
   * Attempts to retrieve a Schema with the given SchemaKey by using the configured search paths
   * to locate the XML Schema file from the file system. If the SchemaMatchType was specified in
   * the constructor, the matchType parameter will be ignored.
   * @param key The SchemaKey of the Schema to retrieve.
   * @param matchType The SchemaMatchType.
   * @param context The SchemaContext that will control the lifetime of the schema.
   */
  public getSchemaSync<T extends Schema>(key: SchemaKey, matchType: SchemaMatchType, context: SchemaContext): T | undefined {
    matchType = this._matchType ? this._matchType : matchType;
    const candidates: FileSchemaKey[] = this.findEligibleSchemaKeys(key, matchType, "xml");

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

    this.addSchemaSearchPaths([path.dirname(schemaPath)]);

    if (this.isEC31Schema(schemaText) || this.isECv2Schema(schemaText))
      return this.getSchemaFromNativeEnv(key, context, schemaPath) as T;

    const parser = new DOMParser();
    const reader = new SchemaReadHelper(XmlParser, context);

    const document = parser.parseFromString(schemaText);

    let schema: Schema = new Schema(context);
    schema = reader.readSchemaSync(schema, document);

    return schema as T;
  }

  /**
   * Constructs a SchemaKey based on the information in the Schema XML.
   * @param data The Schema XML as a string.
   */
  public getSchemaKey(schemaXml: string): SchemaKey {
    const match = schemaXml.match(/<ECSchema.*schemaName="(?<name>\w+)".*version="(?<version>[\d|\.]+)"/) as any;
    if (!match || !match.groups.name || !match.groups.version) {
      throw new ECObjectsError(ECObjectsStatus.InvalidSchemaXML, `Could not find the ECSchema 'schemaName' or 'version' tag in the given file.`);
    }

    let ecVersion: ECVersion;
    if (this.isECv2Schema(schemaXml))
      ecVersion = SchemaXmlFileLocater.fromECv2String(match.groups.version);
    else
      ecVersion = ECVersion.fromString(match.groups.version);

    const key = new SchemaKey(match.groups.name, ecVersion);
    return key;
  }

  /**
   * Parses a valid EC 2.0 version string and returns an ECVersion object. The second digit becomes the minor version,
   * and a zero is inserted as the 'write' digit. Example: "1.1" -> "1.0.1".
   * @param versionString A valid EC 2.0 version string of the format, 'RR.mm'.
   */
  public static fromECv2String(versionString: string): ECVersion {
    const [read, minor] = versionString.split(".");

    if (!read)
      throw new ECObjectsError(ECObjectsStatus.InvalidECVersion, `The read version is missing from version string, ${versionString}`);

    if (!minor)
      throw new ECObjectsError(ECObjectsStatus.InvalidECVersion, `The minor version is missing from version string, ${versionString}`);

    return new ECVersion(+read, 0, +minor);
  }

  private getSchemaFromNativeEnv(key: SchemaKey, context: SchemaContext, schemaPath: string): Schema {
    const nativeContext = new ECSchemaXmlContext();
    for (const refPath of this.searchPaths) {
      nativeContext.addSchemaPath(refPath);
    }

    try {
      const schemaJson = nativeContext!.readSchemaFromXmlFile(schemaPath);
      return Schema.fromJsonSync(schemaJson, context);
    } catch (err) {
      if (err.message === "ReferencedSchemaNotFound")
        throw new ECObjectsError(ECObjectsStatus.UnableToLocateSchema, `Unable to load schema '${key.name}'. A referenced schema could not be found.`);
      throw (err);
    }
  }

  private isEC31Schema(schemaText: string): boolean {
    return /<ECSchema[^>]*xmlns=".*ECXML.3.1"/.test(schemaText);
  }

  private isECv2Schema(schemaText: string): boolean {
    return /<ECSchema[^>]*xmlns=".*ECXML.2.0"/.test(schemaText);
  }
}
