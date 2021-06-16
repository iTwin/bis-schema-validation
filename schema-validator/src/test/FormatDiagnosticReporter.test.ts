/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as sinon from "sinon";
import * as ECRules from "@bentley/ecschema-metadata/lib/Validation/ECRules";
import * as EC from "@bentley/ecschema-metadata/lib/ecschema-metadata";
import { ValidationDiagnosticReporter } from "../ValidationDiagnosticReporter";
import { diagnosticCategoryToString } from "@bentley/ecschema-metadata/lib/Validation/Diagnostic";

class TestReporter extends ValidationDiagnosticReporter {
  public reportFormattedDiagnostic(_message: string): void {
  }
}

describe("ValidationDiagnosticReporter Tests", () => {

  function formatStringFromArgs(text: string, args: ArrayLike<string>, baseIndex = 0): string {
    return text.replace(/{(\d+)}/g, (_match, index: string) => args[+index + baseIndex]);
  }

  it("report diagnostic, diagnostic formatted correctly.", async () => {
    const baseSpy = sinon.spy(TestReporter.prototype, "reportDiagnostic");
    const formatSpy = sinon.spy(TestReporter.prototype, "reportFormattedDiagnostic");
    const reporter = new TestReporter();
    const schema = new EC.Schema(new EC.SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const baseClass = new EC.EntityClass(schema, "BaseClass");
    const testClass = new EC.EntityClass(schema, "TestClass");

    const diagnostic = new ECRules.Diagnostics.BaseClassIsSealed(testClass, [testClass.fullName, baseClass.fullName]);
    reporter.report(diagnostic);

    const category = diagnosticCategoryToString(diagnostic.category);
    const message = baseSpy.args[0][1];
    const args = [category, diagnostic.code, message];

    const formattedMsg = formatStringFromArgs(ValidationDiagnosticReporter.diagnosticMessageTemplate, args);
    expect(formatSpy.calledOnceWithExactly(formattedMsg)).to.be.true;
  });
});
