/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { IModelProvider, HostConfig } from "./IModelProvider";
import { generateSchemaDirectoryLists } from "./SchemaPathUtils/FindSchemas";
import { LaunchCodesProvider } from "./LaunchCodesProvider";
import { IModelDb, IModelHost } from "@bentley/imodeljs-backend";
import { SchemaComparison, CompareOptions, ComparisonResultType } from "@bentley/schema-comparer";
import { SchemaValidator, ValidationOptions, ValidationResultType } from "@bentley/schema-validator";
import * as path from "path";
import * as commander from "commander";
import * as chalk from "chalk";
import * as fs from "fs";
import * as rimraf from "rimraf";

const program = new commander.Command("Schema Signoff Tool");
program.option("--verifyIModelSchemas");
program.option("-u, --hubUserName <required>", "Username for connecting with HUB.");
program.option("-p, --hubPassword <required>", "password for connecting with HUB.");
program.option("-r, --ProjectId <required>", "Id of project on HUB.");
program.option("-i, --iModelName <required>", "Name of iModel (case sensitive) within project on HUB.");
program.option("-e, --Environment <required>", "DEV, QA and PROD are available environments.");
program.option("-b, --baseSchemaRefDir <required>", "Root directory of all released schemas (root of BisSchemas repo).");
program.option("-c, --checkreleasedynamicschema <required>", "Toggle to check all dynamic schemas, within the provided iModel, are marked as release. Default is false.");
program.option("-o, --output <required>", "The path where output files will be generated.");
program.option("--getLaunchCodes");
program.option("-d, --domUserName <required>",  "Domain username");
program.option("-s, --domPassword <required>",  "Domain password");

program.parse(process.argv);

/**
 * Verifies an iModel schema
 */
