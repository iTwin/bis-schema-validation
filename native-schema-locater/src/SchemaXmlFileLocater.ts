/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import { DOMParser } from "xmldom";
import { ECSchemaXmlContext } from "@bentley/imodeljs-backend";
import { FileSchemaKey, SchemaFileLocater } from "@bentley/ecschema-locaters";
import {
  ECObjectsError, ECObjectsStatus, ECVersion, ISchemaLocater, Schema, SchemaContext,
  SchemaGraphUtil, SchemaKey, SchemaMatchType, SchemaReadHelper, XmlParser,
} from "@bentley/ecschema-metadata";

function isECv2Schema(schemaText: string): boolean {
  return /<ECSchema[^>]*xmlns=".*ECXML.2.0"/.test(schemaText);
}

/**
 * A SchemaLocater implementation for locating XML Schema files
 * from the file system using configurable search paths. For EC v31 and v2 schemas, the
 * native context (ECSchemaXmlContext from imodeljs-backend) will used for deserialization.
 * @internal This is a workaround the current lack of a full xml parser.
 */
export class SchemaXmlFileLocater extends SchemaFileLocater implements ISchemaLocater {
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
    return this.loadSchema(key, matchType, context);
  }

  /**
   * Attempts to retrieve a Schema with the given SchemaKey by using the configured search paths
   * to locate the XML Schema file from the file system.
   * @param key The SchemaKey of the Schema to retrieve.
   * @param matchType The SchemaMatchType.
   * @param context The SchemaContext that will control the lifetime of the schema.
   */
  public loadSchema<T extends Schema>(key: SchemaKey, matchType: SchemaMatchType, context: SchemaContext): T | undefined {
    const candidates: FileSchemaKey[] = this.findEligibleSchemaKeys(key, matchType, "xml");

    if (!candidates || candidates.length === 0)
      return undefined;

    const maxCandidate = candidates.sort(this.compareSchemaKeyByVersion)[candidates.length - 1];
    const schemaPath = maxCandidate.fileName;

    return this.loadSchemaFromFile(schemaPath, context, key);
  }

  /**
   * Attempts to load a Schema from an XML file from the given file path.
   * @param schemaPath The path to a valid ECXml schema file.
   * @param context The SchemaContext that will control the lifetime of the schema.
   */
  public loadSchemaFromFile<T extends Schema>(schemaPath: string, context: SchemaContext, key?: SchemaKey): T | undefined {
    // Load the file
    if (!this.fileExistsSync(schemaPath))
      return undefined;

    const schemaText = this.readUtf8FileToStringSync(schemaPath);
    if (!schemaText)
      return undefined;

    if (undefined === key)
      key = this.getSchemaKey(schemaText);

    this.addSchemaSearchPaths([path.dirname(schemaPath)]);

    if (this.isEC31Schema(schemaText) || isECv2Schema(schemaText)) {
      return this.getSchemaFromNativeEnv(key, schemaText, schemaPath, context) as T;
    }

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
    if (isECv2Schema(schemaXml))
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

  private getSchemaFromNativeEnv(schemaKey: SchemaKey, schemaText: string, schemaPath: string, context: SchemaContext): Schema {
    const nativeContext = new ECSchemaXmlContext();
    for (const refPath of this.searchPaths) {
      nativeContext.addSchemaPath(refPath);
    }

    const stubLocater = new StubSchemaXmlFileLocater();
    stubLocater.addSchemaSearchPaths(this.searchPaths);

    this.preloadUnitsFormatsSchema(stubLocater, context, nativeContext);

    const schemaStub = stubLocater.loadSchema(schemaText, schemaPath);
    const orderedSchemas = SchemaGraphUtil.buildDependencyOrderedSchemaList(schemaStub);

    this.loadSchemasFromNative(orderedSchemas, schemaKey, context, nativeContext, SchemaMatchType.LatestWriteCompatible);

    // Schema should always be found (!) as it was just added to the context above.
    return context.getSchemaSync(schemaStub.schemaKey)!;
  }

  private preloadUnitsFormatsSchema(locater: ISchemaLocater, context: SchemaContext, nativeContext: ECSchemaXmlContext) {
    const formatsKey = new SchemaKey("Formats", 1, 0, 0);
    if (context.getCachedSchemaSync(formatsKey, SchemaMatchType.LatestWriteCompatible))
      return;

    const stubContext = new SchemaContext();
    stubContext.addLocater(locater);

    // If the Formats schema can't be found, proceed with locating schemas. If it's actually
    // required, errors will occur later on in the process
    const schemaStub = locater.getSchemaSync(formatsKey, SchemaMatchType.LatestWriteCompatible, stubContext);
    if (!schemaStub) {
      // eslint-disable-next-line no-console
      console.log("The Formats schema could not be found. This may result in errors if the EC 3.1 schema requires it.");
      return;
    }

    const orderedSchemas = SchemaGraphUtil.buildDependencyOrderedSchemaList(schemaStub);
    this.loadSchemasFromNative(orderedSchemas, formatsKey, context, nativeContext, SchemaMatchType.LatestWriteCompatible);
  }

  private loadSchemasFromNative(schemaStubs: Schema[], parentSchema: SchemaKey, context: SchemaContext, nativeContext: ECSchemaXmlContext, matchType: SchemaMatchType) {
    for (const currentStub of schemaStubs) {
      try {
        // If schema is already in the context skip it
        if (context.getCachedSchemaSync(currentStub.schemaKey, matchType))
          continue;

        const xmlKey = currentStub.schemaKey as FileSchemaKey;
        const schemaJson = nativeContext!.readSchemaFromXmlFile(xmlKey.fileName);
        Schema.fromJsonSync(schemaJson, context);
      } catch (err) {
        if (err.message === "ReferencedSchemaNotFound")
          throw new ECObjectsError(ECObjectsStatus.UnableToLocateSchema, `Unable to load schema '${parentSchema.name}'. A referenced schema could not be found.`);
        throw (err);
      }
    }
  }

  private isEC31Schema(schemaText: string): boolean {
    return /<ECSchema[^>]*xmlns=".*ECXML.3.1"/.test(schemaText);
  }
}

