/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as sinon from "sinon";
import * as ECRules from "@bentley/ecschema-metadata/lib/Validation/ECRules";
import * as EC from "@bentley/ecschema-metadata/lib/ecschema-metadata";
import { CollectionDiagnosticReporter } from "../source/CollectionDiagnosticReporter";
import { FormatDiagnosticReporter } from "../source/FormatDiagnosticReporter";
import { diagnosticCategoryToString, diagnosticTypeToString } from "@bentley/ecschema-metadata/lib/Validation/Diagnostic";

describe("CollectionDiagnosticReporter Tests", () => {

  function formatStringFromArgs(text: string, args: ArrayLike<string>, baseIndex = 0): string {
    return text.replace(/{(\d+)}/g, (_match, index: string) => args[+index + baseIndex]);
  }

  it("report diagnostic, diagnostic added correctly.", async () => {
    const reporter = new CollectionDiagnosticReporter();
    const baseSpy = sinon.spy(reporter, "reportDiagnostic");
    const schema = new EC.Schema(new EC.SchemaContext(), "TestSchema", 1, 0, 0);
    const baseClass = new EC.EntityClass(schema, "BaseClass");
    const testClass = new EC.EntityClass(schema, "TestClass");

    const diagnostic = new ECRules.Diagnostics.BaseClassIsSealed(testClass, [testClass.fullName, baseClass.fullName]);
    reporter.report(diagnostic);

    const category = diagnosticCategoryToString(diagnostic.category);
    const type = diagnosticTypeToString(diagnostic.diagnosticType);
    const message = baseSpy.args[0][1];
    const args = [diagnostic.code, message, category, type];
    const formattedMsg = formatStringFromArgs(FormatDiagnosticReporter.diagnosticMessageTemplate, args);

    expect(reporter.diagnostics.length).to.equal(1);
    expect(reporter.diagnostics[0]).to.equal(formattedMsg);
  });
});
