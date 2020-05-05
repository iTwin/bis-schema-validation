/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { IModelProvider } from "./IModelProvider";
import { LaunchCodesProvider } from "./LaunchCodesProvider";
import { getSha1Hash } from "./Sha1HashHelper";
import { SchemaComparison, CompareOptions, ComparisonResultType, IComparisonResult } from "@bentley/schema-comparer";
import { SchemaValidator, ValidationOptions, ValidationResultType } from "@bentley/schema-validator";
import { SchemaCompareCodes, SchemaMatchType } from "@bentley/ecschema-metadata";
import * as path from "path";
import * as commander from "commander";
import * as chalk from "chalk";
import * as fs from "fs";
import * as rimraf from "rimraf";
import * as readdirp from "readdirp";

const program = new commander.Command("iModel-Schema-Validator NPM CLI");
program.option("--verifyIModelSchemas");
program.option("-u, --userName <required>", "Username for connecting with HUB using OIDC Auth.");
program.option("-p, --password <required>", "Password for connecting with HUB using OIDC Auth.");
program.option("-r, --projectId <required>", "Id of project on HUB.");
program.option("-i, --iModelName <required>", "Name of iModel (case sensitive) within project on HUB.");
program.option("-e, --environment <required>", "DEV, QA and PROD are available environments.");
program.option("-b, --baseSchemaRefDir <required>", "Root directory of all released schemas (root of BisSchemas repo).");
program.option("-o, --output <required>", "The path where output files will be generated.");
program.option("-n, --signOffExecutable  <required>", "The path where SchemaSignoffTool.exe is placed.");
program.option("-c, --checkReleaseDynamicSchema", "Check all dynamic schemas within iModel. Default is false.");

program.parse(process.argv);

/**
 * Defines the possible result types for all validations
 */
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
 * Validates the command line inputs for verifyIModelSchemas function
 */
async function validateInput() {
  if (process.argv.length < 18) {
    console.log("usage : index.js --verifyIModelSchemas");
    console.log("   -u, --userName                     :Username for connecting with HUB");
    console.log("   -p, --password                     :Password for connecting with HUB.");
    console.log("   -r, --projectId                    :Id of project on HUB.");
    console.log("   -i, --iModelName                   :Name of iModel (case sensitive) within project on HUB.");
    console.log("   -e, --environment                  :DEV or QA environments.");
    console.log("   -b, --baseSchemaRefDir             :Root directory of all released schemas (root of BisSchemas repo).");
    console.log("   -o, --output                       :The path where output files will be generated.");
    console.log("   -n, --signOffExecutable            :The path where SchemaSignoffTool.exe is placed.");
    console.log("   -c, --checkReleaseDynamicSchema    :Check all dynamic schemas within iModel. Default is false.");
    throw new Error("Some thing missing from required arguments and their values.");
  }

  if (!program.userName || !program.password || !program.projectId || !program.iModelName ||
    !program.baseSchemaRefDir || !program.environment || !program.output || !program.signOffExecutable) {
    console.log(chalk.default.red("Invalid input. For help use the '-h' option."));
    process.exit(1);
  }

  const env: string = program.environment.toUpperCase();
  if (env.includes("QA") || env.includes("DEV") || env.includes("PROD")) {
  } else {
    const error = "Environment value is incorrect. DEV, QA and PROD are acceptable environment values. ";
    throw new Error(error);
  }

  if (!fs.existsSync(program.baseSchemaRefDir)) {
    const error = "baseSchemaRefDir: " + program.baseSchemaRefDir + " is incorrect.";
    throw new Error(error);
  }

  if (!fs.existsSync(program.signOffExecutable)) {
    const error = "SchemaSignoffTool.exe does not exist at: " + program.signOffExecutable;
    throw new Error(error);
  }

  const tmpDir: any = process.env.TMP;
  const validationDir: string = path.join(tmpDir, "SchemaValidation");
  const briefcaseDir: string = path.join(validationDir, "Briefcases", program.iModelName);
  let checkReleaseDynamicSchema = false;

  if (fs.existsSync(briefcaseDir)) {
    console.log("Old briefcase directory removed.");
    rimraf.sync(briefcaseDir);
  }

  // creating new briefcase dir
  fs.mkdirSync(briefcaseDir, { recursive: true });
  console.log("Briefcase Directory: " + briefcaseDir);

  if (program.checkReleaseDynamicSchema) {
    checkReleaseDynamicSchema = true;
  }

  const iModelSchemaDir = await IModelProvider.exportSchemasFromIModel(program.projectId, program.iModelName, briefcaseDir, program.userName, program.password, program.environment);
  await verifyIModelSchemas(iModelSchemaDir, checkReleaseDynamicSchema, program.baseSchemaRefDir, program.signOffExecutable, program.output);
}

