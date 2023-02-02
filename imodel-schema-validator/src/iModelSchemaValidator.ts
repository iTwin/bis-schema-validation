/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";
import * as readdirp from "readdirp";
import { Reporter } from "./Reporter";
import { IModelHost } from "@itwin/core-backend";
import { SchemaCompareCodes } from "@itwin/ecschema-editing";
import { SchemaValidator, ValidationOptions, ValidationResultType } from "@bentley/schema-validator";
import { CompareOptions, ComparisonResultType, IComparisonResult, SchemaComparison } from "@bentley/schema-comparer";

/**
 * Defines the possible result types for all validations
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export enum iModelValidationResultTypes {
  Passed,
  Failed,
  Skipped,
  Error,
  ReferenceDifferenceWarning,
  NotFound,
}

/**
 * Defines the object returned after iModel Schema Validation.
 */
export interface IModelValidationResult {
  name: string;
  version: string;
  sha1?: string;
  releasedSchemaSha1?: string;
  releasedSchemaIModelContextSha1?: string;
  validator?: iModelValidationResultTypes;
  comparer?: iModelValidationResultTypes;
  sha1Comparison?: iModelValidationResultTypes;
  approval?: iModelValidationResultTypes;
}

/**
 * Verifies an iModel schema
 */
export async function verifyIModelSchema(iModelSchemaDir: string, iModelSchemaFile: string, checkReleaseDynamicSchema: boolean, baseSchemaRefDir: string, output: string): Promise<IModelValidationResult> {
  const releasedSchemaDirectories = await generateSchemaDirectoryLists(baseSchemaRefDir);
  const validationResult = await applyValidations(iModelSchemaDir, iModelSchemaFile, releasedSchemaDirectories, checkReleaseDynamicSchema, output);
  return validationResult;
}

/**
 * Verifies iModel schemas
 */
export async function verifyIModelSchemas(iModelSchemaDir: string, checkReleaseDynamicSchema: boolean, baseSchemaRefDir: string, output: string) {

  const results: IModelValidationResult[] = [];
  const releasedSchemaDirectories = await generateSchemaDirectoryLists(baseSchemaRefDir);

  for (const iModelSchemaFile of fs.readdirSync(iModelSchemaDir)) {
    const validationResult = await applyValidations(iModelSchemaDir, iModelSchemaFile, releasedSchemaDirectories, checkReleaseDynamicSchema, output);
    results.push(validationResult);
  }

  getResults(results, baseSchemaRefDir, output);
}

/**
 * Apply all 4 validations
 */
