/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as path from "path";
import * as fs from "fs-extra";
import * as utils from "./utilities/utils";
import * as ECRules from "@bentley/ecschema-metadata/lib/Validation/ECRules";
import * as EC from "@bentley/ecschema-metadata/lib/ecschema-metadata";
import { FileDiagnosticReporter } from "../src/FileDiagnosticReporter";

describe("FileDiagnosticReporter Tests", () => {
  const outDir = utils.getOutDir();
  const assetsDir = utils.getAssetsDir();

  beforeEach(async () => {
    fs.removeSync(path.resolve(outDir, "SchemaWithViolations.validation.log"));
    fs.removeSync(path.resolve(outDir, "BaseClassIsSealed.validation.log"));
    fs.removeSync(path.resolve(outDir, "NoErrors.validation.log"));
  });

  it("report diagnostic, diagnostic written to file correctly.", (done) => {
    const reporter = new FileDiagnosticReporter("BaseClassIsSealed", outDir);
    const schema = new EC.Schema(new EC.SchemaContext(), "BaseClassIsSealed", 1, 0, 0);
    const baseClass = new EC.EntityClass(schema, "BaseClass");
    const testClass = new EC.EntityClass(schema, "TestClass");
    const diagnostic = new ECRules.Diagnostics.BaseClassIsSealed(testClass, [testClass.fullName, baseClass.fullName]);
    reporter.start("BaseClassIsSealed Validation Results");

    reporter.report(diagnostic);

    reporter.end(undefined, () => {
      const expectedOutFile = path.resolve(assetsDir, "BaseClassIsSealed.validation.log");
      const actualOutFile = path.resolve(outDir, "BaseClassIsSealed.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));;
      done();
    });
  });

  it("no diagnostics reported, output written to file correctly.", (done) => {
    const reporter = new FileDiagnosticReporter("NoErrors", outDir);
    reporter.start("SchemaWithViolations Validation Results");

    reporter.end(" Schema Validation Succeeded. No rule violations found.", () => {
      const expectedOutFile = path.resolve(assetsDir, "NoErrors.validation.log");
      const actualOutFile = path.resolve(outDir, "NoErrors.validation.log");
      const expectedOutText = fs.readFileSync(expectedOutFile, "utf8");
      const actualOutText = fs.readFileSync(actualOutFile, "utf8");
      expect(utils.normalizeLineEnds(actualOutText)).to.equal(utils.normalizeLineEnds(expectedOutText));;
      done();
    });
  });

  it("report diagnostic, failure with non-existent out directory.", () => {
    const badPath = path.resolve(assetsDir, "DoesNotExist");
    const reporter = new FileDiagnosticReporter("SchemaWithViolations", badPath);
    expect(() => reporter.start("Header")).to.throw(Error, `The out directory ${badPath + path.sep} does not exist.`);
  });

  it("calling report without calling start results in no error.", () => {
    const reporter = new FileDiagnosticReporter("TestSchema", outDir);
    const schema = new EC.Schema(new EC.SchemaContext(), "TestSchema", 1, 0, 0);
    const testClass = new EC.EntityClass(schema, "TestClass");
    const diagnostic = new ECRules.Diagnostics.BaseClassIsSealed(testClass, ["test", "test"]);

    expect(() => reporter.report(diagnostic)).to.not.throw();
  });

  it("calling end without calling start results in no error.", () => {
    const reporter = new FileDiagnosticReporter("TestSchema", outDir);
    expect(() => reporter.end()).to.not.throw();
  });
});
