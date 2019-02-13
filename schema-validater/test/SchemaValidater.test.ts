/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as fs from "fs-extra";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import sinon = require("sinon");
import * as utils from "./utilities/utils";
import { SchemaValidator, ValidationOptions, standardSchemaNames } from "../source/SchemaValidator";
import { SchemaWalker } from "@bentley/ecschema-metadata/lib/Validation/SchemaWalker";
import { Schema } from "@bentley/ecschema-metadata";

use(chaiAsPromised);

describe("SchemaValidator Tests", () => {
  const assetsDir = utils.getAssetsDir();
  const outDir = utils.getOutDir();
  const refDir = utils.getReferencesDir();

  beforeEach(async () => {
    fs.remove(outDir + "SchemaWithViolations.validation.log");
    fs.remove(outDir + "SchemaA.validation.log");
    fs.remove(outDir + "BaseSchema.validation.log");
  });

  afterEach(async () => {
    sinon.restore();
  });

  it("schemaPath is a directory, validateFile called multiple times.", async () => {
    const options = new ValidationOptions(assetsDir, [], outDir, true);
    const stub = sinon.stub(SchemaValidator, "validateFile").callThrough();

    await SchemaValidator.validate(options);

    const expectedCount = 10;
    expect(stub.callCount).to.equal(expectedCount, `Expected ${expectedCount} calls to validateFile`);
  });

  it("Error traversing schema, results contains expected entries.", async () => {
    sinon.stub(SchemaWalker.prototype, "traverseSchema").throws(new Error("Test Error"));
    const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.xml");
    const options = new ValidationOptions(schemaFile, [], undefined, false);

    const results = await SchemaValidator.validate(options);

    expect(results[2].resultText).to.equal(` An error occurred validating the schema SchemaWithViolations: Test Error`);
  });

  it("Standard schema specified, error reported correctly.", async () => {
    const fileStats = new fs.Stats();
    sinon.stub(fileStats, "isFile").returns(true);
    sinon.stub(fs, "lstat").resolves(fileStats);
    for (const schema of standardSchemaNames) {
      const schemaFile = path.resolve(assetsDir, schema);
      const options = new ValidationOptions(schemaFile, [], outDir, true);
      const result = await SchemaValidator.validate(options);
      expect(result[1].resultText).to.equal(" Standard schemas are not supported by this tool.");
    }
  });

  it("Schema has standard schema reference, standard schema not validated.", async () => {
    const traverseSchema = sinon.stub(SchemaWalker.prototype, "traverseSchema");
    const validateSchema = sinon.stub(SchemaValidator, "validateLoadedSchema").callThrough();
    const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.json");
    const options = new ValidationOptions(schemaFile, [refDir], undefined, true);
    await SchemaValidator.validate(options);

    expect(validateSchema.callCount).to.equal(3);
    const schema = validateSchema.getCall(2).args[0] as Schema;
    expect(schema).not.undefined;
    expect(schema.name).to.equal("CoreCustomAttributes");
    expect(traverseSchema.callCount).to.equal(2, "Expected traverseSchema to be called only twice (schema and base schema).");
  });

  describe("ECXml Schema Tests", () => {
    it("XML Schema has failing rules, diagnostics reported correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.xml");
      const options = new ValidationOptions(schemaFile, [], undefined, false);

      const result = await SchemaValidator.validate(options);

      expect(result.length).to.equal(4, "Expected 4 entries in the result array");
    });

    it("XML Schema has failing rules, validateAll option is false, diagnostics written to file correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.xml");
      const options = new ValidationOptions(schemaFile, [], outDir, false);

      await SchemaValidator.validate(options);

      const baseOutputFile = path.resolve(outDir, "BaseSchema.results.xml");
      const expectedOutFile = path.resolve(assetsDir, "SchemaWithViolations.validation.log");
      const actualOutFile = path.resolve(outDir, "SchemaWithViolations.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(actualOutText.toString()).to.equal(expectedOutText.toString());
      expect(fs.existsSync(baseOutputFile), "BaseSchema results should not have been created").to.be.false;
    });

    it("XML Schema has failing rules, validateAll option is true, diagnostics written to two result files correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.xml");
      const options = new ValidationOptions(schemaFile, [], outDir, true);

      await SchemaValidator.validate(options);

      let expectedOutFile = path.resolve(assetsDir, "SchemaWithViolations.validation.log");
      let actualOutFile = path.resolve(outDir, "SchemaWithViolations.validation.log");
      let expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      let actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(actualOutText.toString()).to.equal(expectedOutText.toString());

      expectedOutFile = path.resolve(assetsDir, "BaseSchema.validation.log");
      actualOutFile = path.resolve(outDir, "BaseSchema.validation.log");
      expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(actualOutText.toString()).to.equal(expectedOutText.toString());
    });

    it("XML Schema has no failing rules, output written to file correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
      const options = new ValidationOptions(schemaFile, [refDir], outDir, false);

      await SchemaValidator.validate(options);

      const expectedOutFile = path.resolve(assetsDir, "SchemaA.validation.log");
      const actualOutFile = path.resolve(outDir, "SchemaA.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(actualOutText.toString()).to.equal(expectedOutText.toString());
    });

    it("out path does not exist, throws", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.xml");
      const badPath = path.resolve(assetsDir, "DoesNotExist");
      const options = new ValidationOptions(schemaFile, [], badPath, false);

      await expect(SchemaValidator.validate(options)).to.be.rejectedWith(Error, `The out directory ${badPath + path.sep} does not exist.`);
    });
  });

  describe("ECJson Schema Tests", () => {
    it("JSON Schema has failing rules, diagnostics reported correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.json");
      const options = new ValidationOptions(schemaFile, [refDir], undefined, false);
      const result = await SchemaValidator.validate(options);

      expect(result.length).to.equal(4, "Expected 4 entries in the result array");
    });

    it("JSON Schema has failing rules, diagnostics written to file correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.json");
      const options = new ValidationOptions(schemaFile, [refDir], outDir, false);

      await SchemaValidator.validate(options);

      const expectedOutFile = path.resolve(assetsDir, "SchemaWithViolations.validation.log");
      const actualOutFile = path.resolve(outDir, "SchemaWithViolations.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(actualOutText.toString()).to.equal(expectedOutText.toString());
    });
  });
});
