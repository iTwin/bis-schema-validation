#!/usr/bin/env node

/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

const commander = require("commander");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const IModelProvider = require("./IModelProvider").IModelProvider;
const verifyIModelSchemas = require("./iModelSchemaValidator").verifyIModelSchemas;

const program = new commander.Command("iModel-Schema-Validator NPM CLI");
program.option("--verifyIModelSchemas");
program.option("-u, --userName <required>", "Username for connecting with HUB using OIDC Auth.");
program.option("-p, --password <required>", "Password for connecting with HUB using OIDC Auth.");
program.option("-r, --projectId <required>", "Id of project on HUB.");
program.option("-i, --iModelName <required>", "Name of iModel (case sensitive) within project on HUB.");
program.option("-e, --environment <required>", "DEV, QA and PROD are available environments.");
program.option("-b, --baseSchemaRefDir <required>", "Root directory of all released schemas (root of BisSchemas repo).");
program.option("-o, --output <required>", "The path where output files will be generated.");
program.option("-c, --checkReleaseDynamicSchema", "Check all dynamic schemas within iModel. Default is false.");
program.option("-d, --imjs_uri", "The default imjs url.");

program.parse(process.argv);

/**
 * Validates the command line inputs for verifyIModelSchemas function
 */
async function validateInput() {
  if (process.argv.length < 18) {
    console.log("usage : index.js --verifyIModelSchemas");
    console.log("   -u, --userName                          :Username for connecting with HUB");
    console.log("   -p, --password                          :Password for connecting with HUB.");
    console.log("   -r, --projectId                         :Id of project on HUB.");
    console.log("   -i, --iModelName                        :Name of iModel (case sensitive) within project on HUB.");
    console.log("   -e, --environment                       :DEV or QA environments.");
    console.log("   -b, --baseSchemaRefDir                  :Root directory of all released schemas (root of BisSchemas repo).");
    console.log("   -o, --output                            :The path where output files will be generated.");
    console.log("   -c, --checkReleaseDynamicSchema         :Check all dynamic schemas within iModel. Default is false.");
    console.log("   -d, --imjs_uri                          :The default imjs url.");
    throw new Error("Missing from required arguments and their values.");
  }

  if (!program.userName || !program.password || !program.projectId || !program.iModelName ||
    !program.baseSchemaRefDir || !program.environment || !program.output || !program.imjs_uri) {
    console.log(chalk.default.red("Invalid input. For help use the '-h' option."));
    process.exit(1);
  }

  const env = program.environment.toUpperCase();
  if (env.includes("QA") || env.includes("DEV") || env.includes("PROD")) {
  } else {
    const error = "Environment value is incorrect. DEV, QA and PROD are acceptable environment values. ";
    throw new Error(error);
  }

  if (!fs.existsSync(program.baseSchemaRefDir)) {
    const error = "baseSchemaRefDir: " + program.baseSchemaRefDir + " is incorrect.";
    throw new Error(error);
  }

  const tmpDir = process.env.TMP;
  const validationDir = path.join(tmpDir, "SchemaValidation");
  const briefcaseDir = path.join(validationDir, "Briefcases", program.iModelName);
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

  try {
    const iModelSchemaDir = await IModelProvider.exportSchemasFromIModel(program.projectId, program.iModelName, briefcaseDir, program.userName, program.password, program.environment, program.imjs_uri);
    await verifyIModelSchemas(iModelSchemaDir, checkReleaseDynamicSchema, program.baseSchemaRefDir, program.output);
    process.exit(0); // exit forcefully
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

if (program.verifyIModelSchemas === true) {
  validateInput().then()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}