/**
 * Remove a list ECSchemaReferences from schema XML
 */
export async function removeECSchemaReference(schemaFilePath: string, ecReferenceNames: string[]) {
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
export async function generateSchemaDirectoryLists(schemaDirectory: any) {
  const filter: any = { fileFilter: "*.ecschema.xml", directoryFilter: ["!node_modules", "!.vscode"] };
  const allSchemaDirs = (await readdirp.promise(schemaDirectory, filter)).map((schemaPath) => path.dirname(schemaPath.fullPath));
  return Array.from(new Set(allSchemaDirs.filter((schemaDir) => /released/i.test(schemaDir))).keys());
}

/**
 * Verifies an iModel schema
 */
export async function verifyIModelSchema(iModelSchemaDir: string, iModelSchemaFile: string, checkReleaseDynamicSchema: boolean, baseSchemaRefDir: string, signOffExecutable: string, output: string): Promise<IModelValidationResult> {
  const releasedSchemaDirectories = await generateSchemaDirectoryLists(baseSchemaRefDir);
  const validationResult = await applyValidations(iModelSchemaDir, iModelSchemaFile, releasedSchemaDirectories, checkReleaseDynamicSchema, signOffExecutable, output);
  return validationResult;
}

/**
 * Verifies iModel schemas
 */
export async function verifyIModelSchemas(iModelSchemaDir: string, checkReleaseDynamicSchema: boolean, baseSchemaRefDir: string, signOffExecutable: string, output: string) {

  const results: IModelValidationResult[] = [];
  const releasedSchemaDirectories = await generateSchemaDirectoryLists(baseSchemaRefDir);

  for (const iModelSchemaFile of fs.readdirSync(iModelSchemaDir)) {
    const validationResult = await applyValidations(iModelSchemaDir, iModelSchemaFile, releasedSchemaDirectories, checkReleaseDynamicSchema, signOffExecutable, output);
    results.push(validationResult);
  }
  displayResults(results, baseSchemaRefDir);
}

/**
 * Apply all 4 validations
 */
async function applyValidations(iModelSchemaDir: string, iModelSchemaFile: string, releasedSchemaDirectories: string[], checkReleaseDynamicSchema: boolean, signOffExecutable: string, output: string): Promise<IModelValidationResult> {
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
  await validateSchema(iModelSchemaPath, releasedSchemaDirectories, validationResult, output);
  // @bentley/schema-validator is auto pushing the input schema path to reference array.
  // Removing this path to fix the bug in finding releasedSchemaFile otherwise it finds the iModel schema path
  const index = releasedSchemaDirectories.indexOf(iModelSchemaDir);
  if (index !== -1) { releasedSchemaDirectories.splice(index, 1); }

  // find out if a schema is dynamic or not
  if (isDynamicSchema(iModelSchemaPath) && (!checkReleaseDynamicSchema)) {
    console.log(chalk.default.grey("Skipping difference audit for ", name, version, ". The schema is a dynamic schema and released versions of dynamic schemas are not saved."));
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
        validationResult.comparer = iModelValidationResultTypes.Skipped; // skip if no released schema found in case of dynamic schemas
      } else {
        console.log(chalk.default.grey("Skipping difference audit for ", name, version, ". No released schema found."));
        validationResult.comparer = iModelValidationResultTypes.NotFound; // fail if no released schema found
      }

    } else {
      validationResult.releasedSchemaSha1 = getSha1Hash(signOffExecutable, releasedSchemaPath, releasedSchemaDirectories.join(";"), true);
      await compareSchema(iModelSchemaPath, releasedSchemaPath, [iModelSchemaDir], releasedSchemaDirectories, output, validationResult);
      // @bentley/schema-comparer is auto pushing the input schema path to reference array.
      // Removing this path to fix the bug in finding releasedSchemaFile otherwise it finds the iModel schema path
      const iModelSchemaDirIndex = releasedSchemaDirectories.indexOf(iModelSchemaDir);
      if (iModelSchemaDirIndex !== -1) { releasedSchemaDirectories.splice(iModelSchemaDirIndex, 1); }

      if (validationResult.comparer === iModelValidationResultTypes.Passed || validationResult.comparer === iModelValidationResultTypes.ReferenceDifferenceWarning)
        validationResult.releasedSchemaIModelContextSha1 = getSha1Hash(signOffExecutable, releasedSchemaPath, iModelSchemaDir, false);
    }
  }
  validationResult.sha1 = getSha1Hash(signOffExecutable, iModelSchemaPath, iModelSchemaDir, true);
  console.log("END VALIDATION AND DIFFERENCE AUDIT: ", name, version);
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
  if (/Error\sBIS-\d+:/g.test(line)) {
    return true;
  }
  return false;
}