async function verifyIModelSchemas() {

    if ( process.argv.length < 16) {
        console.log("usage : signoff.js --verifyIModelSchemas");
        console.log("   -u, --hubUserName                  :Username for connecting with HUB");
        console.log("   -p, --hubPassword                  :password for connecting with HUB.");
        console.log("   -r, --ProjectId                    :Id of project on HUB.");
        console.log("   -i, --iModelName                   :Name of iModel (case sensitive) within project on HUB.");
        console.log("   -e, --Environment                  :DEV or QA environments.");
        console.log("   -b, --baseSchemaRefDir             :Root directory of all released schemas (root of BisSchemas repo).");
        console.log("   -c, --checkreleasedynamicschema    :Toggle to check all dynamic schemas, within the provided iModel, are marked as release. Default is false.");
        console.log("   -o, --output                       :The path where output files will be generated.");
        throw new Error("Some thing missing from required arguments and their values.");
    }

    if (!program.hubUserName || !program.hubPassword || !program.ProjectId ||
        !program.iModelName || !program.baseSchemaRefDir || !program.Environment || !program.output) {
      console.log(chalk.default.red("Invalid input. For help use the '-h' option."));
      process.exit(1);
    }

    const env: string = program.Environment.toUpperCase();
    if (env.includes("QA") || env.includes("DEV") || env.includes("PROD")) {
    } else {
        const error = "Environment value is incorrect. DEV, QA and PROD are acceptable environment values. ";
        throw new Error(error);
    }

    if (fs.existsSync(program.baseSchemaRefDir)) {
    } else {
        const error = "baseSchemaRefDir: " + program.baseSchemaRefDir + " is incorrect.";
        throw new Error(error);
    }

    const releasedSchemas = (await generateSchemaDirectoryLists(program.baseSchemaRefDir)).releasedDir;
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const launchcodes = launchCodesProvider.getLaunchcodeDict(true);
    const tmpDir: any = process.env.TMP;
    const validationDir: string = path.join(tmpDir, "SchemaValidation");
    const briefcaseDir: string = path.join (validationDir, "Briefcases", program.iModelName);
    const exportedSchemas: string = path.join (briefcaseDir, "exported");

    if (fs.existsSync(briefcaseDir)) {
        console.log("removing old briefcase : " + briefcaseDir);
        rimraf.sync(briefcaseDir);
    }

    // creating new dir
    fs.mkdirSync(briefcaseDir);
    console.log(briefcaseDir);

    const localfile = await getLocaliModelPath(briefcaseDir); // Download iModel
    console.log("Path of downloaded iModel: " + localfile);

    const briefcase: IModelDb = IModelDb.openStandalone(localfile, 1);

    // export schemas to a directory
    if (fs.existsSync(exportedSchemas)) {
        console.log("removing old exported Schemas : " + exportedSchemas);
        rimraf.sync(exportedSchemas);
    }

    // creating new dir
    fs.mkdirSync(exportedSchemas);
    console.log(exportedSchemas);
    briefcase.nativeDb.exportSchemas(exportedSchemas);

    // exported schema files paths
    const referencePaths = Array.from( releasedSchemas.keys() );

    let ruleVoilations = 0;
    let diffChanged = 0;
    let diffErrors = 0;
    let approvalFailed = 0;

    for (const schemaAFile of fs.readdirSync(exportedSchemas)) {
        const schemaAPath = path.join(exportedSchemas, schemaAFile);
        let version: any = schemaAFile.split(".");
        const name = version[0];
        // tslint:disable-next-line: radix
        version = parseInt(version[1]) + "." + parseInt(version[2]) + "." + parseInt(version[3]);

        console.log("\nBEGIN VALIDATION AND DIFFERENCE AUDIT: ", name, version);
        try {
            const validationOptions: ValidationOptions = new ValidationOptions(schemaAPath, referencePaths, false, program.output);
            const validatorResult = await SchemaValidator.validate(validationOptions);
            IModelHost.shutdown(); // temporary solotion for the issue coming from the validator
            for (const line of validatorResult) {
                switch (line.resultType) {
                  case ValidationResultType.RuleViolation:
                    // tslint:disable-next-line:no-console
                    console.log(chalk.default.yellow(line.resultText));
                    ruleVoilations++;
                    break;
                  case ValidationResultType.Error:
                    // tslint:disable-next-line:no-console
                    console.log(chalk.default.red(line.resultText));
                    break;
                  default:
                    // tslint:disable-next-line:no-console
                    console.log(chalk.default.green(line.resultText));
                }
              }
        } catch (error) {
                // tslint:disable-next-line:no-console
                console.log(chalk.default.red("An error occurred during validation: " + error.message));
        }

        // findout if a schema is dynamic or not
        const schemaText = fs.readFileSync(schemaAPath, "utf-8");
        const schemaType = schemaText.match(/<DynamicSchema ([^]+?)\/>/g);
        if (schemaType) {
            console.log(chalk.default.grey("Skipping difference audit for ", name, version, ". The schema is a dynamic schema and released versions of dynamic schemas are not saved."));
        } else {
            // Findout Difference
           let schemaBPath = "";
           for ( const dir of releasedSchemas) {
               fs.readdirSync(dir).forEach((schemaBfile) => {
                   if (schemaBfile === schemaAFile) {
                    schemaBPath = path.join(dir, schemaBfile);
                   }});
           }

           if (!schemaBPath) {
               console.log(chalk.default.grey("Skipping difference audit for ", name, version, ". No released schema found."));
           } else {

               try {
                const compareOptions: CompareOptions = new CompareOptions(schemaAPath, schemaBPath, referencePaths, program.output);
                const comparisonResults = await SchemaComparison.compare(compareOptions);
                for (const line of comparisonResults) {
                  switch (line.resultType) {
                    case ComparisonResultType.Delta:
                      // tslint:disable-next-line:no-console
                      console.log(chalk.default.yellow(line.resultText));
                      diffChanged++;
                      break;
                    case ComparisonResultType.Error:
                      // tslint:disable-next-line:no-console
                      console.log(chalk.default.red(line.resultText));
                      diffErrors++;
                      break;
                    default:
                      // tslint:disable-next-line:no-console
                      console.log(chalk.default.green(line.resultText));
                  }
                }
              } catch (err) {
                // tslint:disable-next-line:no-console
                console.log(chalk.default.red("An error occurred during comparison: " + err.message));
              }
           }
        }
        // exit(0);
        console.log("END VALIDATION AND DIFFERENCE AUDIT: ", name, version);
        console.log("CHECK RELEASED SECHEMA IS APPROVED AND VARIFIED");

        let checker = false;

        for (let index = 0; index < launchcodes.checksumInfo.length; index++) {
            if (launchcodes.checksumInfo[index]["SchemaName"] === name && launchcodes.checksumInfo[index]["Comment"] === version ) {
                if (launchcodes.checksumInfo[index]["ok"].toLowerCase() === "yes" && launchcodes.checksumInfo[index]["ok1"].toLowerCase() === "yes") {
                    console.log(chalk.default.green("Schema is approved and varified."));
                    checker = true;
                    break;
                } else {
                    console.log(chalk.default.red("Released schema missing approval or verification. See: http:///bin/view.pl/Main/BisChecksum."));
                    approvalFailed++;
                    checker = true;
                    break;
                }
            }
        }
        if (!checker) {
            console.log(chalk.default.red("There is no entry in the wiki for this schema."));
            approvalFailed++;
        }
        console.log("END VALIDATION AND DIFFERENCE AUDIT: ", name, version);
    }
    briefcase.closeStandalone();

    console.log("\n\n----------- SUMMARY -----------");
    console.log("Total Rule Voilations: ", ruleVoilations);
    console.log("Total Differences: ", diffChanged);
    console.log("Total Difference Errors: ", diffErrors);
    console.log("Total Approval and Verification Failures: ", approvalFailed);
    console.log("-------------------------------");
}

