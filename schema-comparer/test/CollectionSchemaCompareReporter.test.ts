/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import { CollectionSchemaCompareReporter } from "../src/CollectionSchemaCompareReporter";
import { SchemaCompareDiagnostics, SchemaChanges, Schema, SchemaContext } from "@bentley/ecschema-metadata/lib/ecschema-metadata";

describe("CollectionSchemaCompareReporter Tests", () => {
  it("report diagnostic, diagnostic added correctly.", async () => {
    const schemaA = new Schema(new SchemaContext(), "TestSchema", 1, 0, 0);
    const schemaB = new Schema(new SchemaContext(), "TestSchema", 1, 0, 0);
    const reporter = new CollectionSchemaCompareReporter(schemaA, schemaB);
    const diag = new SchemaCompareDiagnostics.SchemaDelta(schemaA, ["label", "LabelA", "LabelB"]);
    const schemaChanges = new SchemaChanges(schemaA);
    schemaChanges.addDiagnostic(diag);

    reporter.report(schemaChanges);

    expect(reporter.changeMessages.length).to.equal(2);
    expect(reporter.changeMessages[0]).to.equal(`!Schema(TestSchema)`);
    expect(reporter.changeMessages[1]).to.equal(`!\tLabel: LabelA -> LabelB`);
  });
});
