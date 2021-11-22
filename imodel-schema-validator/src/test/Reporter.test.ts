/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { Reporter } from "../Reporter";
import { compareSchema, IModelValidationResult, verifyIModelSchema } from "../iModelSchemaValidator";

describe("Reporter class tests.", () => {

  const bisSchemaRepo: any = process.env.BisSchemaRepo;
  const references = path.normalize(__dirname + "/assets/references/");
  const outputDir = path.normalize(__dirname);
  const reporter = new Reporter();

  it("Log comparison validation result.", async () => {
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaB.ecschema.xml");
    const validationResult: IModelValidationResult = { name: "SchemaB", version: "01.01.01" };
    const output = path.join(outputDir, "wip");

    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true });
      await compareSchema("SchemaA", "wip", schemaAFile, schemaBFile, [], [references], output, validationResult);
    } else {
      await compareSchema("SchemaA", "wip", schemaAFile, schemaBFile, [], [references], output, validationResult);
    }

    let result = false;
    const outputFIle = path.join(output, "SchemaA.wip.logs");
    if (fs.existsSync(outputFIle))
      result = true;
    expect(result).to.equals(true);
  });

  it.only("Log all validation results.", async () => {
    const exportDir = path.resolve(path.normalize(__dirname + "/assets/"));
    const output = path.join(outputDir, "wip");

    const result = await verifyIModelSchema(exportDir, "SchemaG.01.00.02.ecschema.xml", false, bisSchemaRepo, output);
    reporter.logAllValidationsResults([result], bisSchemaRepo, output);

    let check = false;
    const outputFIle = path.join(output, "SchemaG.01.00.02.logs");
    const allResultsFile = path.join(output, "AllValidationResults", "AllValidationsResults.logs");
    console.log(allResultsFile);
    if (fs.existsSync(outputFIle) && fs.existsSync(allResultsFile))
      check = true;
    expect(check).to.equals(true);
  });

});