/**
 * Performs Schema Validation
 */
export async function validateSchema(imodelSchemaPath: string, referencePaths: string[], validationResult: IModelValidationResult, output: string) {
  try {
    const validationOptions: ValidationOptions = new ValidationOptions(imodelSchemaPath, referencePaths, false, output);
    const validatorResult = await SchemaValidator.validate(validationOptions);
    for (const line of validatorResult) {
      switch (line.resultType) {
        case ValidationResultType.RuleViolation:
          console.log(chalk.default.yellow(line.resultText));
          // Allow warnings to be skipped
          if (ruleViolationError(line.resultText)) {
            validationResult.validator = iModelValidationResultTypes.Failed;
          }
          break;
        case ValidationResultType.Error:
          console.log(chalk.default.red(line.resultText));
          // skip the validation for the schemas which are not supported
          if (line.resultText.toLowerCase().includes("standard schemas are not supported by this tool")) {
            validationResult.validator = iModelValidationResultTypes.Skipped;
          } else {
            validationResult.validator = iModelValidationResultTypes.Error;
          }
          break;
        default:
          console.log(chalk.default.green(line.resultText));
          validationResult.validator = iModelValidationResultTypes.Passed;
      }
    }
  } catch (error) {
    console.log(chalk.default.red("An error occurred during validation: " + error.message));
    validationResult.validator = iModelValidationResultTypes.Error;
  }
}

/**
 * Performs Schema Comparison and returns the a boolean telling that a schema has reference only difference or not
 */
