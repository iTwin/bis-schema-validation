/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as readdirp from "readdirp";

/**
 * Find released schemas directories
 * @schemaDirectory Directory to search for schema files
 * @returns Array containing released schemas directories
 */
export async function generateSchemaDirectoryLists(schemaDirectory: string): Promise<string[]> {
  const filter: any = { fileFilter: "*.ecschema.xml", directoryFilter: ["!node_modules", "!.vscode", "!tools"] };
  const allSchemaDirs = (await readdirp.promise(schemaDirectory, filter)).map((schemaPath) => path.dirname(schemaPath.fullPath));
  return Array.from(new Set(allSchemaDirs.filter((schemaDir) => /released/i.test(schemaDir))).keys());
}

/**
 * Provides a list of schemas to exclude from validation
 */
export async function getExcludeSchemaList() {
  const ignoreListJson = path.resolve(__dirname, "./ignoreSchemaList.json");

  if (!fs.existsSync(ignoreListJson)) {
    console.log("File not found: ", ignoreListJson);
    return;
  }

  const rawdata = fs.readFileSync(ignoreListJson, "utf8");
  const schemas = JSON.parse(rawdata);
  return schemas;
}

/**
 * Checks if a schema should be excluded from validation
 * @param schemaFle Schema file
 * @param excludeList List of schemas to exclude
 * @returns True if schema should be excluded, false otherwise
 */
export async function shouldExcludeSchema(schemaFle: string, excludeList: any[]): Promise<boolean> {
  const rawData = schemaFle.split(".");
  const schemaName = rawData[0];
  const schemaVersion = rawData.slice(1, -2).join(".");

  const matches = excludeList.filter((s) => s.name.toLowerCase() === schemaName.toLowerCase());
  if (matches.length === 0)
    return false;

  if (matches.some((s) => s.version === schemaVersion))
    return true;

  return false;
}
