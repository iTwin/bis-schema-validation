#!/usr/bin/env node

/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

const fs = require("fs");
const commander = require("commander");
const verifyIModelSchemas = require("./AppSchemaValidator").verifyAppSchemas;

const program = new commander.Command("App-Schema-Validator NPM CLI");
program.option("--verifyAppSchemas");
program.option("-i, --installerDir <required>", "Path to the directory where application installer was extracted.");
program.option("-b, --baseSchemaRefDir <required>", "Root directory of all released schemas (root of BisSchemas repo).");
program.option("-o, --output <required>", "Path where output files will be generated.");

program.parse(process.argv);

/**
 * Validates the command line inputs for verifyAppSchemas function
 */
async function Main() {
  console.log(process.argv.length);
  if (process.argv.length != 9) {
    console.log("usage : index.js --verifyAppSchemas");
    console.log("   -i, --installerDir                      :Path to the directory where application installer was extracted.");
    console.log("   -b, --baseSchemaRefDir                  :Root directory of all released schemas (root of BisSchemas repo).");
    console.log("   -o, --output                            :Path where output files will be generated.");
    throw new Error("Missing from required arguments and their values.");
  }

  if (!program.installerDir || !program.baseSchemaRefDir || !program.output) {
    console.log(chalk.default.red("Invalid input. For help use the '-h' option."));
    process.exit(1);
  }

  if (!fs.existsSync(program.installerDir)) {
    const error = "App installer directory do not exist: " + program.installerDir;
    throw new Error(error);
  }

  if (!fs.existsSync(program.baseSchemaRefDir)) {
    const error = "baseSchemaRefDir: " + program.baseSchemaRefDir + " is incorrect.";
    throw new Error(error);
  }

  try {
    await verifyIModelSchemas(program.installerDir, false, program.baseSchemaRefDir, program.output);
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

if (program.verifyAppSchemas === true) {
  Main().then()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}


