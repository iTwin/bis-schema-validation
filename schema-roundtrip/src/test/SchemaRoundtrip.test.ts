/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { expect, use } from "chai";
import * as fs from "fs-extra";
import * as sinon from "sinon";
import * as path from "path";
import * as utils from "./utilities/utils";
import * as chaiAsPromised from "chai-as-promised";
import { XMLSerializer } from "@xmldom/xmldom";
import { RoundTripOptions, RoundTripResultType, SchemaRoundTrip } from "../SchemaRoundTrip";
import { Schema } from "@itwin/ecschema-metadata";
import { ComparisonResultType, SchemaComparison } from "@bentley/schema-comparer";

use(chaiAsPromised);

describe("SchemaRoundTrip Tests", () => {
  const outDir = utils.getOutDir();
  const assetsDir = utils.getAssetsDir();
  const referencesDir = utils.getReferencesDir();

  beforeEach(async () => {
    await fs.remove(outDir + "SchemaA.validation.log");
  });

  afterEach(async () => {
    sinon.restore();
  });

  it("schema round trip succeeds, output file created correctly", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    const outFile = path.resolve(outDir, "SchemaA.ecschema.xml");
    const outText = fs.readFileSync(outFile, "utf8");
    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Message);
    expect(results[1].resultText).to.equal(`Schema re-serialized successfully to ${path.resolve(options.outputDir, "SchemaA.ecschema.xml")}`);
    expect(outText).to.not.be.undefined;
  });

  it("schema round trip succeeds, with compare option, output file created correctly", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, true);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    const outFile = path.resolve(outDir, "SchemaA.ecschema.xml");
    const outText = fs.readFileSync(outFile, "utf8");
    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Message);
    expect(results[1].resultText).to.equal(`Schema re-serialized successfully to ${path.resolve(options.outputDir, "SchemaA.ecschema.xml")}`);
    expect(results[2].resultType).to.equal(RoundTripResultType.Message);
    expect(results[2].resultText).to.equal(" Schema Comparison Succeeded. No differences found.");
    expect(outText).to.not.be.undefined;
  });

  it("schema round trip succeeds, with compare option, schemas different, output file created correctly", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, true);
    sinon.stub(SchemaComparison, "compareLoadedSchemas").resolves([{ resultType: ComparisonResultType.Delta, resultText: "Difference" }]);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    const outFile = path.resolve(outDir, "SchemaA.ecschema.xml");
    const outText = fs.readFileSync(outFile, "utf8");
    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Message);
    expect(results[1].resultText).to.equal(`Schema re-serialized successfully to ${path.resolve(options.outputDir, "SchemaA.ecschema.xml")}`);
    expect(results[2].resultType).to.equal(RoundTripResultType.Delta);
    expect(results[2].resultText).to.equal("Difference");
    expect(outText).to.not.be.undefined;
  });

  it("schema round trip succeeds, with compare option, comparison error, output file created correctly", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, true);
    sinon.stub(SchemaComparison, "compareLoadedSchemas").resolves([{ resultType: ComparisonResultType.Error, resultText: "Some Error" }]);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    const outFile = path.resolve(outDir, "SchemaA.ecschema.xml");
    const outText = fs.readFileSync(outFile, "utf8");
    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Message);
    expect(results[1].resultText).to.equal(`Schema re-serialized successfully to ${path.resolve(options.outputDir, "SchemaA.ecschema.xml")}`);
    expect(results[2].resultType).to.equal(RoundTripResultType.Error);
    expect(results[2].resultText).to.equal("Some Error");
    expect(outText).to.not.be.undefined;
  });

  it("schema path is invalid, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "DoesNotExist.ecschema.xml");
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(`The schema path '${options.schemaPath}' is not a valid path to a schema file.`);
  });

  it("schema path is to a directory, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir);
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(`The schema path '${options.schemaPath}' is not a valid path to a schema file.`);
  });

  it("schema file fails to load, results contain error", async () => {
    sinon.stub(fs, "readFileSync").throws(new Error("Some error"));
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(` An error occurred reading the schema XML file '${schemaFile}': Some error`);
  });

  it("schema fails to de-serialize, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "BadSchema.ecschema.xml");
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(`An error occurred retrieving the schema 'BadSchema.01.01.01': The Schema 'BadSchema' has an unsupported ECVersion 4.0 and cannot be loaded.`);
  });

  it("serialization fails, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(Schema.prototype, "toXml").throws(new Error("Some Error"));
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(`An error occurred serializing schema 'SchemaA': Some Error`);
  });

  it("document fails to serialize to string, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(XMLSerializer.prototype, "serializeToString").throws(new Error("Some Error"));
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(`An error occurred writing xml file for schema 'SchemaA': Some Error`);
  });

  it("serialized schema fails during write to file, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(fs, "writeFile").rejects(new Error("Some Error"));
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(`An error occurred writing to file '${path.resolve(options.outputDir, "SchemaA.ecschema.xml")}': Some Error`);
  });

  it("get serialized schema path fails, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(fs, "pathExistsSync").returns(false);
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(`The out directory '${options.outputDir}\\' does not exist.`);
  });

  it("get serialized schema path fails on second call, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const stub = sinon.stub(fs, "pathExistsSync").onSecondCall().returns(false);
    stub.callThrough();
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, true);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Message);
    expect(results[1].resultText).to.equal(`Schema re-serialized successfully to ${path.resolve(options.outputDir, "SchemaA.ecschema.xml")}`);
    expect(results[2].resultType).to.equal(RoundTripResultType.Error);
    expect(results[2].resultText).to.equal(`The out directory '${options.outputDir}\\' does not exist.`);
  });

  it("read serialized schema fails on second call, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    const stub = sinon.stub(fs, "readFileSync").onSecondCall().throws(new Error("Some Error"));
    stub.callThrough();
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, true);
    const expectedPath = path.normalize(path.resolve(options.outputDir, "SchemaA.ecschema.xml"));

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Message);
    expect(results[1].resultText).to.equal(`Schema re-serialized successfully to ${path.resolve(options.outputDir, "SchemaA.ecschema.xml")}`);
    expect(results[2].resultType).to.equal(RoundTripResultType.Error);
    expect(results[2].resultText).to.equal(` An error occurred reading the schema XML file '${expectedPath}': Some Error`);
  });

  it("schema file has missing ECSchema tag, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(fs, "readFileSync").withArgs(schemaFile, "utf-8").returns("Bad Schema text");
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(` Could not find '<ECSchema>' tag in the file '${schemaFile}'`);
  });

  it("schema file has missing schema name, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(fs, "readFileSync").withArgs(schemaFile, "utf-8").returns(`<ECSchema version="01.01.01" />`);
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(` Could not find the ECSchema 'schemaName' tag in the file '${schemaFile}'`);
  });

  it("schema file has missing schema version, results contain error", async () => {
    const schemaFile = path.resolve(assetsDir, "SchemaA.ecschema.xml");
    sinon.stub(fs, "readFileSync").withArgs(schemaFile, "utf-8").returns(`<ECSchema schemaName="SchemaA" />`);
    const options = new RoundTripOptions(schemaFile, [referencesDir], outDir, false);

    const results = await SchemaRoundTrip.roundTripSchema(options);

    expect(results[0].resultType).to.equal(RoundTripResultType.Message);
    expect(results[0].resultText).to.equal("Schema Round Trip Results");
    expect(results[1].resultType).to.equal(RoundTripResultType.Error);
    expect(results[1].resultText).to.equal(` Could not find the ECSchema 'version' tag in the file '${schemaFile}'`);
  });
});
