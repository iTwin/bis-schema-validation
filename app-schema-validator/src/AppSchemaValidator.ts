/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";
import * as readdirp from "readdirp";
import { Reporter } from "@bentley/imodel-schema-validator/lib/Reporter";
import { SchemaKey } from "@itwin/ecschema-metadata";
import { StubSchemaXmlFileLocater } from "@itwin/ecschema-locaters";
import { getResults, isDynamicSchema, validateSchema, compareSchema, iModelValidationResultTypes, IModelValidationResult } from "@bentley/imodel-schema-validator";

/**
 * Verifies an App Schema
 */
export async function verifyAppSchema(schemaDirectory: string, schemaFile: string, baseSchemaRefDir: string, output: string): Promise<IModelValidationResult> {
  const releasedSchemaDirectories = await generateSchemaDirectoryLists(baseSchemaRefDir);
  const validationResult = await applyValidations(schemaDirectory, schemaFile, [], releasedSchemaDirectories, output);
  return validationResult;
}

/**
 * Verifies an App Schemas
 */
export async function verifyAppSchemas(appDirectory: string, baseSchemaRefDir: string, output: string) {
  const results: IModelValidationResult[] = [];
  const releasedSchemaDirectories = await generateSchemaDirectoryLists(baseSchemaRefDir);
  const appSchemaDirs = await findAllSchemaPaths(appDirectory)
  const excludeSchemas = await getExcludeSchemaList();

  for (const appSchemaDir of appSchemaDirs) {
    for (const appSchemaFile of fs.readdirSync(appSchemaDir)) {

      if (!appSchemaFile.endsWith(".ecschema.xml"))
        continue;

      if (await shouldExcludeSchema(appSchemaFile, excludeSchemas))
        continue;

      const validationResult = await applyValidations(appSchemaDir, appSchemaFile, appSchemaDirs, releasedSchemaDirectories, output);
      results.push(validationResult);
    }
  }

  await getResults(results, baseSchemaRefDir, output);
}


/**
 * Apply all 4 validations
 */
async function applyValidations(schemaDir: string, schemaFile: string, appSchemaDirs: string[], releasedSchemaDirectories: string[], output: string): Promise<IModelValidationResult> {
  const appSchemaPath = path.join(schemaDir, schemaFile);
  const appSchemaKey = await getSchemaInfo(appSchemaPath);
  const name = appSchemaKey.name;
  const version = appSchemaKey.version.toString();
  const validationResult: IModelValidationResult = { name, version };

  console.log("\nBEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s", name, version);
  Reporter.writeToLogFile(name, version, `BEGIN VALIDATION AND DIFFERENCE AUDIT: ${name}.${version}\n`, output);
  await validateSchema(name, version, appSchemaPath, releasedSchemaDirectories, validationResult, output);
  releasedSchemaDirectories = fixReleasedSchemaDirectories(schemaDir, releasedSchemaDirectories);

  if (isDynamicSchema(appSchemaPath)) {
    console.log(chalk.default.grey(`Skipping difference audit for ${name} ${version}.
    The schema is a dynamic schema and released versions of dynamic schemas are not saved.`));
    Reporter.writeToLogFile(name, version, `Skipping difference audit for ${name}.${version}.
    The schema is a dynamic schema and released versions of dynamic schemas are not saved.\n`, output);
    validationResult.comparer = iModelValidationResultTypes.Skipped;
    validationResult.approval = iModelValidationResultTypes.Skipped;
  } else {
    let releasedSchemaPath = "";
    // Find out Difference
    for (const dir of releasedSchemaDirectories) {
      fs.readdirSync(dir).forEach((releasedSchemaFile) => {
        if (releasedSchemaFile.toLowerCase().includes(appSchemaKey.toString().toLowerCase())) {
          releasedSchemaPath = path.join(dir, releasedSchemaFile);
        }
      });
    }

    if (!releasedSchemaPath) {
      if (isDynamicSchema(appSchemaPath)) {
        console.log(chalk.default.grey("Skipping difference audit for ", name, version, ". No released schema found."));
        Reporter.writeToLogFile(name, version, `Skipping difference audit for ${name}.${version}. No released schema found.\n`, output);
        validationResult.comparer = iModelValidationResultTypes.Skipped;
      } else {
        console.log(chalk.default.grey("Skipping difference audit for ", name, version, ". No released schema found."));
        Reporter.writeToLogFile(name, version, `Skipping difference audit for ${name}.${version}. No released schema found.\n`, output);
        validationResult.comparer = iModelValidationResultTypes.NotFound;
      }

    } else {
      // The app installer (opensiteplus) is missing several reference schemas. We provide those from bis-schemas.
      const appSchemaReferences = [...appSchemaDirs, ...releasedSchemaDirectories];
      await compareSchema(name, version, appSchemaPath, releasedSchemaPath, appSchemaReferences, releasedSchemaDirectories, output, validationResult);
      releasedSchemaDirectories = fixReleasedSchemaDirectories(schemaDir, releasedSchemaDirectories);
    }
  }
  console.log("END VALIDATION AND DIFFERENCE AUDIT: ", name, version);
  Reporter.writeToLogFile(name, version, `END VALIDATION AND DIFFERENCE AUDIT: ${name}.${version}\n`, output);
  return validationResult;
}

