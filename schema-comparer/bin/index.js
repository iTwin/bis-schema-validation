#!/usr/bin/env node

/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

const commander = require("commander");
const chalk = require("chalk");
const SchemaComparison = require("../lib/SchemaComparison").SchemaComparison;
const ComparisonResultType = require("../lib/SchemaComparison").ComparisonResultType;
const CompareOptions = require("../lib/SchemaComparison").CompareOptions;


function ref1(value, _notUsed) {
  const values = value.split(",");
  return values.map(s => s.trim());
}

function ref2(value, _notUsed) {
  const values = value.split(",");
  return values.map(s => s.trim());
}

function input(value, inputs) {
  inputs.push(value);
  return inputs;
}

const program = new commander.Command("schema-compare");
program.option("-i, --input [required]", "The paths to an XML EC Schema files (Ex. '-i c:\\dir1\\SchemaA.ecschema.xml -i c:\\dir2\\SchemaB.ecschema.xml').", input, []);
program.option("-o, --output [optional]", "Directory to put the comparison output file in the format 'SchemaA.compare.log'.");
program.option("--ref1 [optional path]", "Comma-separated list of paths to search when locating schema 1 references (Ex. '-r1 c:\\dir1, c:\\dir2').", ref1);
program.option("--ref2 [optional path]", "Comma-separated list of paths to search when locating schema 2 references (Ex. '-r2 c:\\dir1, c:\\dir2').", ref2);

program.parse(process.argv);
const options = program.opts();

if (process.argv.length === 0) program.help();

if (!options.input) {
  // tslint:disable-next-line:no-console
  console.log(chalk.red("Invalid input. For help use the '-h' option."));
  process.exit(1);
}

// tslint:disable-next-line:no-console
console.log("\nPerforming schema comparison...");

async function compare() {
  try {
    const compareOptions = new CompareOptions(options.input[0], options.input[1], options.ref1, options.ref2, options.output);
    const results = await SchemaComparison.compare(compareOptions);
    for (const line of results) {
      switch (line.resultType) {
        case ComparisonResultType.Delta:
          // tslint:disable-next-line:no-console
          console.log(chalk.yellow(line.resultText));
          break;
        case ComparisonResultType.Error:
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
    console.log(chalk.red("An error occurred during comparison: " + err.message));
    process.exit(1);
  }
}

compare().then(() => {
  // tslint:disable-next-line:no-console
  console.log("End of schema comparison.");
}).catch();

