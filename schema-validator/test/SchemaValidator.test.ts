/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as fs from "fs-extra";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import * as utils from "./utilities/utils";
import { SchemaValidator, ValidationOptions, standardSchemaNames } from "../src/SchemaValidator";
import { SchemaWalker } from "@bentley/ecschema-metadata/lib/Validation/SchemaWalker";
import { Schema } from "@bentley/ecschema-metadata";

use(chaiAsPromised);

describe("SchemaValidater Tests", () => {
  let assetsDir: string;
  let outDir: string;
  let refDir: string;

  beforeEach(() => {
    assetsDir = utils.getAssetsDir();
    outDir = utils.getOutDir();
    refDir = utils.getReferencesDir();
  });

  afterEach(async () => {
    sinon.restore();
    await fs.remove(outDir);
  });

  it("schemaPath is a directory, validateFile called multiple times.", async () => {
    const options = new ValidationOptions(assetsDir, [], true, outDir);
    const stub = sinon.stub(SchemaValidator, "validateFile").callThrough();

    await SchemaValidator.validate(options);

    const expectedCount = 12;
    expect(stub.callCount).to.equal(expectedCount, `Expected ${expectedCount} calls to validateFile`);
  });

  it("Error traversing schema, results contains expected entries.", async () => {
    sinon.stub(SchemaWalker.prototype, "traverseSchema").throws(new Error("Test Error"));
    const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.xml");
    const options = new ValidationOptions(schemaFile, [], false);

    const results = await SchemaValidator.validate(options);

    expect(results[1].resultText).to.equal(` An error occurred validating the schema SchemaWithViolations.01.00.00: Test Error`);
  });

  it("Standard schema specified, error reported correctly.", async () => {
    const fileStats = new fs.Stats();
    sinon.stub(fileStats, "isFile").returns(true);
    sinon.stub(fs, "lstat").resolves(fileStats);
    for (const schema of standardSchemaNames) {
      const schemaFile = path.resolve(assetsDir, schema);
      const options = new ValidationOptions(schemaFile, [], true, outDir);
      const result = await SchemaValidator.validate(options);
      expect(result[1].resultText).to.equal(" Standard schemas are not supported by this tool.");
    }
  });

  it("Schema has standard schema reference, standard schema not validated.", async () => {
    const traverseSchema = sinon.stub(SchemaWalker.prototype, "traverseSchema");
    const validateSchema = sinon.stub(SchemaValidator, "validateLoadedSchema").callThrough();
    const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.json");
    const options = new ValidationOptions(schemaFile, [refDir], true);
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
      const options = new ValidationOptions(schemaFile, [], false);

      const result = await SchemaValidator.validate(options);

      expect(result[1].resultText).to.contain("Error BIS-100");
      expect(result[2].resultText).to.contain("Error BIS-600");
    });

    it("XML Schema has failing rules, validateAll option is false, diagnostics written to file correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.xml");
      const options = new ValidationOptions(schemaFile, [], false, outDir);

      await SchemaValidator.validate(options);

      const baseOutputFile = path.resolve(outDir, "BaseSchema.results.xml");
      const expectedOutFile = path.resolve(assetsDir, "SchemaWithViolations.validation.log");
      const actualOutFile = path.resolve(outDir, "SchemaWithViolations.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));
      expect(fs.existsSync(baseOutputFile), "BaseSchema results should not have been created").to.be.false;
    });

    it("XML Schema has failing rules, validateAll option is true, diagnostics written to two result files correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.xml");
      const options = new ValidationOptions(schemaFile, [], true, outDir);

      await SchemaValidator.validate(options);

      let expectedOutFile = path.resolve(assetsDir, "SchemaWithViolations.validation.log");
      let actualOutFile = path.resolve(outDir, "SchemaWithViolations.validation.log");
      let expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      let actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));

      expectedOutFile = path.resolve(assetsDir, "BaseSchema.validation.log");
      actualOutFile = path.resolve(outDir, "BaseSchema.validation.log");
      expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));
    });

    it("XML Schema has no failing rules, output written to file correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
      const options = new ValidationOptions(schemaFile, [refDir], false, outDir);

      await SchemaValidator.validate(options);

      const expectedOutFile = path.resolve(assetsDir, "SchemaA.validation.log");
      const actualOutFile = path.resolve(outDir, "SchemaA.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");

      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));
    });

    it("out path does not exist, throws", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.xml");
      const badPath = path.resolve(assetsDir, "DoesNotExist");
      const options = new ValidationOptions(schemaFile, [], false, badPath);

      await expect(SchemaValidator.validate(options)).to.be.rejectedWith(Error, `The out directory ${badPath + path.sep} does not exist.`);
    });

    it("XML Schema violates Schema Reference Alias rule, output written to file correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "BadSchemaRefAlias.ecschema.xml");
      const options = new ValidationOptions(schemaFile, [refDir], false, outDir);

      await SchemaValidator.validate(options);

      const expectedOutFile = path.resolve(assetsDir, "BadSchemaRefAlias.validation.log");
      const actualOutFile = path.resolve(outDir, "BadSchemaRefAlias.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));
    });

    it("XML Schema Reference Alias not defined, schema reference rule throws, output written to file correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "NoSchemaRefAlias.ecschema.xml");
      const options = new ValidationOptions(schemaFile, [refDir], false, outDir);

      await SchemaValidator.validate(options);

      const expectedOutFile = path.resolve(assetsDir, "NoSchemaRefAlias.validation.log");
      const actualOutFile = path.resolve(outDir, "NoSchemaRefAlias.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));
    });
  });

  describe("ECJson Schema Tests", () => {
    it("JSON Schema has failing rules, diagnostics reported correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.json");
      const options = new ValidationOptions(schemaFile, [refDir], false);
      const result = await SchemaValidator.validate(options);

      expect(result[1].resultText).to.contain("Error BIS-100");
      expect(result[2].resultText).to.contain("Error BIS-600");
    });

    it("JSON Schema has failing rules, diagnostics written to file correctly.", async () => {
      const schemaFile = path.resolve(assetsDir, "SchemaWithViolations.ecschema.json");
      const options = new ValidationOptions(schemaFile, [refDir], false, outDir);

      await SchemaValidator.validate(options);

      const expectedOutFile = path.resolve(assetsDir, "SchemaWithViolations.validation.log");
      const actualOutFile = path.resolve(outDir, "SchemaWithViolations.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));
    });
  });
});
