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
import { Schema, SchemaComparer, SchemaMatchType } from "@bentley/ecschema-metadata";
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
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], []);

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
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], [referencesDir], outDir);

    await SchemaComparison.compare(options);

    const expectedOutFile = path.resolve(assetsDir, "NoChanges.compare.log");
    const actualOutFile = path.resolve(outDir, "SchemaA.compare.log");
    const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
    const actualOutText = fs.readFileSync(actualOutFile, "utf8");
    expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));
  });

  it("Compare, differences found, results reported correctly", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], [], outDir);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultText).to.equal(" -Schema(SchemaA)");
    expect(results[2].resultText).to.equal(" -\tSchemaKey: SchemaA.01.01.01 -> SchemaB.02.02.02");
    expect(results[3].resultText).to.equal(" -\tAlias: a -> b");
    expect(results[4].resultText).to.equal(" -\tLabel: SchemaA -> SchemaB");
    expect(results[5].resultText).to.equal(" -\tSchemaReferences");
    expect(results[6].resultText).to.equal(" -\t\tSchema(SchemaB)");
    expect(results[7].resultText).to.equal(" +Schema(SchemaB)");
    expect(results[8].resultText).to.equal(" +\tSchemaReferences");
    expect(results[9].resultText).to.equal(" +\t\tSchema(SchemaD)");
  });

  it("Compare, schema A reference exact version not found, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "RefVersionTest.ecschema.xml");
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.contain(`Could not locate the referenced schema, SchemaB.2.2.1, of RefVersionTest`);
  });

  it("Compare, schema B reference exact version not found, results contain error", async () => {
    const schemaAFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "RefVersionTest.ecschema.xml");

    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.contain(`Could not locate the referenced schema, SchemaB.2.2.1, of RefVersionTest`);
  });

  it("Compare, schema A reference with older minor version, ref match type LatestReadCompatible, latest read version found", async () => {
    const schemaAFile = path.resolve(assetsDir, "RefVersionTest.ecschema.xml");
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], [], undefined, SchemaMatchType.LatestReadCompatible);

    const results = await SchemaComparison.compare(options);

    expect(results.length).to.equal(11);
    expect(results[1].resultText).to.contain("-Schema(RefVersionTest)");
  });

  it("Compare, schema B reference with older minor version, ref match type LatestReadCompatible, latest read version found", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaB.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "RefVersionTest.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [], [referencesDir], undefined, SchemaMatchType.LatestReadCompatible);

    const results = await SchemaComparison.compare(options);

    expect(results.length).to.equal(9);
    expect(results[1].resultText).to.contain("-Schema(SchemaB)");
  });

  it("Compare, bad schema A path, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "DoesNotExist.ecschema.xml");
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema A path '${options.SchemaAPath} is not a valid path to a schema file.`);
  });

  it("Compare, schema A path not to a file, results contain error", async () => {
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(assetsDir, schemaBFile, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema A path '${assetsDir} is not a valid path to a schema file.`);
  });

  it("Compare, schema A path not to a schema file, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "TestSchema.compare.log");
    const schemaBFile = path.resolve(referencesDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema A path '${options.SchemaAPath} is not a valid path to a schema file.`);
  });

  it("Compare, bad schema B path, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(referencesDir, "DoesNotExist.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema B path '${options.SchemaBPath} is not a valid path to a schema file.`);
  });

  it("Compare, schema B path not to a file, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, assetsDir, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema B path '${assetsDir} is not a valid path to a schema file.`);
  });

  it("Compare, schema B path not to a schema file, results contain error", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "TestSchema.compare.log");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Error);
    expect(results[0].resultText).to.equal(`The schema B path '${options.SchemaBPath} is not a valid path to a schema file.`);
  });

  it("CompareLoadedSchema, no differences found, results are correct", async () => {
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], [referencesDir]);

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
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], [referencesDir]);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` An error occurred comparing the schema SchemaA: Some Error`);
  });

  it("CompareLoadedSchema, error Schema A deserialization, results contain error", async () => {
    sinon.stub(SchemaDeserializer.prototype, "deserializeXmlFile").onFirstCall().throws(new Error("Some Error"));
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` An error occurred de-serializing the schema ${schemaAFile}: Some Error`);
  });

  it("CompareLoadedSchema, error Schema B deserialization, results contain error", async () => {
    const deserializeXmlFile = sinon.stub(SchemaDeserializer.prototype, "deserializeXmlFile");
    deserializeXmlFile.onSecondCall().throws(new Error("Some Error"));
    deserializeXmlFile.callThrough();
    const schemaAFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(assetsDir, "SchemaB.ecschema.xml");
    const options = new CompareOptions(schemaAFile, schemaBFile, [referencesDir], []);

    const results = await SchemaComparison.compare(options);

    expect(results[0].resultType).to.equal(ComparisonResultType.Message);
    expect(results[0].resultText).to.equal("Schema Comparison Results");
    expect(results[1].resultType).to.equal(ComparisonResultType.Error);
    expect(results[1].resultText).to.equal(` An error occurred de-serializing the schema ${schemaBFile}: Some Error`);
  });
});