/**
 * A SchemaLocater implementation for locating XML Schema files
 * from the file system using configurable search paths. Returns only
 * Schemas from XML files with their keys populated.
 * @internal This is a workaround the current lack of a full xml parser.
 */
class StubSchemaXmlFileLocater extends SchemaFileLocater implements ISchemaLocater {
  /**
   * Loads a Schema from disk as a Promise.
   * @param schemaPath The path to the Schema file.
   * @param context The SchemaContext that will control the lifetime of the schema.
   */
  public loadSchema(schemaText: string, schemaPath: string): Schema {
    this.addSchemaSearchPaths([path.dirname(schemaPath)]);
    const key = this.getSchemaKey(schemaText);
    const alias = this.getSchemaAlias(schemaText);
    const context = new SchemaContext();
    context.addLocater(this);

    // Load the schema and return it
    const schema = new Schema(context, new FileSchemaKey(key, schemaPath, schemaText), alias);
    this.addSchemaReferences(schema, context, SchemaMatchType.LatestWriteCompatible);
    return schema;
  }

  /**
   * Attempts to retrieve a Schema with the given SchemaKey by using the configured search paths
   * to locate the XML Schema file from the file system. Returns only Schemas from XML files with
   * their keys populated.
   * @param key The SchemaKey of the Schema to retrieve.
   * @param matchType The SchemaMatchType.
   * @param context The SchemaContext that will control the lifetime of the schema.
   */
  public async getSchema<T extends Schema>(key: SchemaKey, matchType: SchemaMatchType, context: SchemaContext): Promise<T | undefined> {
    return this.getSchemaSync(key, matchType, context) as T;
  }

  /**
   * Attempts to retrieve a Schema with the given SchemaKey by using the configured search paths
   * to locate the XML Schema file from the file system. Returns only Schemas from XML files with
   * their keys populated.
   * @param key The SchemaKey of the Schema to retrieve.
   * @param matchType The SchemaMatchType.
   * @param context The SchemaContext that will control the lifetime of the schema.
   */
  public getSchemaSync<T extends Schema>(key: SchemaKey, matchType: SchemaMatchType, context: SchemaContext): T | undefined {
    const candidates: FileSchemaKey[] = this.findEligibleSchemaKeys(key, matchType, "xml");

    if (!candidates || candidates.length === 0)
      return undefined;

    const maxCandidate = candidates.sort(this.compareSchemaKeyByVersion)[candidates.length - 1];
    const alias = this.getSchemaAlias(maxCandidate.schemaText!);
    const schema = new Schema(context, maxCandidate, alias) as T;
    context.addSchemaSync(schema);

    this.addSchemaReferences(schema, context, SchemaMatchType.LatestWriteCompatible);
    return schema;
  }