async function applyValidations(iModelSchemaDir: string, iModelSchemaFile: string, releasedSchemaDirectories: string[], checkReleaseDynamicSchema: boolean, output: string): Promise<IModelValidationResult> {
  const iModelSchemaPath = path.join(iModelSchemaDir, iModelSchemaFile);
  const rawDetails = iModelSchemaFile.split(".");
  const name = rawDetails[0];
  const version: string = rawDetails[1] + "." + rawDetails[2] + "." + rawDetails[3];
  const validationResult: IModelValidationResult = { name, version };

  // Special case to handle RoadRailAlignment.02.00.01 and Construction.01.00.01 until their missing ECSchemaReference issue is fixed
  if (path.basename(iModelSchemaPath) === "RoadRailAlignment.02.00.01.ecschema.xml") {
    await removeECSchemaReference(iModelSchemaPath, ["ECDbMap"]);
  } else if (path.basename(iModelSchemaPath) === "Construction.01.00.01.ecschema.xml") {
    await removeECSchemaReference(iModelSchemaPath, ["ECDbMap", "CoreCustomAttributes"]);
  }

  console.log("\nBEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s", name, version);
  Reporter.writeToLogFile(name, version, `BEGIN VALIDATION AND DIFFERENCE AUDIT: ${name}.${version}\n`, output);
  await validateSchema(name, version, iModelSchemaPath, releasedSchemaDirectories, validationResult, output);
  // @bentley/schema-validator is auto pushing the input schema path to reference array.
  // Removing this path to fix the bug in finding releasedSchemaFile otherwise it finds the iModel schema path
  const index = releasedSchemaDirectories.indexOf(iModelSchemaDir);
  if (index !== -1)
    releasedSchemaDirectories.splice(index, 1);

  // find out if a schema is dynamic or not
  if (isDynamicSchema(iModelSchemaPath) && (!checkReleaseDynamicSchema)) {
    console.log(chalk.default.grey(`Skipping difference audit for ", ${name} ${version}.
    The schema is a dynamic schema and released versions of dynamic schemas are not saved.`));
    Reporter.writeToLogFile(name, version, `Skipping difference audit for ${name}.${version}.
    The schema is a dynamic schema and released versions of dynamic schemas are not saved.\n`, output);
    validationResult.comparer = iModelValidationResultTypes.Skipped;
    validationResult.sha1Comparison = iModelValidationResultTypes.Skipped;
    validationResult.approval = iModelValidationResultTypes.Skipped;
  } else {
    let releasedSchemaPath = "";
    // Find out Difference
    for (const dir of releasedSchemaDirectories) {
      fs.readdirSync(dir).forEach((releasedSchemaFile) => {
        if (releasedSchemaFile === iModelSchemaFile) {
          releasedSchemaPath = path.join(dir, releasedSchemaFile);
        }
      });
    }

    if (!releasedSchemaPath) {
      if (isDynamicSchema(iModelSchemaPath)) {
        console.log(chalk.default.grey("Skipping difference audit for ", name, version, ". No released schema found."));
        Reporter.writeToLogFile(name, version, `Skipping difference audit for ${name}.${version}. No released schema found.\n`, output);
        validationResult.comparer = iModelValidationResultTypes.Skipped; // skip if no released schema found in case of dynamic schemas
      } else {
        console.log(chalk.default.grey("Skipping difference audit for ", name, version, ". No released schema found."));
        Reporter.writeToLogFile(name, version, `Skipping difference audit for ${name}.${version}. No released schema found.\n`, output);
        validationResult.comparer = iModelValidationResultTypes.NotFound; // fail if no released schema found
      }

    } else {
      validationResult.releasedSchemaSha1 = IModelHost.computeSchemaChecksum({ schemaXmlPath: releasedSchemaPath, referencePaths: releasedSchemaDirectories });
      await compareSchema(name, version, iModelSchemaPath, releasedSchemaPath, [iModelSchemaDir], releasedSchemaDirectories, output, validationResult);
      // @bentley/schema-comparer is auto pushing the input schema path to reference array.
      // Removing this path to fix the bug in finding releasedSchemaFile otherwise it finds the iModel schema path
      const iModelSchemaDirIndex = releasedSchemaDirectories.indexOf(iModelSchemaDir);
      if (iModelSchemaDirIndex !== -1)
        releasedSchemaDirectories.splice(iModelSchemaDirIndex, 1);

      if (validationResult.comparer === iModelValidationResultTypes.Passed || validationResult.comparer === iModelValidationResultTypes.ReferenceDifferenceWarning)
        validationResult.releasedSchemaIModelContextSha1 = IModelHost.computeSchemaChecksum({ schemaXmlPath: releasedSchemaPath, referencePaths: [iModelSchemaDir] });
    }
  }
  validationResult.sha1 = IModelHost.computeSchemaChecksum({ schemaXmlPath: iModelSchemaPath, referencePaths: [iModelSchemaDir] });
  console.log("END VALIDATION AND DIFFERENCE AUDIT: ", name, version);
  Reporter.writeToLogFile(name, version, `END VALIDATION AND DIFFERENCE AUDIT: ${name}.${version}\n`, output);
  return validationResult;
}

/**
 * Check if a schema is dynamic or not
 */
export function isDynamicSchema(schemaPath: string): boolean {
  const schemaText = fs.readFileSync(schemaPath, "utf-8");
  return /<DynamicSchema ([^]+?)\/>/.test(schemaText);
}

