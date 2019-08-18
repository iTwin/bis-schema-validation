/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as fs from "fs";
import * as EC from "@bentley/ecschema-metadata";
import { DOMParser } from "xmldom";
import { ISchemaLocater } from "@bentley/ecschema-metadata/lib/Context";
import { ECSchemaXmlContext, IModelHost } from "@bentley/imodeljs-backend";
import { Config } from "@bentley/imodeljs-clients";

class SchemaBackendFileLocater extends EC.SchemaFileLocater implements ISchemaLocater {
  private _nativeContext: ECSchemaXmlContext;

  public constructor(nativeContext: ECSchemaXmlContext) {
    super();
    this._nativeContext = nativeContext;
  }

  /**
   * Async version of getSchemaSync()
   * @param key The schema key needed to locate the schema in the search path
   * @param matchType The SchemaMatchType
   * @param context The schema context used to parse schema
   */
  public async getSchema<T extends EC.Schema>(key: EC.SchemaKey, matchType: EC.SchemaMatchType, context: EC.SchemaContext): Promise<T | undefined> {
    return this.getSchemaSync(key, matchType, context) as T;
  }

  /**
   * Attempt to retrieve a schema with the given schema key by using the configured search path.
   * @param key The schema key needed to locate the schema in the search path
   * @param matchType The SchemaMatchType
   * @param context The schema context used to parse schema
   */
  public getSchemaSync<T extends EC.Schema>(key: EC.SchemaKey, matchType: EC.SchemaMatchType, context: EC.SchemaContext): T | undefined {
    const visited: Set<string> = new Set<string>();
    const localPath: Set<string> = new Set<string>();
    return this.getSchemaRecursively(key, matchType, context, visited, localPath);
  }

  /**
   * Retrieve the schema key from schema Xml file. It looks very similar to SchemaXmlFileLocater.getSchemaKey(string):EC.SchemaKey but not quite.
   * Because the schema version in EC.3.1 and below doesn't contain write version, we will have to manually add
   * 0 as a write version for it before converting to schema key
   * @param data content of the schema Xml file
   */
  public getSchemaKey(data: string): EC.SchemaKey {
    const matches = data.match(/<ECSchema ([^]+?)>/g);
    if (!matches || matches.length !== 1)
      throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidSchemaXML, `Could not find '<ECSchema>' tag in the given file`);

