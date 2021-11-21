/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import { CollectionSchemaCompareReporter } from "../CollectionSchemaCompareReporter";
import { Schema, SchemaContext } from "@itwin/ecschema-metadata/lib/ecschema-metadata";
import { SchemaChanges, SchemaCompareCodes, SchemaCompareDiagnostics } from "@itwin/ecschema-editing";

describe("CollectionSchemaCompareReporter Tests", () => {
  it("report diagnostic, diagnostic added correctly.", async () => {
    const schemaA = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const schemaB = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const reporter = new CollectionSchemaCompareReporter(schemaA, schemaB);
    const diag = new SchemaCompareDiagnostics.SchemaDelta(schemaA, ["label", "LabelA", "LabelB"]);
    const schemaChanges = new SchemaChanges(schemaA);
    schemaChanges.addDiagnostic(diag);

    reporter.report(schemaChanges);

    expect(reporter.changeMessages.length).to.equal(2);
    expect(reporter.changeMessages[0].message).to.equal(`!Schema(TestSchema)`);
    expect(reporter.changeMessages[0].change).to.be.undefined;
    expect(reporter.changeMessages[1].message).to.equal(`!\tLabel: LabelA -> LabelB`);
    const change = reporter.changeMessages[1].change;
    expect(change).to.not.be.undefined;
    expect(change!.diagnostic.code).to.equal(SchemaCompareCodes.SchemaDelta);
  });
});
