/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";
import { LaunchCodesProvider } from "./LaunchCodesProvider";
import { IModelValidationResult, iModelValidationResultTypes } from "./iModelSchemaValidator";

/**
 * This class reports validation results
 */
export class Reporter {
  private _validError = 0;
  private _validSkipped = 0;
  private _diffWarnings = 0;
  private _diffSkipped = 0;
  private _approvalSkipped = 0;
  private _checksumResult;
  private _launchCodesProvider = new LaunchCodesProvider();
  public approvalFailed = 0;
  public validFailed = 0;
  public diffChanged = 0;
  public diffErrors = 0;

  /**
   * Write comparer and validator logs of a schema to a txt file.
   * @param schemaName: It is the name of a schema,
   * @param version: It is the version of a schema.
   * @param logs: It is the message for logging.
   * @param outputDir: The directory where output file will go.
   */
  public static writeToLogFile(schemaName: string, version: string, logs: string, outputDir: string): void {
    const fileName = `${schemaName}.${version}.logs`;
    const filePath = path.join(outputDir, fileName);
    fs.appendFileSync(filePath, logs);
  }

  /**
   * Ensure the directory for all validations results log file.
   * @param output: It is the output directory.
   */
  private allValidationLogsDir(output: string) {
    const logDir = path.join(output, "AllValidationResults");
    if (!fs.existsSync(logDir))
      fs.mkdirSync(logDir, { recursive: true });
    return logDir;
  }

  /**
   * Log results of bis rules validation.
   * @param result: It contains validation results data.
   * @param fileDescriptor: It is the file descriptor.
   */
  private logSchemaValidatorResult(result: IModelValidationResult, fileDescriptor: any) {
    switch (result.validator) {
      case iModelValidationResultTypes.Passed:
        fs.writeSync(fileDescriptor, "   > Schema validation against BIS rules           <passed>\n");
        break;
      case iModelValidationResultTypes.Failed:
        fs.writeSync(fileDescriptor, "   > Schema validation against BIS rules           <failed>\n");
        fs.writeSync(fileDescriptor, `       BIS validation FAILED. See logs: ${result.name}.${result.version}.log")\n`);
        this.validFailed++;
        break;
      case iModelValidationResultTypes.Error:
        fs.writeSync(fileDescriptor, "   > Schema validation against BIS rules           <failed>\n");
        fs.writeSync(fileDescriptor, `       An error occurred during the BIS validation audit. See logs: ${result.name}.${result.version}.log")\n`);
        this._validError++;
        break;
      case iModelValidationResultTypes.Skipped:
        fs.writeSync(fileDescriptor, "   > Schema validation against BIS rules           <skipped>\n");
        fs.writeSync(fileDescriptor, `       Standard schemas are not supported by this tool.")\n`);
        this._validSkipped++;
        break;
      default:
        fs.writeSync(fileDescriptor, "   > Schema validation against BIS rules           <failed>\n");
        fs.writeSync(fileDescriptor, `       Failed to perform the validation audit for: ${result.name}.${result.version}. See logs: ${result.name}.${result.version}.log")\n`);
        this._validError++;
    }
  }

  /**
   * Log results of schema comparison validation.
   * @param result: It contains results data.
   * @param fileDescriptor: It is the file descriptor.
   */
  private logSchemaComparerResult(result: IModelValidationResult, fileDescriptor: any) {
    switch (result.comparer) {
      case iModelValidationResultTypes.Passed:
        fs.writeSync(fileDescriptor, "   > Schema content verification                   <passed>\n");
        break;
      case iModelValidationResultTypes.Failed:
        fs.writeSync(fileDescriptor, "   > Schema content verification                   <failed>\n");
        fs.writeSync(fileDescriptor, `       Schema has changes with released one. See logs: ${result.name}.${result.version}.log")\n`);
        this.diffChanged++;
        break;
      case iModelValidationResultTypes.ReferenceDifferenceWarning:
        fs.writeSync(fileDescriptor, "   > Schema content verification                   <warning>\n");
        fs.writeSync(fileDescriptor, `       Schema has reference only differences with released one. See logs:  ${result.name}.${result.version}.log")\n`);
        this._diffWarnings++;
        break;
      case iModelValidationResultTypes.Error:
        fs.writeSync(fileDescriptor, "   > Schema content verification                   <failed>\n");
        fs.writeSync(fileDescriptor, `       An error occurred during the difference audit. See logs:  ${result.name}.${result.version}.log")\n`);
        this.diffErrors++;
        break;
      case iModelValidationResultTypes.Skipped:
        fs.writeSync(fileDescriptor, "   > Schema content verification                   <skipped>\n");
        this._diffSkipped++;
        break;
      case iModelValidationResultTypes.NotFound:
        fs.writeSync(fileDescriptor, "   > Schema content verification                   <failed>\n");
        fs.writeSync(fileDescriptor, `       Failed to perform the difference audit. There is no released schema for: ${result.name}.${result.version}\")\n`);
        this.diffErrors++;
        break;
      default:
        fs.writeSync(fileDescriptor, "   > Schema content verification                   <failed>\n");
        fs.writeSync(fileDescriptor, `       Failed to perform the difference audit for: ${result.name}.${result.version}. See logs:  ${result.name}.${result.version}.log"")\n`);
        this.diffErrors++;
    }
  }