/**
 * Check if violation is of type error
 */
export function ruleViolationError(line: string) {
  const bisRuleFailure = /Error\sBIS-\d+:/g.test(line);
  const ecRuleFailure = /Error\sECObjects-\d+:/g.test(line);
  if (bisRuleFailure || ecRuleFailure) {
    return true;
  }
  return false;
}

/**
 * Performs Schema Validation
 */
export async function validateSchema(schemaName: string, version: string, imodelSchemaPath: string, referencePaths: string[], validationResult: IModelValidationResult, output: string) {
  try {
    const validationOptions: ValidationOptions = new ValidationOptions(imodelSchemaPath, referencePaths, false);
    const validatorResult = await SchemaValidator.validate(validationOptions);
    for (const line of validatorResult) {
      switch (line.resultType) {
        case ValidationResultType.RuleViolation:
          console.log(chalk.default.yellow(line.resultText));
          Reporter.writeToLogFile(schemaName, version, line.resultText + "\n", output);
          // Allow warnings to be skipped
          if (ruleViolationError(line.resultText)) {
            validationResult.validator = iModelValidationResultTypes.Failed;
          }
          break;
        case ValidationResultType.Error:
          console.log(chalk.default.red(line.resultText));
          Reporter.writeToLogFile(schemaName, version, line.resultText + "\n", output);
          // skip the validation for the schemas which are not supported
          if (line.resultText.toLowerCase().includes("standard schemas are not supported by this tool")) {
            validationResult.validator = iModelValidationResultTypes.Skipped;
          } else {
            validationResult.validator = iModelValidationResultTypes.Error;
          }
          break;
        default:
          console.log(chalk.default.green(line.resultText));
          Reporter.writeToLogFile(schemaName, version, line.resultText + "\n", output);
          validationResult.validator = iModelValidationResultTypes.Passed;
      }
    }
  } catch (error) {
    console.log(chalk.default.red("An error occurred during validation: " + error.message));
    Reporter.writeToLogFile(schemaName, version, "An error occurred during validation: " + error.message + "\n", output);
    validationResult.validator = iModelValidationResultTypes.Error;
  }
}

/**
 * Performs Schema Comparison and returns the a boolean telling that a schema has reference only difference or not
 */
export async function compareSchema(schemaName: string, version: string, imodelSchemaPath: string, releasedSchemaPath: string, imodelSchemaReferencePaths: string[], releasedSchemaReferencePaths: string[], output: string, validationResult: IModelValidationResult): Promise<IComparisonResult[]> {
  let comparisonResults;
  try {
    const compareOptions: CompareOptions = new CompareOptions(imodelSchemaPath, releasedSchemaPath, imodelSchemaReferencePaths, releasedSchemaReferencePaths);
    comparisonResults = await SchemaComparison.compare(compareOptions);
    let deltaExists = false;
    for (const line of comparisonResults) {
      switch (line.resultType) {
        case ComparisonResultType.Delta:
          if (referenceDifference(line)) {
            if (!deltaExists)
              validationResult.comparer = iModelValidationResultTypes.ReferenceDifferenceWarning;
            console.log(chalk.default.yellow(line.resultText));
            Reporter.writeToLogFile(schemaName, version, line.resultText + "\n", output);
            break;
          }
          if (line.compareCode)
            deltaExists = true;
          validationResult.comparer = iModelValidationResultTypes.Failed;
          console.log(chalk.default.yellow(line.resultText));
          Reporter.writeToLogFile(schemaName, version, line.resultText + "\n", output);
          break;
        case ComparisonResultType.Error:
          console.log(chalk.default.red(line.resultText));
          Reporter.writeToLogFile(schemaName, version, line.resultText + "\n", output);
          validationResult.comparer = iModelValidationResultTypes.Error;
          break;
        default:
          console.log(chalk.default.green(line.resultText));
          Reporter.writeToLogFile(schemaName, version, line.resultText + "\n", output);
          validationResult.comparer = iModelValidationResultTypes.Passed;
      }
    }
  } catch (err) {
    console.log(chalk.default.red("An error occurred during comparison: " + err.message));
    Reporter.writeToLogFile(schemaName, version, "An error occurred during comparison: " + err.message + "\n", output);
    validationResult.comparer = iModelValidationResultTypes.Error;
  }
  return comparisonResults;
}

