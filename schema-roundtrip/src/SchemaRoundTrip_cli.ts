/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as commander from "commander";
import * as chalk from "chalk";

import { RoundTripOptions, RoundTripResultType, SchemaRoundTrip } from "./SchemaRoundTrip";

function ref(value: string, refs: string[]) {
  refs.push(value);
  return refs;
}

const program = new commander.Command("schema-roundtrip");
program.option("-i, --input [required]", "The path to an XML EC Schema file (Ex. '-i c:\\dir1\\SchemaA.ecschema.xml).");
program.option("-o, --output [optional]", "Directory to put the re-serialized schema file and comparison output file in the format 'SchemaA.compare.log'.");
program.option("-r, --ref [optional path]", "Optional paths to search when locating schema references (Ex. '-r c:\\dir1 -r c:\\dir2').", ref, []);
program.option("-c, --compare [optional flag]", "Indicates if the resultant serialized schema should be compared to the input schema.");

program.parse(process.argv);

if (process.argv.length === 0)
  program.help();

if (!program.input || !program.output) {
  // tslint:disable-next-line:no-console
  console.log(chalk.red("Invalid input. For help use the '-h' option."));
  process.exit(1);
}

// tslint:disable-next-line:no-console
console.log("\nPerforming schema round trip...");

async function roundTrip() {
  try {
    const options = new RoundTripOptions(program.input, program.ref, program.output, program.compare);
    const results = await SchemaRoundTrip.roundTripSchema(options);
    for (const line of results) {
      switch (line.resultType) {
        case RoundTripResultType.Delta:
          // tslint:disable-next-line:no-console
          console.log(chalk.yellow(line.resultText));
          break;
        case RoundTripResultType.Error:
          // tslint:disable-next-line:no-console
          console.log(chalk.red(line.resultText));
          break;
        default:
          // tslint:disable-next-line:no-console
          console.log(chalk.green(line.resultText));
      }
    }
  } catch (err: any) {
    // tslint:disable-next-line:no-console
    console.log(chalk.red("An error occurred during round trip: " + err.message));
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
roundTrip().then(() => {
  // tslint:disable-next-line:no-console
  console.log("End of schema round trip.");
}).catch();

// tslint:disable-next-line:no-console
// console.log(" ref: %j", program.ref);