  /**
   * Log approval validation results.
   * @param result: It contains results data.
   * @param fileDescriptor: It is the file descriptor.
   * @param launchCodes: Json object containing the launchCodes.
   */
  private logApprovalValidationResult(result: IModelValidationResult, fileDescriptor: any, launchCodes: any) {
    if (result.approval === iModelValidationResultTypes.Skipped) {
      fs.writeSync(fileDescriptor, "   > Released schema is approved and verified      <skipped>\n");
      fs.writeSync(fileDescriptor, "       Approvals validation is skipped intentionally for dynamic schemas\n");
      this._approvalSkipped++;
    } else {
      const schemaInfo = this._launchCodesProvider.findSchemaInfo(result.name, result.version, launchCodes);
      const approvalResult = this._launchCodesProvider.checkApprovalAndVerification(result.name, schemaInfo.schemaIndex, schemaInfo.inventorySchema, launchCodes);

      if (approvalResult) {
        fs.writeSync(fileDescriptor, "   > Released schema is approved and verified      <passed>\n");
      } else {
        fs.writeSync(fileDescriptor, "   > Released schema is approved and verified      <failed>\n");
        this.approvalFailed++;
      }
    }
  }

  /**
   * Display results of bis rules validation.
   * @param result: It contains validation results data.
   */
  private displaySchemaValidatorResult(result: IModelValidationResult) {
    switch (result.validator) {
      case iModelValidationResultTypes.Passed:
        console.log("   > Schema validation against BIS rules           ", chalk.green("<passed>"));
        break;
      case iModelValidationResultTypes.Failed:
        console.log("   > Schema validation against BIS rules           ", chalk.red("<failed>"));
        console.log("       BIS validation FAILED. See log for errors. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", result.name, result.version);
        break;
      case iModelValidationResultTypes.Error:
        console.log("   > Schema validation against BIS rules           ", chalk.red("<failed>"));
        console.log("       An error occurred during the BIS validation audit. See log for errors. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", result.name, result.version);
        break;
      case iModelValidationResultTypes.Skipped:
        console.log("   > Schema validation against BIS rules           ", chalk.yellow("<skipped>"));
        console.log("       Standard schemas are not supported by this tool. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", result.name, result.version);
        break;
      default:
        console.log("   > Schema validation against BIS rules           ", chalk.red("<failed>"));
        console.log("       Failed to perform the validation audit for: %s.%s\")", result.name, result.version);
    }
  }

  /**
   * Display results of schema comparison validation.
   * @param result: It contains results data.
   */
  private displaySchemaComparerResult(result: IModelValidationResult) {
    switch (result.comparer) {
      case iModelValidationResultTypes.Passed:
        console.log("   > Schema content verification                   ", chalk.green("<passed>"));
        break;
      case iModelValidationResultTypes.Failed:
        console.log("   > Schema content verification                   ", chalk.red("<failed>"));
        console.log("       Schema has changes with released one. See log for diff. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", result.name, result.version);
        break;
      case iModelValidationResultTypes.ReferenceDifferenceWarning:
        console.log("   > Schema content verification                   ", chalk.red("<warning>"));
        console.log("       Schema has reference only differences with released one. See log for diff. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", result.name, result.version);
        break;
      case iModelValidationResultTypes.Error:
        console.log("   > Schema content verification                   ", chalk.red("<failed>"));
        console.log("       An error occurred during the difference audit. See log for errors. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", result.name, result.version);
        break;
      case iModelValidationResultTypes.Skipped:
        console.log("   > Schema content verification                   ", chalk.yellow("<skipped>"));
        console.log("       Skipped difference audit. See log for errors. (search for \"BEGIN VALIDATION AND DIFFERENCE AUDIT: %s.%s\")", result.name, result.version);
        break;
      case iModelValidationResultTypes.NotFound:
        console.log("   > Schema content verification                   ", chalk.red("<failed>"));
        console.log("       Failed to perform the difference audit. There is no released schema for: %s.%s\")", result.name, result.version);
        break;
      default:
        console.log("   > Schema content verification                   ", chalk.red("<failed>"));
        console.log("       Failed to perform the difference audit for: %s.%s\")", result.name, result.version);
    }
  }

