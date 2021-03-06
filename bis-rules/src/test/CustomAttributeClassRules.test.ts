/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as Rules from "../BisRules";
import { CustomAttributeClass, DelayedPromiseWithProps, LazyLoadedSchemaItem, Schema, SchemaContext } from "@itwin/ecschema-metadata";
import { DiagnosticCategory, DiagnosticType } from "@itwin/ecschema-editing";

describe("CustomAttributeClass Rule Tests", () => {
  let schema: Schema;

  beforeEach(async () => {
    schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
  });

  describe("CustomAttributeClassCannotHaveBaseClasses tests", () => {
    it("CustomAttributeClass has base class, rule violated.", async () => {
      const baseCA = new CustomAttributeClass(schema, "BaseStruct");
      const caClass = new CustomAttributeClass(schema, "TestStruct");
      caClass.baseClass = new DelayedPromiseWithProps(baseCA.key, async () => baseCA) as LazyLoadedSchemaItem<CustomAttributeClass>;

      const result = Rules.customAttributeClassCannotHaveBaseClasses(caClass);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(caClass);
        expect(diagnostic!.messageArgs).to.eql([caClass.fullName]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.CustomAttributeClassCannotHaveBaseClasses);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("CustomAttributeClass has no base class, rule passes.", async () => {
      const caClass = new CustomAttributeClass(schema, "TestStruct");

      const result = Rules.customAttributeClassCannotHaveBaseClasses(caClass);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });
});