    // parse name and version
    const name = matches[0].match(/schemaName="(.+?)"/);
    const version = matches[0].match(/version="(.+?)"/);
    if (!name || name.length !== 2 || !version || version.length !== 2)
      throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidSchemaXML, `Could not find the ECSchema 'schemaName' or 'version' tag in the given file`);

    const versionStr: string = this.resolveECVersionString(version[1]);
    const key = new EC.SchemaKey(name[1], EC.ECVersion.fromString(versionStr));
    return key;
  }

  /**
   * Attempt to retrieve a schema with the given schema key by using the configured search path. The locater will attempt to parse all the references first
   * before parsing the current schema. That way, both the native and ts side context will have all references needed to parse the current schema.
   * In case of cyclic dependency, it will throw error
   * @param key The schema key needed to locate the schema in the search path
   * @param matchType The SchemaMatchType
   * @param context The schema context used to parse schema
   * @param visited All the references that are visited
   * @param localPath The path of the recursion is following used to detect cyclic dependency
   */
  private getSchemaRecursively<T extends EC.Schema>(key: EC.SchemaKey, matchType: EC.SchemaMatchType, context: EC.SchemaContext, visited: Set<string>, localPath: Set<string>): T | undefined {
    // load the schema file
    const candidates: EC.FileSchemaKey[] = this.findEligibleSchemaKeys(key, matchType, "xml");
    if (0 === candidates.length)
      return undefined;

    const maxCandidate = candidates.sort(this.compareSchemaKeyByVersion)[candidates.length - 1];
    const schemaPath = maxCandidate.fileName;
    if (undefined === this.fileExistsSync(schemaPath))
      return undefined;

    // mark that schema is already visited
    const schemaKeyName = maxCandidate.toString();
    visited.add(schemaKeyName);
    localPath.add(schemaKeyName);

    // resolve all the references before beginning parsing the current schema
    const domParser: DOMParser = new DOMParser();
    const schemaXmlDocument: Document = domParser.parseFromString(fs.readFileSync(schemaPath, "utf8"));
    const referenceKeys: EC.SchemaKey[] = this.getReferenceSchemaKeys(schemaXmlDocument);
    for (const referenceKey of referenceKeys) {
      const referenceKeyName = referenceKey.toString();

      // jump to the next reference if it is not visited. If it is, check if the current schema refers back to other visited schema node
      if (!visited.has(referenceKeyName)) {
        const referenceSchema = this.getSchemaRecursively(referenceKey, matchType, context, visited, localPath);
        if (!referenceSchema) {
          throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema,
            `Could not locate reference schema, ${referenceKey.name}.${referenceKey.version.toString()} of schema ${key.name}.${key.version.toString()}`);
        }
      } else if (localPath.has(referenceKeyName)) {
        throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidSchemaXML, `Schema ${schemaKeyName} and ${referenceKeyName} form cyclic dependency`);
      }
    }

    localPath.delete(schemaKeyName);

    // it should be safe to parse the current schema because all the references are in the native context and the TS side schema context at this point
    const schemaJson = this._nativeContext.readSchemaFromXmlFile(schemaPath);
    return EC.Schema.fromJsonSync(schemaJson, context) as T;
  }

  /**
   * Retrieve the reference schema keys by parsing the current Schema XML DOM
   * @param schemaXmlDocument Current schema XML DOM document
   */
  private getReferenceSchemaKeys(schemaXmlDocument: Document): EC.SchemaKey[] {
    const referenceDocuments = schemaXmlDocument.getElementsByTagName("ECSchemaReference");
    const referenceSchemaKeys: EC.SchemaKey[] = [];

    // unfortunately, for-of loop cannot work with HTMLCollectionOf<Element> type here
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < referenceDocuments.length; ++i) {
      const element = referenceDocuments[i];
      const name = this.getRequiredXmlAttribute(element, "name",
        "The schema has an invalid ECSchemaReference attribute. One of the reference is missing the 'name' attribute");
      let version = this.getRequiredXmlAttribute(element, "version",
        "The schema has an invalid ECSchemaReference attribute. One of the reference is missing the 'version' attribute");
      version = this.resolveECVersionString(version);

      const key = new EC.SchemaKey(name, EC.ECVersion.fromString(version));
      referenceSchemaKeys.push(key);
    }

    return referenceSchemaKeys;
  }

  /**
   * Retrieve the value of the attribute in the DOM Element
   * @param xmlElement The DOM Element
   * @param attribute The required attribute name of the DOM Element
   * @param errorMessage The error message if there is no attribute found in the DOM Element
   */
  private getRequiredXmlAttribute(xmlElement: Element, attribute: string, errorMessage: string): string {
    const value = xmlElement.getAttribute(attribute);
    if (!value)
      throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidSchemaXML, errorMessage);

    return value;
  }

  /**
   * Attempt to check the ECVersion. If the ECVersion contains only read and minor version, it will add 00 to the write version.
   * Error will be thrown if the version format doesn't contain at least the read and minor version
   * @param version raw ECVersion string retrieved from the Schema XML DOM Element
   */
  private resolveECVersionString(version: string): string {
    // check that version at leasts contain read and write number. If so, add 00 to the minor version if there is none existed in the version
    let versionNumbers: string[] = version.split(".");
    if (versionNumbers.length < 2)
      throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidSchemaXML, `'version' number does not at least have read and minor number in the given file`);
    else if (versionNumbers.length === 2) {
      versionNumbers.push("00");
      const [readNumber, minorNumber, writeNumber] = versionNumbers;
      versionNumbers = [readNumber, writeNumber, minorNumber];
    }

    return versionNumbers.join(".");
  }
}

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
    // If the schema file doesn't exist, throw an error
    if (!fs.existsSync(schemaFilePath))
      throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, "Unable to locate schema XML file at " + schemaFilePath);

    // Needed to avoid crash in backend when calling IModelHost.startup.  This
    // can be removed once the backed is no longer need for de-serialization.
    (Config as any)._appConfig = new (Config as any)();
    IModelHost.startup();

    // add reference paths to the native context
    if (!referencePaths)
      referencePaths = [];
    referencePaths.push(path.dirname(schemaFilePath));

    const nativeContext = new ECSchemaXmlContext();
    const locater = new SchemaBackendFileLocater(nativeContext);
    for (const refPath of referencePaths) {
      locater.addSchemaSearchPath(refPath);
      nativeContext.addSchemaPath(refPath);
    }

    // parsing the current xml schema
    let schema: EC.Schema | undefined;
    try {
      const schemaKey = locater.getSchemaKey(fs.readFileSync(schemaFilePath, "utf8"));
      schema = locater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, schemaContext);
    } finally {
      IModelHost.shutdown();
    }

    return schema!;
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

    const locater = new EC.SchemaJsonFileLocater();
    locater.addSchemaSearchPaths(referencePaths);
    context.addLocater(locater);

    // If the file cannot be parsed, throw an error.
    const schemaString = fs.readFileSync(schemaFilePath, "utf8");
    let schemaJson: any;
    try {
      schemaJson = JSON.parse(schemaString);
    } catch (e) {
      throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidECJson, e.message);
    }
    return EC.Schema.fromJson(schemaJson, context);
  }
}
