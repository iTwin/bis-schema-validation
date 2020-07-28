/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";
import * as readdirp from "readdirp";
import { SchemaKey } from "@bentley/ecschema-metadata";
import { StubSchemaXmlFileLocater } from "@bentley/ecschema-locaters/lib/StubSchemaXmlFileLocater";

/**
 * Prepare output file where imodel will be created
 * @param iModelDir Path to the directory
 * @param imodelName Name of imodel
 * @param fileName Name of bim file
 * @returns Path of bim file
 */
export function prepareOutputFile(iModelDir: string, imodelName): string {
  const outputDir = path.join(iModelDir, imodelName);
  const exportSchemaDir = path.join(outputDir, "exported");
  const wipLogs = path.join(outputDir, "logs", "wip");
  const releasedLogs = path.join(outputDir, "logs", "released");
  const outputFile = path.join(outputDir, imodelName + ".bim");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(exportSchemaDir);
    fs.mkdirSync(wipLogs, { recursive: true });
    fs.mkdirSync(releasedLogs, { recursive: true });
  }

  if (fs.existsSync(outputFile)) {
    rimraf.sync(outputFile);
  }

  return outputFile;
}

/**
 * Get a list of all released schema directories (typically used for reference search paths).
 * @param schemaDirectory Root directory path of bis-schemas
 * @returns List of released schema directory paths
 */
export async function generateSchemaDirectoryList(schemaDirectory: string) {
  const filter = { fileFilter: "*.ecschema.xml", directoryFilter: ["!node_modules", "!.vscode", "!tools"] };
  const allSchemaDirs = (await readdirp.promise(schemaDirectory, filter)).map((schemaPath) => path.dirname(schemaPath.fullPath));
  return Array.from(new Set(allSchemaDirs.filter((schemaDir) => /released/i.test(schemaDir))).keys());
}

/**
 * Generate list of latest released version of schema files
 * @param schemaDirectory Root directory path of bis-schemas
 * @returns List of schema paths with latest released versions
 */
export async function generateReleasedSchemasList(schemaDirectory: string) {
  const filter: any = { fileFilter: "*.ecschema.xml", directoryFilter: ["!node_modules", "!.vscode", "!tools", "!Deprecated"] };
  const allSchemaDirs = (await readdirp.promise(schemaDirectory, filter)).map((schemaPath) => schemaPath.fullPath);
  return findLatestReleasedVersion(Array.from(new Set(allSchemaDirs.filter((schemaDir) => /released/i.test(schemaDir))).keys()).sort());
}

/**
 * Generate list of WIP schema files
 * @param schemaDirectory Root directory path of bis-schemas
 * @returns List of schema paths having WIP version
 */
export async function generateWIPSchemasList(schemaDirectory: string) {
  const filter: any = { fileFilter: "*.ecschema.xml", directoryFilter: ["!node_modules", "!.vscode", "!tools", "!docs", "!Deprecated", "!Released"] };
  const allSchemaDirs = (await readdirp.promise(schemaDirectory, filter)).map((schemaPath) => schemaPath.fullPath);
  return Array.from(new Set(allSchemaDirs.filter((schemaDir) => /.*\.ecschema\.xml/i.test(schemaDir))).keys());
}

/**
 * Find latest released version of all schemas
 * @param releasedSchemas list of schemas having all released versions
 * @returns list of latest released versions
 */
export function findLatestReleasedVersion(releasedSchemas: string[]): string[] {
  const latestReleasedVersions: string[] = [];
  for (let index = 0; index < releasedSchemas.length; index++) {
    const schemaNameA = path.basename(releasedSchemas[index]).split(".")[0];
    let schemaNameB = "";
    if (index + 1 < releasedSchemas.length) {
      schemaNameB = path.basename(releasedSchemas[index + 1]).split(".")[0];
    }
    if (schemaNameA !== schemaNameB) {
      latestReleasedVersions.push(releasedSchemas[index]);
    }
  }
  return latestReleasedVersions.reverse();
}

