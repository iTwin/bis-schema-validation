
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { compareSchema, IModelValidationResult, iModelValidationResultTypes, isDynamicSchema, ruleViolationError } from "../iModelSchemaValidator";
import { expect } from "chai";
import * as path from "path";
import * as fs from "fs";

describe("iModelSchemaValidator Tests", async () => {

  it("Dynamic Schema, A schema is a dynamic schema.", async () => {
    const schemaFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaE.ecschema.xml");
    expect(isDynamicSchema(schemaFile)).to.equal(true);
  });

  it("Dynamic Schema, A schema is not dynamic schema.", async () => {
    const schemaFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    expect(isDynamicSchema(schemaFile)).to.equal(false);
  });

  it("Schema Comparison, Difference is not reference only", async () => {
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaB.ecschema.xml");
    const references = path.normalize(__dirname + "/assets/references/");
    const outputDir = path.normalize(__dirname);
    const validationResult: IModelValidationResult = { name: "SchemaB", version: "01.01.01" };

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      await compareSchema("SchemaA", "wip", schemaAFile, schemaBFile, [], [references], outputDir, validationResult);
    } else {
      await compareSchema("SchemaA", "wip", schemaAFile, schemaBFile, [], [references], outputDir, validationResult);
    }
    expect(validationResult.comparer).to.equal(iModelValidationResultTypes.Failed);
  });

  it("Schema Comparison, Difference is reference only", async () => {
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaD.ecschema.xml");
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/subAssets/"), "SchemaD.ecschema.xml");
    const references = path.normalize(__dirname + "/assets/references/");
    const outputDir = path.normalize(__dirname);
    const validationResult: IModelValidationResult = { name: "SchemaD", version: "01.00.01" };

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      await compareSchema("SchemaD", "wip", schemaAFile, schemaBFile, [references], [], outputDir, validationResult);
    } else {
      await compareSchema("SchemaD", "wip", schemaAFile, schemaBFile, [references], [], outputDir, validationResult);
    }
    expect(validationResult.comparer).to.equal(iModelValidationResultTypes.ReferenceDifferenceWarning);
  });

  it("BIS Rule Violation, Violation is of type error", async () => {
    const violation = ruleViolationError("Error BIS-001: Test rule.");
    expect(violation).to.equal(true);
  });

  it("BIS Rule Violation, Violation is not of type error", async () => {
    const violation = ruleViolationError("Warning BIS-001: Test rule.");
    expect(violation).to.equals(false);
  });

  it("EC Rule Violation, Violation is of type error", async () => {
    const violation = ruleViolationError("Error ECObjects-101: Test rule.");
    expect(violation).to.equal(true);
  });

  it("EC Rule Violation, Violation is not of type error", async () => {
    const violation = ruleViolationError("Warning ECObjects-101: Test rule.");
    expect(violation).to.equals(false);
  });

});
