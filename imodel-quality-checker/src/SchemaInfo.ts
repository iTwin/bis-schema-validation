/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import { BriefcaseDb, SnapshotDb, SqliteStatement } from "@bentley/imodeljs-backend";
import { SchemaJsonFileLocater } from "@bentley/ecschema-locaters";
import { Schema, SchemaContext } from "@bentley/ecschema-metadata";

/**
 * Provides Information about a schemas classes properties count
 */
export interface PropertiesCountInfo {
  Max: number;
  Min: number;
  Avg: number;
}

/**
 * Provides Information about schema, its class and property
 */
export interface MetaData {
  schemaName: string;
  className: string;
  propertyCount: number;
}

/**
 * Array containing names of standard schemas
 */
export const standardSchemaNames = [
  "Bentley_Standard_CustomAttributes",
  "Bentley_Standard_Classes",
  "Bentley_ECSchemaMap",
  "EditorCustomAttributes",
  "Bentley_Common_Classes",
  "Dimension_Schema",
  "iip_mdb_customAttributes",
  "KindOfQuantity_Schema",
  "rdl_customAttributes",
  "SIUnitSystemDefaults",
  "Unit_Attributes",
  "Units_Schema",
  "USCustomaryUnitSystemDefaults",
  "ECDbMap",
  "CoreCustomAttributes", // New EC3 Standard Schema
  "ECv3ConversionAttributes", // New EC2 Standard Schema
  "SchemaLocalizationCustomAttributes", // New EC3 Standard Schema
  "Units", // New EC3 Standard Schema
  "Formats", // New EC3 Standard Schema
];

/**
 * SchemaInfo provides information about the schemas within an iModel
 */
export class SchemaInfo {

  /**
   * Checks if a schema is a standard schema or not
   * @param schema: It is the schema object.
   * @returns Boolean based upon the result.
   */
  public static isStandardSchema(schema: Schema) {
    return standardSchemaNames.includes(schema.name);
  }

  /**
   * Gets the schema names which are present within an iModel
   * @param iModel: It is the opened briefcase.
   * @returns: Array of schema names.
   */
  public static async getSchemaNames(iModel: BriefcaseDb | SnapshotDb): Promise<string[]> {
    const schemaNames: string[] = [];
    const queryNames = iModel.query("select name as schemaName from ECDbMeta.ECSchemaDef");
    for await (const name of queryNames) {
      schemaNames.push(name.schemaName);
    }
    return schemaNames;
  }

  /**
   * Extracts the schema json from iModel
   * @param iModel: It is the opened briefcase.
   * @param schemaName: The name of schema.
   * @returns: The Json file.
   */
  public static async getSchemaJson(iModel: BriefcaseDb | SnapshotDb, schemaName: string) {
    const schemaJson = iModel.nativeDb.getSchema(schemaName);
    if (!schemaJson.result)
      throw new Error("Schema is empty.");
    if (schemaJson.error)
      throw new Error(schemaJson.error.message);
    return schemaJson.result;
  }

  /**
   * Save the schema json locally
   * @param iModel: It is the opened briefcase.
   * @param schemaName: The name of schema.
   * @param schemaDir: The directory where schema json will be saved.
   */
  public static async saveSchemaJson(iModel: BriefcaseDb | SnapshotDb, schemaName: string, schemaDir: string) {
    const jsonData = await SchemaInfo.getSchemaJson(iModel, schemaName);
    const jsonFile = path.join(schemaDir, schemaName + ".ecschema.json");
    fs.writeFileSync(jsonFile, jsonData);
  }

  /**
   * Get the schema object
   * @param schemaDir: The directory where schema json will be saved.
   * @param schemaFile The filename of the schema json.
   * @returns The schema object.
   */
  public static getSchema(schemaDir: string, schemaFile: string): Schema {
    const filePath = path.join(schemaDir, schemaFile);
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const context = new SchemaContext();
    const locater: SchemaJsonFileLocater = new SchemaJsonFileLocater();
    locater.addSchemaSearchPath(schemaDir);
    context.addLocater(locater);
    return Schema.fromJsonSync(jsonData, context);
  }

  /**
   * Get the property count of each class of a schema
   * @param schema: Its the schema object
   * @returns The array containing information about schema name, class name and property count.
   */
  public static getMetaData(schema: Schema): MetaData[] {
    const result: MetaData[] = [];
    if (schema !== undefined) {
      for (const item of schema.getClasses()) {
        const properties = item.getPropertiesSync().map((property) => property.name);
        const propertyInfo: MetaData = { schemaName: schema.fullName, className: String(item.name), propertyCount: Number(properties.length) };
        result.push(propertyInfo);
      }
    } else {
      new Error("SChema is undefined.");
    }
    return result;
  }

  /**
   * Generate the information about Minimum, Maximum and Average values of properties counts within a schema based upon its classes
   * @param propertiesMetaData: Array containing information about schemaName, className and propertyCount of all classes within a schema
   * @returns an object containing information about Minimum, Maximum and Average values of properties counts within a schema based upon its classes
   */
  public static getSchemaPropertiesCountInfo(propertiesMetaData: MetaData[]) {
    let totalClasses: number = 0;
    let totalProperties: number = 0;
    let propertiesCount: number[] = [];

    propertiesMetaData.forEach((classObj) => {
      totalClasses = totalClasses + 1;
      totalProperties = totalProperties + classObj.propertyCount;
      propertiesCount.push(classObj.propertyCount);
    });

    propertiesCount = propertiesCount.sort((a, b) => a - b);
    const propertiesCountInfo: PropertiesCountInfo = {
      Max: propertiesCount[propertiesCount.length - 1],
      Avg: totalProperties / totalClasses,
      Min: propertiesCount[0],
    };
    return propertiesCountInfo;
  }

  /**
   * Sort the MetaDeta objects based upon the property count
   * @param metaData Array containing object having information about schemaName, className and propertyCount of all classes within a schema
   * @returns sorted metadata information
   */
  public static sortMetaDataByPropertyCount(metaData: MetaData[]) {
    const sortedMetaData: MetaData[] = metaData.sort((a, b) => a.propertyCount - b.propertyCount).reverse();
    return sortedMetaData;
  }

  /**
   * Get overflow table names present within an iModel.
   * @param iModel It is the opened briefcase.
   * @returns A list containing table names.
   */
  public static getOverflowTables(iModel: BriefcaseDb | SnapshotDb): string[] {
    let tableCount;
    const tableNames: string[] = [];
    iModel.withPreparedSqliteStatement("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name like '%_Overflow'", (stmt: SqliteStatement) => {
      stmt.step();
      tableCount = stmt.getRow().count;
    });

    iModel.withPreparedSqliteStatement("SELECT name FROM sqlite_master WHERE type='table' AND name like '%_Overflow'",
      (stmt: SqliteStatement) => {
        for (let index = 0; index < tableCount; index++) {
          stmt.step();
          const val1: any = stmt.getRow();
          tableNames.push(val1.name);
        }
      });
    return tableNames;
  }

  /**
   * Find the number of columns in the overflow table
   * @param iModel It is the opened briefcase.
   * @param tableName Name of overflow table
   * @returns The column count of a overflow table
   */
  public static getOverflowTableColumnCount(iModel: BriefcaseDb | SnapshotDb, tableName: string) {
    let columnCount;
    iModel.withPreparedSqliteStatement("SELECT * FROM " + tableName, (stmt: SqliteStatement) => {
      stmt.step();
      columnCount = stmt.getColumnCount();
    });
    return columnCount;
  }
}
