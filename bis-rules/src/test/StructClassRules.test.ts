/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as Rules from "../BisRules";
import { MutableClass } from "@itwin/ecschema-metadata/lib/cjs/Metadata/Class";
import { DelayedPromiseWithProps, ECClass, LazyLoadedSchemaItem, Schema, SchemaContext, StructClass } from "@itwin/ecschema-metadata";
import { DiagnosticCategory, DiagnosticType } from "@itwin/ecschema-editing";

describe("StructClass Rule Tests", () => {
  let schema: Schema;

  beforeEach(async () => {
    schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
  });

  describe("StructsCannotHaveBaseClasses tests", () => {
    it("Struct has base class, rule violated.", async () => {
      const baseStruct = new StructClass(schema, "BaseStruct");
      const struct = new StructClass(schema, "TestStruct");
      await (struct as ECClass as MutableClass).setBaseClass(new DelayedPromiseWithProps(baseStruct.key, async () => baseStruct) as LazyLoadedSchemaItem<ECClass>);

      const result = Rules.structsCannotHaveBaseClasses(struct);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(struct);
        expect(diagnostic!.messageArgs).to.eql([struct.fullName]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.StructsCannotHaveBaseClasses);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Struct has no base class, rule passes.", async () => {
      const struct = new StructClass(schema, "TestStruct");

      const result = Rules.structsCannotHaveBaseClasses(struct);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });
});