  /**
   * Display approval validation results.
   * @param result: It contains results data.
   * @param launchCodes: Json object containing the launchCodes.
   */
  private displayApprovalValidationResult(result: IModelValidationResult, launchCodes: any) {
    // skip checking against approvals, if the schema is dynamic schema
    if (result.approval === iModelValidationResultTypes.Skipped) {
      console.log("   > Released schema is approved and verified      ", chalk.yellow("<skipped>"));
      console.log("       Approvals validation is skipped intentionally for dynamic schemas");
    } else {
      const schemaInfo = this._launchCodesProvider.findSchemaInfo(result.name, result.version, launchCodes);
      const approvalResult = this._launchCodesProvider.checkApprovalAndVerification(result.name, schemaInfo.schemaIndex, schemaInfo.inventorySchema, launchCodes);

      if (approvalResult) {
        console.log("   > Released schema is approved and verified      ", chalk.green("<passed>"));
      } else {
        console.log("   > Released schema is approved and verified      ", chalk.red("<failed>"));
      }
    }
  }

  /**
   * Write results of all validations in log file.
   * @param results It contains results data.
   * @param baseSchemaRefDir: It is the root of bis-schemas directory.
   * @param outputDir: Path of output directory.
   */
  public logAllValidationsResults(results: IModelValidationResult[], baseSchemaRefDir: string, outputDir: string) {
    const launchCodes = this._launchCodesProvider.getSchemaInventory(baseSchemaRefDir);
    outputDir = this.allValidationLogsDir(outputDir);
    const filePath = path.join(outputDir, "AllValidationsResults.logs");
    const fd = fs.openSync(filePath, "a");
    fs.writeSync(fd, "iModel schemas:");
    for (const item of results) {
      fs.writeSync(fd, `\n> ${item.name}.${item.version}\n`);
      this.logSchemaValidatorResult(item, fd);
      this.logSchemaComparerResult(item, fd);
      this.logApprovalValidationResult(item, fd, launchCodes);
    }
    fs.writeSync(fd, "\n\n------------------ SUMMARY -----------------\n");
    fs.writeSync(fd, `BIS Rule Violations:               ${this.validFailed}\n`);
    fs.writeSync(fd, `BIS Rule Validation Skipped:       ${this._validSkipped}\n`);
    fs.writeSync(fd, `BIS Rule Validation Errors:        ${this._validError}\n`);
    fs.writeSync(fd, `Differences Found:                 ${this.diffChanged}\n`);
    fs.writeSync(fd, `Differences Skipped:               ${this._diffSkipped}\n`);
    fs.writeSync(fd, `Differences Errors:                ${this.diffErrors}\n`);
    fs.writeSync(fd, `Differences Warnings:              ${this._diffWarnings}\n`);
    fs.writeSync(fd, `Approval and Verification Failed:  ${this.approvalFailed}\n`);
    fs.writeSync(fd, `Approval and Verification Skipped: ${this._approvalSkipped}\n`);
    fs.writeSync(fd, "--------------------------------------------");
  }

  /**
   * Display results of all validations in log file.
   * @param results It contains results data.
   * @param baseSchemaRefDir: It is the root of bis-schemas directory.
   * @param outputDir: Path of output directory.
   */
  public displayAllValidationsResults(results: IModelValidationResult[], baseSchemaRefDir: string) {
    const launchCodes = this._launchCodesProvider.getSchemaInventory(baseSchemaRefDir);
    console.log("\niModel schemas:");
    for (const item of results) {
      console.log("\n> %s.%s", item.name, item.version);
      this.displaySchemaValidatorResult(item);
      this.displaySchemaComparerResult(item);
      this.displayApprovalValidationResult(item, launchCodes);
    }
    console.log("\n\n------------------ SUMMARY -----------------");
    console.log("BIS Rule Violations:               ", this.validFailed);
    console.log("BIS Rule Validation Skipped:       ", this._validSkipped);
    console.log("BIS Rule Validation Errors:        ", this._validError);
    console.log("Differences Found:                 ", this.diffChanged);
    console.log("Differences Skipped:               ", this._diffSkipped);
    console.log("Differences Errors:                ", this.diffErrors);
    console.log("Differences Warnings:              ", this._diffWarnings);
    console.log("Approval and Verification Failed:  ", this.approvalFailed);
    console.log("Approval and Verification Skipped: ", this._approvalSkipped);
    console.log("--------------------------------------------");
  }
}
