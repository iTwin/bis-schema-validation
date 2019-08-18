/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as Rules from "../../bis-rules/src/BisRules";
import { MutableClass } from "@bentley/ecschema-metadata/lib/Metadata/Class";
import { MutableSchema } from "@bentley/ecschema-metadata/lib/Metadata/Schema";
import { DelayedPromiseWithProps, SchemaContext, Schema, EntityClass, PrimitiveType, ECClass, PropertyCategory, LazyLoadedSchemaItem, AnyClass } from "@bentley/ecschema-metadata";
import { DiagnosticCategory, DiagnosticType } from "@bentley/ecschema-metadata/lib/Validation/Diagnostic";
import { BisTestHelper } from "./utils/BisTestHelper";

describe("Class Rule Tests", () => {
  let schema: Schema;
  let testClass: EntityClass;

  beforeEach(async () => {
    schema = new Schema(new SchemaContext(), "TestSchema", 1, 0, 0);
    const mutable = schema as MutableSchema;
    testClass = await mutable.createEntityClass("TestClass");
  });

  describe("MultiplePropertiesInClassWithSameLabel tests", () => {
    it("Two properties with same label, undefined category, rule fails.", async () => {
      await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      const prop1 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty1", PrimitiveType.String);
      const prop2 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty2", PrimitiveType.String);
      // tslint:disable-next-line:no-string-literal
      prop1!["_label"] = "TestLabel";
      // tslint:disable-next-line:no-string-literal
      prop2!["_label"] = "TestLabel";

      const result = await Rules.multiplePropertiesInClassWithSameLabel(testClass);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal((testClass));
        expect(diagnostic!.messageArgs).to.eql([testClass.fullName, "TestProperty1", "TestProperty2", "TestLabel"]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.MultiplePropertiesInClassWithSameLabel);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Two properties with same label, same category, rule fails.", async () => {
      await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      const prop1 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty1", PrimitiveType.String);
      const prop2 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty2", PrimitiveType.String);
      const category = new PropertyCategory(schema, "TestCategory");
      // tslint:disable-next-line:no-string-literal
      prop1!["_label"] = "TestLabel";
      // tslint:disable-next-line:no-string-literal
      prop2!["_label"] = "TestLabel";
      // tslint:disable-next-line:no-string-literal
      prop1!["_category"] = new DelayedPromiseWithProps(category.key, async () => category) as LazyLoadedSchemaItem<PropertyCategory>;
      // tslint:disable-next-line:no-string-literal
      prop2!["_category"] = new DelayedPromiseWithProps(category.key, async () => category) as LazyLoadedSchemaItem<PropertyCategory>;

      const result = await Rules.multiplePropertiesInClassWithSameLabel(testClass);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal((testClass));
        expect(diagnostic!.messageArgs).to.eql([testClass.fullName, "TestProperty1", "TestProperty2", "TestLabel"]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.MultiplePropertiesInClassWithSameLabel);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Two properties with same label, different category, rule passes.", async () => {
      await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      const prop1 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty1", PrimitiveType.String);
      const prop2 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty2", PrimitiveType.String);
      const category1 = new PropertyCategory(schema, "TestCategory1");
      const category2 = new PropertyCategory(schema, "TestCategory2");

      // tslint:disable-next-line:no-string-literal
      prop1!["_label"] = "TestLabel";
      // tslint:disable-next-line:no-string-literal
      prop2!["_label"] = "TestLabel";
      // tslint:disable-next-line:no-string-literal
      prop1!["_category"] = new DelayedPromiseWithProps(category1.key, async () => category1) as LazyLoadedSchemaItem<PropertyCategory>;
      // tslint:disable-next-line:no-string-literal
      prop2!["_category"] = new DelayedPromiseWithProps(category2.key, async () => category2) as LazyLoadedSchemaItem<PropertyCategory>;

      const result = await Rules.multiplePropertiesInClassWithSameLabel(testClass);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Two properties with different labels, same category, rule passes.", async () => {
      await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      const prop1 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty1", PrimitiveType.String);
      const prop2 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty2", PrimitiveType.String);
      const category = new PropertyCategory(schema, "TestCategory");
      // tslint:disable-next-line:no-string-literal
      prop1!["_label"] = "TestLabel1";
      // tslint:disable-next-line:no-string-literal
      prop2!["_label"] = "TestLabel2";
      // tslint:disable-next-line:no-string-literal
      prop1!["_category"] = new DelayedPromiseWithProps(category.key, async () => category) as LazyLoadedSchemaItem<PropertyCategory>;
      // tslint:disable-next-line:no-string-literal
      prop2!["_category"] = new DelayedPromiseWithProps(category.key, async () => category) as LazyLoadedSchemaItem<PropertyCategory>;

      const result = await Rules.multiplePropertiesInClassWithSameLabel(testClass);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("ClassHasHandlerCACannotAppliedOutsideBisCoreGenericFunctional", () => {
    async function ClassHasHandlerRuleTest(schemaName: string, schemaAlias: string, schemaContext: SchemaContext, testValidation: (result: any, testEntity: AnyClass) => Promise<void>) {
      const schemaJson = {
        $schema: "https://dev.bentley.com/json_schemas/ec/32/ecschema",
        name: schemaName,
        alias: schemaAlias,
        version: "01.00.01",
        description: "This is a test schema",
        references: [
          {
            name: "BisCore",
            version: "01.00.01",
          },
        ],
        items: {
          ClassHasHandler: {
            appliesTo: "Any",
            description: "Applied to an ECClass to indicate that a C++ subclass of DgnDomain::Handler will supply behavior for it at run-time. This custom attribute may only be used by BisCore or other core schemas.",
            modifier: "sealed",
            schemaItemType: "CustomAttributeClass"
          },

          TestEntity: {
            modifier: "none",
            schemaItemType: "EntityClass",
            customAttributes: [
              { className: "BisCore.ClassHasHandler" }
            ],
            properties: [
              {
                name: "IntProps",
                type: "PrimitiveProperty",
                typeName: "int"
              }
            ]
          },
        },
      };
      const schema = await Schema.fromJson(schemaJson, schemaContext);

      const testEntity = await schema.getItem<AnyClass>("TestEntity");
      expect(testEntity !== undefined, "TestEntity should be within TestSchema").to.be.true;
      expect(testEntity!.schema.name === schemaName, "TestEntity should be within TestSchema").to.be.true;
      expect(testEntity!.customAttributes!.has("BisCore.ClassHasHandler"), "TestEntity should be within TestSchema").to.be.true;

      const result = await Rules.classHasHandlerCACannotAppliedOutsideCoreSchemas(testEntity!);
      await testValidation(result, testEntity!);
    };

    it("ClassHasHandler used inside BisCore, Generic, Functional Schema, Rule Passed", async () => {
      const testValidation = async (result: any, _testEntity: AnyClass) => {
        for await (const _diagnostic of result!) {
          expect(false, "Rule should pass").to.be.true;
        }
      }

      // BisCore test
      ClassHasHandlerRuleTest("BisCore", "bis", new SchemaContext(), testValidation);

      // Generic test
      ClassHasHandlerRuleTest("Generic", "generic", await BisTestHelper.getNewContext(), testValidation);

      // Functional test
      ClassHasHandlerRuleTest("Functional", "func", await BisTestHelper.getNewContext(), testValidation);
    });

    it("ClassHasHandler used outside of BisCore, Generic, Functional Schema, Rule Violated", async () => {
      const testValidation = async (result: any, testEntity: AnyClass) => {
        let resultHasEntries = false;
        for await (const diagnostic of result!) {
          resultHasEntries = true;
          expect(diagnostic).to.not.be.undefined;
          expect(diagnostic!.ecDefinition).to.equal(testEntity!);
          expect(diagnostic!.messageArgs).to.eql([testEntity!.fullName, testEntity!.schema.name]);
          expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
          expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.ClassHasHandlerCACannotAppliedOutsideCoreSchemas);
          expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
        }
        expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
      }

      ClassHasHandlerRuleTest("TestSchema", "ts", await BisTestHelper.getNewContext(), testValidation);
    });
  });
});
