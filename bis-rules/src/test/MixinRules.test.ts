/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as Rules from "../BisRules";
import { DelayedPromiseWithProps, ECClass, LazyLoadedSchemaItem, Mixin, PrimitiveType, Schema, SchemaContext } from "@itwin/ecschema-metadata";
import { MutableClass } from "@itwin/ecschema-metadata/lib/cjs/Metadata/Class";
import { DiagnosticCategory, DiagnosticType } from "@itwin/ecschema-editing";

describe("Mixin Rule Tests", () => {
  let schema: Schema;

  beforeEach(async () => {
    schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
  });

  describe("MixinsCannotOverrideInheritedProperties tests", () => {
    it("Property overridden in child class, rule violated.", async () => {
      const baseMixin = new Mixin(schema, "BaseMixin") as ECClass;
      await (baseMixin as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);

      const mixin = new Mixin(schema, "TestMixin") as ECClass;
      await (mixin as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.Integer);
      mixin.baseClass = new DelayedPromiseWithProps(baseMixin.key, async () => baseMixin) as LazyLoadedSchemaItem<Mixin>;

      const result = Rules.mixinsCannotOverrideInheritedProperties(mixin as Mixin);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(mixin);
        expect(diagnostic!.messageArgs).to.eql([mixin.fullName, "TestProperty"]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.MixinsCannotOverrideInheritedProperties);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Property overridden in grandchild class, rule violated.", async () => {
      const baseMixin = new Mixin(schema, "BaseMixin") as ECClass;
      await (baseMixin as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);

      const childMixin = new Mixin(schema, "ChildMixin") as ECClass;
      childMixin.baseClass = new DelayedPromiseWithProps(baseMixin.key, async () => baseMixin) as LazyLoadedSchemaItem<Mixin>;

      const grandChildMixin = new Mixin(schema, "GrandChildMixin") as ECClass;
      await (grandChildMixin as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.Integer);
      grandChildMixin.baseClass = new DelayedPromiseWithProps(childMixin.key, async () => childMixin) as LazyLoadedSchemaItem<Mixin>;

      const result = Rules.mixinsCannotOverrideInheritedProperties(grandChildMixin as Mixin);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(grandChildMixin);
        expect(diagnostic!.messageArgs).to.eql([grandChildMixin.fullName, "TestProperty"]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.MixinsCannotOverrideInheritedProperties);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("No base class, rule passes.", async () => {
      const mixin = new Mixin(schema, "TestMixin") as ECClass;

      const result = Rules.mixinsCannotOverrideInheritedProperties(mixin as Mixin);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Properties not overridden, rule passes.", async () => {
      const baseMixin = new Mixin(schema, "BaseMixin") as ECClass;
      await (baseMixin as MutableClass).createPrimitiveProperty("TestStringProperty", PrimitiveType.String);

      const mixin = new Mixin(schema, "TestMixin") as ECClass;
      await (mixin as MutableClass).createPrimitiveProperty("TestIntProperty", PrimitiveType.Integer);
      mixin.baseClass = new DelayedPromiseWithProps(baseMixin.key, async () => baseMixin) as LazyLoadedSchemaItem<Mixin>;

      const result = Rules.mixinsCannotOverrideInheritedProperties(mixin as Mixin);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });
});