/**
 * Retrieves schema information
 * @param schemaXMLFilePath Path of schema XML file
 * @returns SchemaKey object containing the schema information
 */
async function getSchemaInfo(schemaXMLFilePath: string): Promise<SchemaKey> {
  const schemaXml = fs.readFileSync(schemaXMLFilePath, "utf-8");
  const locater = new StubSchemaXmlFileLocater();
  return locater.getSchemaKey(schemaXml);
}

function fixReleasedSchemaDirectories(appSchemaDir: string, releasedSchemaDirectories: string[]): string[] {
  // @bentley/schema-comparer and @bentley/schema-validator are pushing the input schema path to reference array.
  // Removing this path to fix the bug in finding releasedSchemaFile
  const index = releasedSchemaDirectories.indexOf(appSchemaDir);
  if (index !== -1)
    releasedSchemaDirectories.splice(index, 1);

  return releasedSchemaDirectories;
}

/**
 * Find released schemas directories
 * @schemaDirectory Directory to search for schema files
 * @returns Array containing released schemas directories
 */
async function generateSchemaDirectoryLists(schemaDirectory: string): Promise<string[]> {
  const filter: any = { fileFilter: "*.ecschema.xml", directoryFilter: ["!node_modules", "!.vscode", "!tools"] };
  const allSchemaDirs = (await readdirp.promise(schemaDirectory, filter)).map((schemaPath) => path.dirname(schemaPath.fullPath));
  return Array.from(new Set(allSchemaDirs.filter((schemaDir) => /released/i.test(schemaDir))).keys());
}

/**
 * Find directories where schema files are present
 * @param appDirectory Directory to search for schema files
 * @returns Array of paths where schema files are found
 */
async function findAllSchemaPaths(appDirectory: string): Promise<string[]> {
  // Skip schemas from platform based licensing-addon e.g licensing-win32-x64
  const filter: any = { fileFilter: "*.ecschema.xml", directoryFilter: ["!.vscode", "!licensing-*"] };
  const schemaPaths = (await readdirp.promise(appDirectory, filter)).map((entry) => path.dirname(entry.fullPath));
  return Array.from(new Set(schemaPaths).keys());
}

/**
 * Provides a list of schemas to exclude from validation
 */
async function getExcludeSchemaList() {
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
 * @param schemaFle Schema xml file
 * @param excludeList List of schemas to exclude
 * @returns True if schema should be excluded, false otherwise
 */
async function shouldExcludeSchema(schemaFle: string, excludeList: any[]): Promise<boolean> {
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
