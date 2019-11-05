#!/usr/bin/env node

/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

const commander = require("commander");
const chalk = require("chalk");

const SchemaComparison = require("../lib/SchemaComparison").SchemaComparison; // import { SchemaComparison, ComparisonResultType, CompareOptions } from "./SchemaComparison";
const ComparisonResultType = require("../lib/SchemaComparison").ComparisonResultType;
const CompareOptions = require("../lib/SchemaComparison").CompareOptions;


function ref(value, refs) {
  refs.push(value);
  return refs;
}

function input(value, inputs) {
  inputs.push(value);
  return inputs;
}

const program = new commander.Command("schema-compare");
program.option("-i, --input [required]", "The paths to an XML EC Schema files (Ex. '-i c:\\dir1\\SchemaA.ecschema.xml -i c:\\dir2\\SchemaB.ecschema.xml').", input, []);
program.option("-o, --output [optional]", "Directory to put the comparison output file in the format 'SchemaA.compare.log'.");
program.option("-r, --ref [optional path]", "Optional paths to search when locating schema references (Ex. '-r c:\\dir1 -r c:\\dir2').", ref, []);

program.parse(process.argv);

if (process.argv.length === 0) program.help();

if (!program.input || !program.output) {
  // tslint:disable-next-line:no-console
  console.log(chalk.default.red("Invalid input. For help use the '-h' option."));
  process.exit(1);
}

// tslint:disable-next-line:no-console
console.log("\nPerforming schema comparison...");

async function compare() {
  try {
    const options = new CompareOptions(program.input[0], program.input[1], program.ref, program.output);
    const results = await SchemaComparison.compare(options);
    for (const line of results) {
      switch (line.resultType) {
        case ComparisonResultType.Delta:
          // tslint:disable-next-line:no-console
          console.log(chalk.default.yellow(line.resultText));
          break;
        case ComparisonResultType.Error:
          // tslint:disable-next-line:no-console
          console.log(chalk.default.red(line.resultText));
          break;
        default:
          // tslint:disable-next-line:no-console
          console.log(chalk.default.green(line.resultText));
      }
    }
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.log(chalk.default.red("An error occurred during comparison: " + err.message));
    process.exit(1);
  }
}

compare().then(() => {
  // tslint:disable-next-line:no-console
  console.log("End of schema comparison.");
}).catch();

// tslint:disable-next-line:no-console
// console.log(" ref: %j", program.ref);
