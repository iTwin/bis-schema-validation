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
import { generateSchemaDirectoryLists, getExcludeSchemaList, shouldExcludeSchema } from "./utils";
import { compareSchema, IModelValidationResult, iModelValidationResultTypes, isDynamicSchema, validateSchema } from "@bentley/imodel-schema-validator";

/**
 * Verifies an App Schemas
 * @param appDirectory Path to the extracted installer directory
 * @param baseSchemaRefDir Path to the bis-schemas directory
 * @param output Path to the output directory
 * @returns Array of validation results
 */
export async function verifyAppSchemas(appDirectory: string, baseSchemaRefDir: string, output: string) {
  const results: IModelValidationResult[] = [];
  const releasedSchemaDirectories = await generateSchemaDirectoryLists(baseSchemaRefDir);
  const appSchemaDirs = await generateAppSchemaDirectoryList(appDirectory);
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
  return results;
}

/**
 * Apply all validations
 * @param schemaDir Directory where schema is located
 * @param schemaFile The schema file
 * @param appSchemaDirs List of paths where app schemas are located
 * @param releasedSchemaDirectories List of paths where released schemas are located
 * @param output Path to the output directory
 * @returns Validation result of a schema
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
    console.log(chalk.grey(`Skipping difference audit for ${name} ${version}.
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
        console.log(chalk.grey("Skipping difference audit for ", name, version, ". No released schema found."));
        Reporter.writeToLogFile(name, version, `Skipping difference audit for ${name}.${version}. No released schema found.\n`, output);
        validationResult.comparer = iModelValidationResultTypes.Skipped;
      } else {
        console.log(chalk.grey("Skipping difference audit for ", name, version, ". No released schema found."));
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
 * Find directories where schema files are present
 * @param appDirectory Directory to search for schema files
 * @returns Array of paths where schema files are found
 */
export async function generateAppSchemaDirectoryList(appDirectory: string): Promise<string[]> {
  // Skip schemas from platform based licensing-addon e.g licensing-win32-x64
  const filter: any = { fileFilter: "*.ecschema.xml", directoryFilter: ["!.vscode", "!licensing-*"] };
  const schemaPaths = (await readdirp.promise(appDirectory, filter)).map((entry) => path.dirname(entry.fullPath));
  return Array.from(new Set(schemaPaths).keys());
}