/**
 * Find out that difference of two schema's is reference only or not
 */
function referenceDifference(comparisonResult: IComparisonResult): boolean {
  if (!comparisonResult.compareCode)
    return false;

  // check for we have "missing reference" or "reference version different" issues
  if (comparisonResult.compareCode === SchemaCompareCodes.SchemaReferenceDelta)
    return true;

  return false;
}

/**
 * Remove a list ECSchemaReferences from schema XML
 */
async function removeECSchemaReference(schemaFilePath: string, ecReferenceNames: string[]) {
  let data = fs.readFileSync(schemaFilePath, "utf-8").split("\n");
  ecReferenceNames.forEach((ecReference) => {
    const ecReferenceRegex = new RegExp('<ECSchemaReference name="' + ecReference + '"');
    data = data.filter((line) => ecReferenceRegex.test(line) !== true);
  });

  const writeStream = fs.createWriteStream(schemaFilePath);
  data.forEach((line) => {
    writeStream.write(line + "\n");
  });
  writeStream.end();
}

/**
 * Returns a pair of lists: unreleasedDirs, releasedDir
 * unreleasedDirs contains all non-release directories
 * releasedDir contains all release directories
 */
async function generateSchemaDirectoryLists(schemaDirectory: any) {
  const filter: any = { fileFilter: "*.ecschema.xml", directoryFilter: ["!node_modules", "!.vscode"] };
  const allSchemaDirs = (await readdirp.promise(schemaDirectory, filter)).map((schemaPath) => path.dirname(schemaPath.fullPath));
  return Array.from(new Set(allSchemaDirs.filter((schemaDir) => /released/i.test(schemaDir))).keys());
}

/**
 * Contains list of validation suppressions
 * @returns suppression list
 */
export function getSuppressionsList(filePath) {
  if (!fs.existsSync(filePath))
    throw Error("Suppression file not found");

  const rawData = fs.readFileSync(filePath, "utf-8");
  const suppressionsList = JSON.parse(rawData);

  return suppressionsList;
}

/**
 * Decides whether to suppress a sha1 validation for a specific schema or not
 * @param result It contains validation results data.
 * @param suppressionList items need to be suppressed
 * @returns boolean value
 */
export function shouldSuppressSha1Validation(result: IModelValidationResult, suppressionList: any) {
  const list = Object.values(suppressionList);
  const matches = list.filter((s: any) => s.name === result.name && s.version === result.version && (s.released) && (s.sha1Validation));
  if (matches.length !== 0)
    return true;

  return false;
}

/**
 * Log and display results. Define success or failure scenario based upon results
 * @param results Array containing the IModelValidationResult
 * @param baseSchemaRefDir: Path of bis-schemas root directory
 * @param output The directory where output logs will go.
 */
export function getResults(results: IModelValidationResult[], baseSchemaRefDir: string, output: string) {
  const suppressionList = getSuppressionsList(path.resolve(__dirname, "./suppression.json"));
  const reporter = new Reporter();
  reporter.logAllValidationsResults(results, baseSchemaRefDir, output, suppressionList);
  reporter.displayAllValidationsResults(results, baseSchemaRefDir, suppressionList);
  if (reporter.diffChanged === 0 && reporter.diffErrors === 0 && reporter.validFailed === 0 &&
    reporter.checksumFailed === 0 && reporter.approvalFailed === 0) {
    console.log("All validations passed successfully.");
  } else {
    throw Error("Failing the tool because a validation has failed.");
  }
}