export async function compareSchema(imodelSchemaPath: string, releasedSchemaPath: string, imodelSchemaReferencePaths: string[], releasedSchemaReferencePaths: string[], output: string, validationResult: IModelValidationResult): Promise<IComparisonResult[]> {
  let comparisonResults;
  try {
    const compareOptions: CompareOptions = new CompareOptions(imodelSchemaPath, releasedSchemaPath, imodelSchemaReferencePaths, releasedSchemaReferencePaths, output);
    comparisonResults = await SchemaComparison.compare(compareOptions);
    let deltaExists = false;
    for (const line of comparisonResults) {
      switch (line.resultType) {
        case ComparisonResultType.Delta:
          if (referenceDifference(line)) {
            if (!deltaExists)
              validationResult.comparer = iModelValidationResultTypes.ReferenceDifferenceWarning;
            console.log(chalk.default.yellow(line.resultText));
            break;
          }
          if (line.compareCode)
            deltaExists = true;
          validationResult.comparer = iModelValidationResultTypes.Failed;
          console.log(chalk.default.yellow(line.resultText));
          break;
        case ComparisonResultType.Error:
          console.log(chalk.default.red(line.resultText));
          validationResult.comparer = iModelValidationResultTypes.Error;
          break;
        default:
          console.log(chalk.default.green(line.resultText));
          validationResult.comparer = iModelValidationResultTypes.Passed;
      }
    }
  } catch (err) {
    console.log(chalk.default.red("An error occurred during comparison: " + err.message));
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
 * Display the output
 */
export function displayResults(results: IModelValidationResult[], baseSchemaRefDir: string) {

  let validFailed = 0;
  let validError = 0;
  let validSkipped = 0;
  let diffChanged = 0;
  let diffErrors = 0;
  let diffWarnings = 0;
  let diffSkipped = 0;
  let checksumSkipped = 0;
  let checksumFailed = 0;
  let approvalFailed = 0;
  let approvalSkipped = 0;
  let checksumResult;

  const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
  const launchCodes = launchCodesProvider.getSchemaInventory(baseSchemaRefDir);

  console.log("\niModel schemas:");
  for (const item of results) {
    console.log("\n> %s.%s SHA1(%s)", item.name, item.version, item.sha1);

    switch (item.validator) {
      case iModelValidationResultTypes.Passed:
        console.log("   > Schema validation against BIS rules           ", chalk.default.green("<passed>"));
        break;
      case iModelValidationResultTypes.Failed:
        console.log("   > Schema validation against BIS rules           ", chalk.default.red("<failed>"));
        console.log("       BIS validation FAILED. See log for errors. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", item.name, item.version);
        validFailed++;
        break;
      case iModelValidationResultTypes.Error:
        console.log("   > Schema validation against BIS rules           ", chalk.default.red("<failed>"));
        console.log("       An error occurred during the BIS validation audit. See log for errors. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", item.name, item.version);
        validError++;
        break;
      case iModelValidationResultTypes.Skipped:
        console.log("   > Schema validation against BIS rules           ", chalk.default.yellow("<skipped>"));
        console.log("       Standard schemas are not supported by this tool. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", item.name, item.version);
        validSkipped++;
        break;
      default:
        console.log("   > Schema validation against BIS rules           ", chalk.default.red("<failed>"));
        console.log("       Failed to perform the validation audit for: %s.%s\")", item.name, item.version);
        validError++;
    }

    switch (item.comparer) {
      case iModelValidationResultTypes.Passed:
        console.log("   > Schema content verification                   ", chalk.default.green("<passed>"));
        break;
      case iModelValidationResultTypes.Failed:
        console.log("   > Schema content verification                   ", chalk.default.red("<failed>"));
        console.log("       Schema has changes with released one. See log for diff. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", item.name, item.version);
        diffChanged++;
        break;
      case iModelValidationResultTypes.ReferenceDifferenceWarning:
        console.log("   > Schema content verification                   ", chalk.default.red("<warning>"));
        console.log("       Schema has reference only differences with released one. See log for diff. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", item.name, item.version);
        diffWarnings++;
        break;
      case iModelValidationResultTypes.Error:
        console.log("   > Schema content verification                   ", chalk.default.red("<failed>"));
        console.log("       An error occurred during the difference audit. See log for errors. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", item.name, item.version);
        diffErrors++;
        break;
      case iModelValidationResultTypes.Skipped:
        console.log("   > Schema content verification                   ", chalk.default.yellow("<skipped>"));
        console.log("       Skipped difference audit. See log for errors. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", item.name, item.version);
        diffSkipped++;
        break;
      case iModelValidationResultTypes.NotFound:
        console.log("   > Schema content verification                   ", chalk.default.red("<failed>"));
        console.log("       Failed to perform the difference audit. There is no released schema for: %s.%s\")", item.name, item.version);
        diffErrors++;
        break;
      default:
        console.log("   > Schema content verification                   ", chalk.default.red("<failed>"));
        console.log("       Failed to perform the difference audit for: %s.%s\")", item.name, item.version);
        diffErrors++;
    }

    // skip checking against launch code, if the schema is dynamic schema
    if (item.sha1Comparison === iModelValidationResultTypes.Skipped) {
      console.log("   > Schema SHA1 checksum verification             ", chalk.default.yellow("<skipped>"));
      console.log("       SHA1 checksum verification is skipped intentionally for dynamic schemas");
      checksumSkipped++;
    } else {
      checksumResult = launchCodesProvider.compareCheckSums(item.name, item.sha1, launchCodes);
      if (checksumResult.result) {
        // This means that there was no difference and the schema did not have to be loaded into the iModel context.
        console.log("   > Schema SHA1 checksum verification             ", chalk.default.green("<passed>"));
      } else {
        const releasedSchemaChecksumResult = launchCodesProvider.compareCheckSums(item.name, item.releasedSchemaSha1, launchCodes);
        if ((item.comparer === iModelValidationResultTypes.Passed && releasedSchemaChecksumResult.result) ||
          (item.releasedSchemaIModelContextSha1 && item.sha1 === item.releasedSchemaIModelContextSha1)) {
          // First check determines if loading the released schema into the iModel's context allowed the checksums to match.  This will be the case most of the time.
          // However, due to the way ECDb roundtrips schemas there are a few cases where the checksum will differ for the same exact schema. The second check comes
          // at this point to check that the released schema we found has the same checksum as the one in the wiki and there is no difference between that released
          // schema and the one within the iModel.
          console.log("   > Schema SHA1 checksum verification             ", chalk.default.green("<passed with exception>"));
          console.log("       The SHA1 checksum does not match the one in the wiki because of updates to schema references");
          console.log("       Released schema SHA1: %s ", item.releasedSchemaSha1);
          console.log("       The released schema was loaded into the context of the iModel's schemas and checksums matched.");
          checksumResult = releasedSchemaChecksumResult;
        } else {
          console.log("   > Schema SHA1 checksum verification             ", chalk.default.red("<failed>"));
          checksumFailed++;
        }
      }
    }
    // skip checking against approvals, if the schema is dynamic schema
    if (item.approval === iModelValidationResultTypes.Skipped) {
      console.log("   > Released schema is approved and verified      ", chalk.default.yellow("<skipped>"));
      console.log("       Approvals validation is skipped intentionally for dynamic schemas");
      approvalSkipped++;
    } else {
      let approvalResult = launchCodesProvider.checkApprovalAndVerification(item.name, checksumResult.schemaIndex, checksumResult.inventorySchema, launchCodes);
      if (!approvalResult) {
        const schemaInfo = launchCodesProvider.findSchemaInfo(item.name, item.version, launchCodes);
        approvalResult = launchCodesProvider.checkApprovalAndVerification(item.name, schemaInfo.schemaIndex, schemaInfo.inventorySchema, launchCodes);

      }

      if (approvalResult) {
        console.log("   > Released schema is approved and verified      ", chalk.default.green("<passed>"));
      } else {
        console.log("   > Released schema is approved and verified      ", chalk.default.red("<failed>"));
        approvalFailed++;
      }
    }
  }

  console.log("\n\n------------------ SUMMARY -----------------");
  console.log("BIS Rule Violations:               ", validFailed);
  console.log("BIS Rule Validation Skipped:       ", validSkipped);
  console.log("BIS Rule Validation Errors:        ", validError);
  console.log("Differences Found:                 ", diffChanged);
  console.log("Differences Skipped:               ", diffSkipped);
  console.log("Differences Errors:                ", diffErrors);
  console.log("Differences Warnings:              ", diffWarnings);
  console.log("Checksums Failed:                  ", checksumFailed);
  console.log("Checksums Skipped:                 ", checksumSkipped);
  console.log("Approval and Verification Failed:  ", approvalFailed);
  console.log("Approval and Verification Skipped: ", approvalSkipped);
  console.log("--------------------------------------------");

  if (diffChanged === 0 && diffErrors === 0 && validFailed === 0 && checksumFailed === 0 && approvalFailed === 0) {
    console.log("All validations passed successfully.");
  } else {
    throw Error("Failing the tool because a validation has failed.");
  }
}

if (program.verifyIModelSchemas === true) {
  validateInput().then()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
