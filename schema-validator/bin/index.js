#!/usr/bin/env node

/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

const commander = require("commander");
const chalk = require("chalk");

const SchemaValidator = require("../lib/SchemaValidator").SchemaValidator;
const ValidationResultType = require("../lib/SchemaValidator").ValidationResultType;
const ValidationOptions = require("../lib/SchemaValidator").ValidationOptions;

function ref(value, refs) {
  refs.push(value);
  return refs;
}

const program = new commander.Command("schema-validator");
program.option("-i, --input <required>", "The path to an XML or JSON EC Schema file OR a directory holding the same (all *.ecschema.xml and *.ecschema.json files found will be validated).");
program.option("-o, --output [optional]", "Directory to put the validation output file in the format 'MySchema.ecschema.xml.result.txt'.");
program.option("-r, --ref [optional path]", "Optional paths to search when locating schema references (Ex. '-r c:\\dir1 -r c:\\dir2').", ref, []);
program.option("-a, --all", "Validate the entire schema graph.");

program.parse(process.argv);

if (process.argv.length === 0) program.help();

if (!program.input) {
  // tslint:disable-next-line:no-console
  console.log(chalk.red("Invalid input. For help use the '-h' option."));
  process.exit(1);
}

// tslint:disable-next-line:no-console
console.log("\nPerforming schema validation on file/folder " + program.input + ".");

async function validate() {
  try {
    const options = new ValidationOptions(program.input, program.ref, program.all, program.output);
    const results = await SchemaValidator.validate(options);
    for (const line of results) {
      switch (line.resultType) {
        case ValidationResultType.RuleViolation:
          // tslint:disable-next-line:no-console
          console.log(chalk.yellow(line.resultText));
          break;
        case ValidationResultType.Error:
          // tslint:disable-next-line:no-console
          console.log(chalk.red(line.resultText));
          break;
        default:
          // tslint:disable-next-line:no-console
          console.log(chalk.green(line.resultText));
      }
    }
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.log(chalk.red("An error occurred during validation: " + err.message));
    process.exit(1);
  }
}

validate().then(() => {
  // tslint:disable-next-line:no-console
  console.log("End of schema validation.");
}).catch();
