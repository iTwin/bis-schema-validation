/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs-extra";
import * as path from "path";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";

import * as utils from "./utilities/utils";
import { SchemaComparison, CompareOptions, ComparisonResultType } from "../src/SchemaComparison";
import { Schema, SchemaComparer } from "@bentley/ecschema-metadata";
import { SchemaDeserializer } from "../src/SchemaDeserializer";

use(chaiAsPromised);

describe("SchemaValidater Tests", () => {
  const outDir = utils.getOutDir();
  const assetsDir = utils.getAssetsDir();
  const referencesDir = utils.getReferencesDir();

  beforeEach(async () => {
    await fs.remove(outDir + "SchemaA.compare.log");
  });

  afterEach(async () => {
    sinon.restore();
  });

  it("Compare two schema files, compareLoadedSchemas called correctly", async () => {
    const compareSpy = sinon.spy(SchemaComparison, "compareLoadedSchemas");
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    await SchemaComparison.compare(options);

    expect(compareSpy.calledOnce).to.be.true;
    expect(compareSpy.args[0][0]).to.not.be.undefined;
    expect(compareSpy.args[0][1]).to.not.be.undefined;
    const schemaA = compareSpy.args[0][0] as Schema;
    const schemaB = compareSpy.args[0][1] as Schema;
    expect(schemaA.fullName).to.equal("SchemaA");
    expect(schemaB.fullName).to.equal("SchemaB");
  });

  it("Compare two schema files, out directory specified, result file created correctly", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], outDir);

    await SchemaComparison.compare(options);

    const expectedOutFile = path.resolve(assetsDir, "NoChanges.compare.log");
    const actualOutFile = path.resolve(outDir, "SchemaA.compare.log");
    const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
    const actualOutText = fs.readFileSync(actualOutFile, "utf8");
    expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));;
  });

  it("Compare using compareToNativeDeserialization option, compareLoadedSchemas called correctly", async () => {
    const compareSpy = sinon.spy(SchemaComparison, "compareLoadedSchemas");
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, undefined, [referencesDir], undefined, true);

    await SchemaComparison.compare(options);

    expect(compareSpy.calledOnce).to.be.true;
    expect(compareSpy.args[0][0]).to.not.be.undefined;
    expect(compareSpy.args[0][1]).to.not.be.undefined;
    const schemaA = compareSpy.args[0][0] as Schema;
    const schemaB = compareSpy.args[0][1] as Schema;
    expect(schemaA.fullName).to.equal("SchemaA");
    expect(schemaB.fullName).to.equal("SchemaA");
  });

  it("Compare using compareToNativeDeserialization option, schema B path specified, schema B path ignored.", async () => {
    const compareSpy = sinon.spy(SchemaComparison, "compareLoadedSchemas");
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], undefined, true);

    await SchemaComparison.compare(options);

    expect(compareSpy.calledOnce).to.be.true;
    expect(compareSpy.args[0][0]).to.not.be.undefined;
    expect(compareSpy.args[0][1]).to.not.be.undefined;
    const schemaA = compareSpy.args[0][0] as Schema;
    const schemaB = compareSpy.args[0][1] as Schema;
    expect(schemaA.fullName).to.equal("SchemaA");
    expect(schemaB.fullName).to.equal("SchemaA");
  });

  it("Compare, schema A is invalid, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "BadSchema.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal("An error occurred retrieving schema 'BadSchema.01.01.01': The Schema BadSchema has an unsupported namespace 'http://www.bentley.com/schemas/Bentley.ECXML.3.1'.");
  });

  it("Compare, bad schema A path, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "DoesNotExist.ecschema.xml");
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema A path '${options.SchemaAPath} is not a valid path to a schema file.`);
  });

  it("Compare, schema A path not to a file, results contain error", async () => {
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(assetsDir, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema A path '${assetsDir} is not a valid path to a schema file.`);
  });

  it("Compare, schema A path not to a schema file, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "TestSchema.compare.log");
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema A path '${options.SchemaAPath} is not a valid path to a schema file.`);
  });

  it("Compare, schema B is invalid, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "BadSchema.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal("An error occurred retrieving schema 'BadSchema.01.01.01': The Schema BadSchema has an unsupported namespace 'http://www.bentley.com/schemas/Bentley.ECXML.3.1'.");
  });

  it("Compare, bad schema B path, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(referencesDir, "DoesNotExist.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema B path '${options.SchemaBPath} is not a valid path to a schema file.`);
  });

  it("Compare, schema B path not to a file, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, assetsDir, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema B path '${assetsDir} is not a valid path to a schema file.`);
  });

  it("Compare, schema B path not to a schema file, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "TestSchema.compare.log");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema B path '${options.SchemaBPath} is not a valid path to a schema file.`);
  });

  it("CompareLoadedSchema, no differences found, results are correct", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Message);
    expect(results[1].resultText).to.equal(" Schema Comparison Succeeded. No differences found.");
  });

  it("CompareLoadedSchema, error during comparison, results contain error", async () => {
    sinon.stub(SchemaComparer.prototype, "compareSchemas").throws(new Error("Some Error"));
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` An error occurred comparing the schema SchemaA: Some Error`);
  });

  it("CompareLoadedSchema, error during native deserialization, results contain error", async () => {
    sinon.stub(SchemaDeserializer.prototype, "deserializeXmlFile").throws(new Error("Some Error"));
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], undefined, true);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` An error occurred de-serializing the schema ${schemaAFile}: Some Error`);
  });

  it("CompareLoadedSchema, using native deserialization, second schema fails to load, results contain error", async () => {
    sinon.stub(fs, "readFileSync").throws(new Error("Some error"));
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], undefined, true);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` An error occurred reading the schema XML file ${schemaAFile}: Some error`);
  });

  it("CompareLoadedSchema, error during XML file read, results contain error", async () => {
    sinon.stub(fs, "readFileSync").throws(new Error("Some error"));
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` An error occurred reading the schema XML file ${schemaAFile}: Some error`);
  });

  it("CompareLoadedSchema, schema file has missing ECSchema tag, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(fs, "readFileSync").withArgs(schemaAFile, "utf-8").returns("Bad Schema text");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` Could not find '<ECSchema>' tag in the file '${schemaAFile}'`);
  });

  it("CompareLoadedSchema, schema file has missing schema name, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(fs, "readFileSync").withArgs(schemaAFile, "utf-8").returns(`<ECSchema version="01.01.01" />`);
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` Could not find the ECSchema 'schemaName' tag in the file '${schemaAFile}'`);
  });

  it("CompareLoadedSchema, schema file has missing schema version, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(fs, "readFileSync").withArgs(schemaAFile, "utf-8").returns(`<ECSchema schemaName="SchemaA" />`);
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` Could not find the ECSchema 'version' tag in the file '${schemaAFile}'`);
  });
});
