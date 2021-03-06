/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as Rules from "../BisRules";
import { ECClass, EntityClass, PrimitiveType, Schema, SchemaContext } from "@itwin/ecschema-metadata";
import { MutableClass } from "@itwin/ecschema-metadata/lib/cjs/Metadata/Class";
import { MutableSchema } from "@itwin/ecschema-metadata/lib/cjs/Metadata/Schema";
import { DiagnosticCategory, DiagnosticType } from "@itwin/ecschema-editing";
import { CustomAttribute } from "@itwin/ecschema-metadata/lib/cjs/Metadata/CustomAttribute";

describe("Property Rule Tests", () => {
  let schema: Schema;
  let testClass: EntityClass;

  beforeEach(async () => {
    schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    const mutable = schema as MutableSchema;
    testClass = await mutable.createEntityClass("TestClass");
  });

  describe("PropertyShouldNotBeOfTypeLong tests", () => {
    it("Property of type Long, rule violated.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.Long);

      const result = Rules.propertyShouldNotBeOfTypeLong(property);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(property);
        expect(diagnostic!.messageArgs).to.eql([testClass.fullName, property.name]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.PropertyShouldNotBeOfTypeLong);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.Property);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Property not of type Long, rule passes.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);

      const result = Rules.propertyShouldNotBeOfTypeLong(property);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("PropertyHasInvalidExtendedType tests", () => {
    it("Property has invalid extendedType, rule violated.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.Long);
      /* eslint-disable-next-line  @typescript-eslint/dot-notation */
      property!["_extendedTypeName"] = "UnsupportedTypeName";

      const result = Rules.propertyHasInvalidExtendedType(property);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(property);
        expect(diagnostic!.messageArgs).to.eql([testClass.fullName, property.name, "UnsupportedTypeName"]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.PropertyHasInvalidExtendedType);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.Property);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Property has BeGuid extendedType, rule passes.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      /* eslint-disable-next-line  @typescript-eslint/dot-notation */
      property!["_extendedTypeName"] = "BeGuid";

      const result = Rules.propertyHasInvalidExtendedType(property);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Property has GeometryStream extendedType, rule passes.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      /* eslint-disable-next-line  @typescript-eslint/dot-notation */
      property!["_extendedTypeName"] = "GeometryStream";

      const result = Rules.propertyHasInvalidExtendedType(property);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Property has Json extendedType, rule passes.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      /* eslint-disable-next-line  @typescript-eslint/dot-notation */
      property!["_extendedTypeName"] = "Json";

      const result = Rules.propertyHasInvalidExtendedType(property);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Property has URI extendedType, rule passes.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      /* eslint-disable-next-line  @typescript-eslint/dot-notation */
      property!["_extendedTypeName"] = "URI";

      const result = Rules.propertyHasInvalidExtendedType(property);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("PropertyMustNotUseCustomHandledPropertyRestriction tests", () => {
    it("Property has bis:CustomHandledProperty, class missing bis:ClassHasHandler, rule fails.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      const propertyCAMap = new Map<string, CustomAttribute>();
      propertyCAMap.set("CustomHandledProperty", { className: "CustomHandledProperty" });
      /* eslint-disable-next-line  @typescript-eslint/dot-notation */
      property!["_customAttributes"] = propertyCAMap;

      const result = Rules.propertyMustNotUseCustomHandledPropertyRestriction(property);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(property);
        expect(diagnostic!.messageArgs).to.eql([testClass.fullName, property.name]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.PropertyMustNotUseCustomHandledPropertyRestriction);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.Property);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Property has bis:CustomHandledProperty, class has bis:ClassHasHandler, rule fails.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      const propertyCAMap = new Map<string, CustomAttribute>();
      propertyCAMap.set("CustomHandledProperty", { className: "CustomHandledProperty" });
      const classCAMap = new Map<string, CustomAttribute>();
      classCAMap.set("ClassHasHandler", { className: "ClassHasHandler" });
      /* eslint-disable-next-line  @typescript-eslint/dot-notation */
      property!["_customAttributes"] = propertyCAMap;
      /* eslint-disable-next-line  @typescript-eslint/dot-notation */
      testClass!["_customAttributes"] = classCAMap;

      const result = Rules.propertyMustNotUseCustomHandledPropertyRestriction(property);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Property does not have bis:CustomHandledProperty, rule passes.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      const propertyCAMap = new Map<string, CustomAttribute>();
      propertyCAMap.set("TestAttribute", { className: "TestAttribute" });
      /* eslint-disable-next-line  @typescript-eslint/dot-notation */
      property!["_customAttributes"] = propertyCAMap;

      const result = Rules.propertyMustNotUseCustomHandledPropertyRestriction(property);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Property has no CustomAttributes, rule passes.", async () => {
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);

      const result = Rules.propertyMustNotUseCustomHandledPropertyRestriction(property);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });
});