  /**
   * Constructs a SchemaKey based on the information in the Schema XML.
   * @param schemaXml The Schema XML as a string.
   */
  public getSchemaKey(schemaXml: string): SchemaKey {
    const match = schemaXml.match(/<ECSchema.*schemaName="(?<name>\w+)".*version="(?<version>[\d|\.]+)"/) as any;
    if (!match || !match.groups.name || !match.groups.version) {
      throw new ECObjectsError(ECObjectsStatus.InvalidSchemaXML, `Could not find the ECSchema 'schemaName' or 'version' tag in the given file.`);
    }

    let ecVersion: ECVersion;
    if (isECv2Schema(schemaXml))
      ecVersion = SchemaXmlFileLocater.fromECv2String(match.groups.version);
    else
      ecVersion = ECVersion.fromString(match.groups.version);

    const key = new SchemaKey(match.groups.name, ecVersion);
    return key;
  }

  /**
   * Gets an array of SchemaKeys of the Schemas referenced by the given Schema.
   * @param xmlSchemaKey The SchemaKey of the parent Schema containing the references.
   */
  private getSchemaReferenceKeys(schemaKey: FileSchemaKey): SchemaKey[] {
    return this._getSchemaReferenceKeys(schemaKey);
  }

  /**
   * Adds schemas to the references collection for the given Schema by locating
   * the referenced schemas.
   * @param schema The schema for which to add the references.
   * @param context The SchemaContext that will control the lifetime of the schema.
   * @param refMatchType The SchemaMatchType to use when locating schema references.
   */
  private addSchemaReferences(schema: Schema, context: SchemaContext, refMatchType: SchemaMatchType): void {
    const refKeys = this.getSchemaReferenceKeys(schema.schemaKey as FileSchemaKey);

    for (const key of refKeys) {
      const refSchema = context ? context.getSchemaSync(key, refMatchType) : undefined;
      if (!refSchema)
        throw new ECObjectsError(ECObjectsStatus.UnableToLocateSchema, `Unable to locate referenced schema: ${key.name}.${key.readVersion}.${key.writeVersion}.${key.minorVersion}`);

      schema.references.push(refSchema);
    }
  }

  /**
   * Gets an array of SchemaKeys of the Schemas referenced by the given Schema.
   * @param data The Schema XML string.
   */
  private _getSchemaReferenceKeys(xmlSchemaKey: FileSchemaKey): SchemaKey[] {
    const file = xmlSchemaKey.schemaText;

    if (!file)
      throw new ECObjectsError(ECObjectsStatus.UnableToLocateSchema, `Could not locate the schema file, ${xmlSchemaKey.fileName}, for the schema ${xmlSchemaKey.name}`);

    const data = file.toString().replace(/(\s*)<!--.*?-->/g, ""); // ignore any comments in the XML file when getting the array of SchemaKeys

    const keys: SchemaKey[] = [];
    const matches = data.match(/<ECSchemaReference ([^]+?)\/>/g);
    if (!matches)
      return keys;

    for (const match of matches) {
      const name = match.match(/name="(.+?)"/);
      const versionMatch = match.match(/version="(.+?)"/);
      if (!name || name.length !== 2 || !versionMatch || versionMatch.length !== 2)
        throw new ECObjectsError(ECObjectsStatus.InvalidSchemaXML, `Invalid ECSchemaReference xml encountered in the schema file`);

      // write version maybe missing, so insert "0"
      let versionString = versionMatch[1];
      const versionParts = versionString.split(".");
      if (versionParts.length === 2)
        versionParts.splice(1, 0, "0");

      versionString = versionParts.join(".");

      const key = new SchemaKey(name[1], ECVersion.fromString(versionString));
      keys.push(key);
    }

    return keys;
  }

  /**
   * Gets the Schema alias from the Schema XML.
   * @param data The Schema XML as a string.
   */
  private getSchemaAlias(schemaXml: string): string {
    let match: any;

    if (isECv2Schema(schemaXml)) {
      match = schemaXml.match(/<ECSchema.*nameSpacePrefix="(?<alias>\w+)"/) as any;
    } else {
      match = schemaXml.match(/<ECSchema.*alias="(?<alias>\w+)"/) as any;
    }

    if (!match || !match.groups.alias) {
      throw new ECObjectsError(ECObjectsStatus.InvalidSchemaXML, `Could not find the ECSchema 'alias' tag in the given file.`);
    }

    return match.groups.alias;
  }
}