/**
 * Create version string of schema
 * @param readVersion Read version of schema
 * @param writeVersion Write version of schema
 * @param minorVersion Minor version of schema
 * @returns Version string of schema
 */
export function getVersionString(readVersion: number, writeVersion: number, minorVersion: number): string {
  const versionStr = ("0" + readVersion).slice(-2) + "." + ("0" + writeVersion).slice(-2) + "." + ("0" + minorVersion).slice(-2);
  return versionStr;
}

/**
 * Generate schema xml filename with extension
 * @param schemaName Name of schema
 * @param version Version string of schema
 * @returns Schema XML filename
 */
export function generateSchemaXMLName(schemaName: string, version: string): string {
  const schemaXMLFile = schemaName + "." + version + ".ecschema.xml";
  return schemaXMLFile;
}

/** Gets a schemakey
 * @param schemaXMLFilePath Path of schema XML file
 * @returns Schemakey
 */
export function getSchemaInfo(schemaXMLFilePath: string): SchemaKey {
  const schemaXml = fs.readFileSync(schemaXMLFilePath, "utf-8");
  const locater = new StubSchemaXmlFileLocater();
  return locater.getSchemaKey(schemaXml);
}

/**
 * Gets schema name from filename
 * @param schemaFilePath Complete path to schema XML file
 * @returns Schema name
 */
export function getSchemaNameFromFileName(schemaFilePath: string): string {
  const schemaName = path.basename(schemaFilePath).split(".")[0];
  return schemaName;
}

/**
 * Verifies schema name using name from schemakey and XML filename
 * @param schemaKeyName Schema name returned by schemakey
 * @param schemaFilePath Complete path to schema XML file
 * @returns Schema name
 */
export function getVerifiedSchemaName(schemaKeyName: string, schemaFilePath): string {
  const xmlFileName = getSchemaNameFromFileName(schemaFilePath);
  if (schemaKeyName !== xmlFileName) {
    console.log("schemaName is different in XML content (" + schemaKeyName + ") from XML file name (" + xmlFileName + ").");
    return xmlFileName;
  }
  return schemaKeyName;
}

/**
 * Checks if the schema that needs validation is not present in ignore list
 * @param schemaName Name of schema
 * @param schemaVersion Schema version
 * @param excludeList List of schemas present in ignoreSchemaList.json
 * @returns Boolean based upon the decision
 */
export function excludeSchema(schemaName, schemaVersion, excludeList) {
  if (!excludeList)
    return false;

  const matches = excludeList.filter((s) => s.name === schemaName);
  if (matches.length === 0)
    return false;

  if (matches.some((s) => s.version === "*"))
    return true;

  if (!schemaVersion)
    return true;

  if (matches.some((s) => s.version === schemaVersion))
    return true;

  return false;
}

/**
 * Remove extra paths added by validator tool to the releasedFolders list
 * @param exportDir Directory where schemas are exported.
 * @param releaseFolders List of released folders
 */
export function fixSchemaValidatorIssue(exportDir: string, releasedFolders: string[]): string[] {
  // @bentley/schema-validator is auto pushing the input schema path to reference array.
  // Removing this path to fix the bug in finding releasedSchemaFile otherwise it finds the iModel schema path
  const index = releasedFolders.indexOf(exportDir);
  if (index !== -1) { releasedFolders.splice(index, 1); }
  return releasedFolders;
}

/**
 * Remove schemas having issues from all releasedSchemas list
 * @return Updated releasedSchemas list
 * This function will be removed as soon as we decide some solution for Fasteners and Asset schemas
 */
export function removeSchemasFromList(allSchemas: string[], schemasToBeRemoved: string[]): string[] {
  schemasToBeRemoved.forEach((issueFile) => {
    const schemaKeyRegex = new RegExp(issueFile);
    allSchemas = allSchemas.filter((schema) => !schemaKeyRegex.test(schema));
  });
  return allSchemas;
}
