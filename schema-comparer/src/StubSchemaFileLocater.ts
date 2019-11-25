/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { Schema, SchemaKey, ECVersion, SchemaMatchType, SchemaFileLocater, FileSchemaKey, ECObjectsError, ECObjectsStatus, SchemaContext, ISchemaLocater } from "@bentley/ecschema-metadata";

/**
 * A SchemaLocater implementation for locating XML Schema files
 * from the file system using configurable search paths. Returns only
 * Schemas from XML files with their keys populated.
 * @internal This is a workaround the current lack of a full xml parser.
 */
export class StubSchemaFileLocater extends SchemaFileLocater implements ISchemaLocater {
  /**
   * Gets an array of SchemaKeys of the Schemas referenced by the given Schema.
   * @param xmlSchemaKey The SchemaKey of the parent Schema containing the references.
   */
  public getSchemaReferenceKeys(schemaKey: FileSchemaKey): SchemaKey[] {
    return this._getSchemaReferenceKeys(schemaKey);
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
    const candidates: FileSchemaKey[] = this.findEligibleSchemaKeys(key, matchType, "xml");

    if (!candidates || candidates.length === 0)
      return undefined;

    const maxCandidate = candidates.sort(this.compareSchemaKeyByVersion)[candidates.length - 1];

    const schema = new Schema(context, maxCandidate, maxCandidate.name) as T;
    await context.addSchema(schema);
    await this.addSchemaReferences(schema, context);
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
  public getSchemaSync<T extends Schema>(_key: SchemaKey, _matchType: SchemaMatchType, _context: SchemaContext): T | undefined {
    throw new Error("not implemented");
  }

  /**
   * Adds schemas to the references collection for the given Schema by locating
   * the referenced schemas.
   * @param schema The schema for which to add the references.
   */
  public async addSchemaReferences(schema: Schema, context?: SchemaContext): Promise<void> {
    const refKeys = this.getSchemaReferenceKeys(schema.schemaKey as FileSchemaKey);

    for (const key of refKeys) {
      /* TODO: Re-implement once references collection is an array of Promises.
      const promise = new Promise<Schema>(async () => {
        return await this.getSchema(key, SchemaMatchType.LatestReadCompatible);
      });
      const refSchema = await promise;
      if (refSchema)
        schema.references.push(refSchema);
        */

      const refSchema = context ? await context.getSchema(key, SchemaMatchType.LatestReadCompatible) : undefined;
      if (!refSchema)
        throw new ECObjectsError(ECObjectsStatus.UnableToLocateSchema, `Unable to locate referenced schema: ${key.name}.${key.readVersion}.${key.writeVersion}.${key.minorVersion}`);

      schema.references.push(refSchema);
    }
  }

  /**
   * Constructs a SchemaKey based on the information in the Schema XML.
   * @param data The Schema XML as a string.
   */
  public getSchemaKey(data: string): SchemaKey {
    const matches = data.match(/<ECSchema ([^]+?)>/g);
    if (!matches || matches.length !== 1)
      throw new ECObjectsError(ECObjectsStatus.InvalidSchemaXML, `Could not find '<ECSchema>' tag in the given file`);

    const name = matches[0].match(/schemaName="(.+?)"/);
    const version = matches[0].match(/version="(.+?)"/);
    if (!name || name.length !== 2 || !version || version.length !== 2)
      throw new ECObjectsError(ECObjectsStatus.InvalidSchemaXML, `Could not find the ECSchema 'schemaName' or 'version' tag in the given file`);

    const key = new SchemaKey(name[1], ECVersion.fromString(version[1]));
    return key;
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
}