/**
 * Gets an iModel from Hub and return its path
 */
async function getLocaliModelPath(briefcasepath: string): Promise<string> {

    const imodelHost = new HostConfig();
    imodelHost.setupHost(program.Environment.toUpperCase(), briefcasepath);

    const hubConnection = new IModelProvider();
    await hubConnection.connect(program.hubUserName, program.hubPassword);
    const iModelid = await hubConnection.getIModelId(program.ProjectId, program.iModelName);
    console.log("iModel Id: " + iModelid);
    if (!iModelid) {
        throw new Error("iModel either not exist or not found!");
    }

    const imodel: IModelDb = await hubConnection.openIModel(program.ProjectId, iModelid);
    console.log("iModel Downloaded.");

    const localFile = imodel.briefcase.pathname;
    IModelHost.shutdown();

    if (fs.existsSync(localFile) === false) {
        const error = "iModel path not found: " + localFile;
        throw new Error(error);
    } else {
        return localFile;
    }
}

/**
 * Gets the launch codes information main function
 */
async function getLaunchCodes( ) {

    if ( process.argv.length < 6 ) {
        console.log("usage : signoff.js --getLaunchCodes");
        console.log("   options:");
        console.log("        --domUserName      : Domain username");
        console.log("        --domPassword      : Domain password");
        throw new Error("Some thing missing from required arguments and their values.");
    }

    if (!program.domUserName || !program.domPassword) {
        console.log(chalk.default.red("Invalid input. For help use the '-h' option."));
        process.exit(1);
      }

    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const data: any =  await launchCodesProvider.getCheksumInfofromWiki(program.domUserName, program.domPassword);
    if (data.toString().includes("Unauthorized")) {
        throw new Error("Unauthorized request. Please verify domain username and password arguments.");
    }
    const launchcodesFilePath = launchCodesProvider.getLaunchcodesFilePath();
    launchCodesProvider.writeChecksumtoJson(launchcodesFilePath, data);
    console.log("Data is written to the JSON file: " + launchcodesFilePath);
}

if (program.verifyIModelSchemas === true) {
    verifyIModelSchemas().then()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
} else if (program.getLaunchCodes === true) {
    getLaunchCodes().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
