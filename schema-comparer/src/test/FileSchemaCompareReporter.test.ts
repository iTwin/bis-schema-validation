/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as sinon from "sinon";
import * as path from "path";
import * as fs from "fs-extra";
import * as utils from "./utilities/utils";
import { FileSchemaCompareReporter } from "../FileSchemaCompareReporter";
import { Schema, SchemaContext } from "@bentley/ecschema-metadata/lib/ecschema-metadata";
import { SchemaChanges, SchemaCompareDiagnostics } from "@bentley/ecschema-editing";

describe("FileDiagnosticReporter Tests", () => {
  const outDir = utils.getOutDir();
  const assetsDir = utils.getAssetsDir();

  beforeEach(async () => {
    fs.removeSync(path.resolve(outDir, "TestSchema.compare.log"));
    fs.removeSync(path.resolve(outDir, "NoChanges.compare.log"));
  });

  it("report diagnostic, diagnostic written to file correctly.", (done) => {
    const schemaA = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const schemaB = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const reporter = new FileSchemaCompareReporter(schemaA, schemaB, outDir);
    const diag = new SchemaCompareDiagnostics.SchemaDelta(schemaA, ["label", "LabelA", "LabelB"]);
    const schemaChanges = new SchemaChanges(schemaA);
    schemaChanges.addDiagnostic(diag);
    reporter.start("Comparison Results");

    reporter.report(schemaChanges);

    reporter.end(undefined, () => {
      const expectedOutFile = path.resolve(assetsDir, "TestSchema.compare.log");
      const actualOutFile = path.resolve(outDir, "TestSchema.compare.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));
      done();
    });
  });

  it("no changes reported, output written to file correctly.", (done) => {
    const schemaA = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const schemaB = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const reporter = new FileSchemaCompareReporter(schemaA, schemaB, outDir);
    reporter.start("Comparison Results");

    reporter.end(" Schema Comparison Succeeded. No differences found.", () => {
      const expectedOutFile = path.resolve(assetsDir, "NoChanges.compare.log");
      const actualOutFile = path.resolve(outDir, "TestSchema.compare.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));
      done();
    });
  });

  it("report changes, failure with non-existent out directory.", () => {
    const badPath = path.resolve(assetsDir, "DoesNotExist");
    const schemaA = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const schemaB = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const reporter = new FileSchemaCompareReporter(schemaA, schemaB, badPath);
    expect(() => reporter.start("Header")).to.throw(Error, `The out directory ${badPath + path.sep} does not exist.`);
  });

  it("calling report without calling start results in no error.", () => {
    const schemaA = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const schemaB = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const reporter = new FileSchemaCompareReporter(schemaA, schemaB, outDir);
    const diag = new SchemaCompareDiagnostics.SchemaDelta(schemaA, ["label", "LabelA", "LabelB"]);
    const schemaChanges = new SchemaChanges(schemaA);
    schemaChanges.addDiagnostic(diag);

    expect(() => reporter.report(schemaChanges)).to.not.throw();
  });

  it("calling end without calling start results in no error.", () => {
    const schemaA = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const schemaB = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const reporter = new FileSchemaCompareReporter(schemaA, schemaB, outDir);
    expect(() => reporter.end()).to.not.throw();
  });

  it("WriteStream errors, report throws.", () => {
    sinon.stub(fs.WriteStream.prototype, "write").callsArgWith(1, new Error("Test Error"));
    const schemaA = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const schemaB = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const reporter = new FileSchemaCompareReporter(schemaA, schemaB, outDir);

    expect(() => reporter.start("test")).to.throw(Error, "Test Error");
  });
});
