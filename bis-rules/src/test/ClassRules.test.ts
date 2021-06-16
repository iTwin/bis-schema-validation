/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as Rules from "../BisRules";
import { MutableClass } from "@bentley/ecschema-metadata/lib/Metadata/Class";
import { MutableProperty } from "@bentley/ecschema-metadata/lib/Metadata/Property";
import { MutableSchema } from "@bentley/ecschema-metadata/lib/Metadata/Schema";
import { MutableEntityClass } from "@bentley/ecschema-metadata/lib/Metadata/EntityClass";
import { AnyClass, DelayedPromiseWithProps, ECClass, EntityClass, LazyLoadedSchemaItem, Mixin, PrimitiveType, Property, PropertyCategory, RelationshipClass, Schema, SchemaContext } from "@bentley/ecschema-metadata";
import { DiagnosticCategory, DiagnosticType } from "@bentley/ecschema-metadata/lib/Validation/Diagnostic";
import { BisTestHelper } from "./utils/BisTestHelper";

describe("Class Rule Tests", () => {
  let schema: Schema;
  let testClass: EntityClass;

  beforeEach(async () => {
    schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
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

      const result = Rules.multiplePropertiesInClassWithSameLabel(testClass);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal((testClass));
        expect(diagnostic!.messageArgs).to.eql([testClass.fullName, "TestProperty1", "TestProperty2", "TestLabel"]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.MultiplePropertiesInClassWithSameLabel);
        expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);
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

      const result = Rules.multiplePropertiesInClassWithSameLabel(testClass);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal((testClass));
        expect(diagnostic!.messageArgs).to.eql([testClass.fullName, "TestProperty1", "TestProperty2", "TestLabel"]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.MultiplePropertiesInClassWithSameLabel);
        expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Two properties with same label, dynamic schema, rule passes.", async () => {
      (schema as MutableSchema).addCustomAttribute({ className: "CoreCustomAttributes.DynamicSchema" });
      await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.String);
      const prop1 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty1", PrimitiveType.String);
      const prop2 = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty2", PrimitiveType.String);
      // tslint:disable-next-line:no-string-literal
      prop1!["_label"] = "TestLabel";
      // tslint:disable-next-line:no-string-literal
      prop2!["_label"] = "TestLabel";

      const result = Rules.multiplePropertiesInClassWithSameLabel(testClass);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
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

      const result = Rules.multiplePropertiesInClassWithSameLabel(testClass);

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

      const result = Rules.multiplePropertiesInClassWithSameLabel(testClass);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("ClassHasHandlerCACannotAppliedOutsideBisCoreGenericFunctional", () => {
    async function ClassHasHandlerRuleTest(schemaName: string, schemaAlias: string, schemaContext: SchemaContext, testValidation: (result: any, testEntity: AnyClass) => Promise<void>) {
      const refJson = schemaName === "BisCore" ? {} : {
        references: [
          {
            name: "BisCore",
            version: "01.00.01",
          },
        ],
      };

      const schemaJson = {
        $schema: "https://dev.bentley.com/json_schemas/ec/32/ecschema",
        name: schemaName,
        alias: schemaAlias,
        version: "01.00.01",
        description: "This is a test schema",
        ...refJson,
        items: {
          ClassHasHandler: {
            appliesTo: "Any",
            description: "Applied to an ECClass to indicate that a C++ subclass of DgnDomain::Handler will supply behavior for it at run-time. This custom attribute may only be used by BisCore or other core schemas.",
            modifier: "sealed",
            schemaItemType: "CustomAttributeClass",
          },

          TestEntity: {
            modifier: "none",
            schemaItemType: "EntityClass",
            customAttributes: [
              { className: "BisCore.ClassHasHandler" },
            ],
            properties: [
              {
                name: "IntProps",
                type: "PrimitiveProperty",
                typeName: "int",
              },
            ],
          },
        },
      };
      const testSchema = await Schema.fromJson(schemaJson, schemaContext);

      const testEntity = await testSchema.getItem<AnyClass>("TestEntity");
      expect(testEntity !== undefined, "TestEntity should be within TestSchema").to.be.true;
      expect(testEntity!.schema.name === schemaName, "TestEntity should be within TestSchema").to.be.true;
      expect(testEntity!.customAttributes!.has("BisCore.ClassHasHandler"), "TestEntity should be within TestSchema").to.be.true;

      const result = Rules.classHasHandlerCACannotAppliedOutsideCoreSchemas(testEntity!);
      await testValidation(result, testEntity!);
    }

    it("ClassHasHandler used inside BisCore, Generic, Functional Schema, Rule Passed", async () => {
      const testValidation = async (result: any, _testEntity: AnyClass) => {
        for await (const _diagnostic of result!) {
          expect(false, "Rule should pass").to.be.true;
        }
      };

      // BisCore test
      await ClassHasHandlerRuleTest("BisCore", "bis", new SchemaContext(), testValidation);

      // Generic test
      await ClassHasHandlerRuleTest("Generic", "generic", await BisTestHelper.getNewContext(), testValidation);

      // Functional test
      await ClassHasHandlerRuleTest("Functional", "func", await BisTestHelper.getNewContext(), testValidation);
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
          expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);
        }
        expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
      };

      await ClassHasHandlerRuleTest("TestSchema", "ts", await BisTestHelper.getNewContext(), testValidation);
    });
  });

  describe("NoNewClassHasHandlerCAInCoreSchemas", () => {
    async function ClassHasHandlerRuleTest(schemaName: string, schemaAlias: string, className: string, schemaContext: SchemaContext, testValidation: (result: any, testEntity: AnyClass) => Promise<void>) {

      const refJson = schemaName === "BisCore" ? {} : {
        references: [
          {
            name: "BisCore",
            version: "01.00.01",
          },
        ],
      };

      let schemaJson = {
        $schema: "https://dev.bentley.com/json_schemas/ec/32/ecschema",
        name: schemaName,
        alias: schemaAlias,
        version: "01.00.01",
        description: "This is a test schema",
        ...refJson,
        items: {
          ClassHasHandler: {
            appliesTo: "Any",
            description: "Applied to an ECClass to indicate that a C++ subclass of DgnDomain::Handler will supply behavior for it at run-time. This custom attribute may only be used by BisCore or other core schemas.",
            modifier: "sealed",
            schemaItemType: "CustomAttributeClass",
          },

          TestClassName: {
            modifier: "none",
            schemaItemType: "EntityClass",
            customAttributes: [
              { className: "BisCore.ClassHasHandler" },
            ],
          },
        },
      };
      schemaJson = JSON.parse(JSON.stringify(schemaJson).replace("TestClassName", className));
      const testSchema = await Schema.fromJson(schemaJson, schemaContext);
      const testEntity = await testSchema.getItem<AnyClass>(className);
      expect(testEntity !== undefined, `${className} should be within TestSchema`).to.be.true;
      expect(testEntity!.schema.name === schemaName, `${className} schema name should be TestSchema`).to.be.true;
      expect(testEntity!.customAttributes!.has("BisCore.ClassHasHandler"), `${className} should have BisCore.ClassHasHandler custom attribute`).to.be.true;

      const result = Rules.noNewClassHasHandlerCAInCoreSchemas(testEntity!);
      await testValidation(result, testEntity!);
    }

    it("ClassHasHandler used on existing class inside BisCore, Generic, Functional Schema, Rule Passes", async () => {
      const testValidation = async (result: any, anyClass: AnyClass) => {
        for await (const _diagnostic of result!) {
          expect(false, `Rule NoNewClassHasHandlerCAInCoreSchemas should have passed for class '${anyClass.fullName}'`).to.be.true;
        }
      };

      // BisCore test
      for (const className of Rules.bisCoreClassHasHandlerClasses) {
        await ClassHasHandlerRuleTest("BisCore", "bis", className, new SchemaContext(), testValidation);
      }

      // Generic test
      for (const className of Rules.genericClassHasHandlerClasses) {
        await ClassHasHandlerRuleTest("Generic", "generic", className, await BisTestHelper.getNewContext(), testValidation);
      }

      // Functional test
      for (const className of Rules.functionalClassHasHandlerClasses) {
        await ClassHasHandlerRuleTest("Functional", "func", className, await BisTestHelper.getNewContext(), testValidation);
      }
    });

    it("ClassHasHandler used in new Class within BisCore, Generic, Functional Schema, Rule Violated", async () => {
      const testValidation = async (result: any, anyClass: AnyClass) => {
        let resultHasEntries = false;
        for await (const diagnostic of result!) {
          resultHasEntries = true;
          expect(diagnostic).to.not.be.undefined;
          expect(diagnostic!.ecDefinition).to.equal(anyClass!);
          expect(diagnostic!.messageArgs).to.eql([anyClass!.fullName, anyClass!.schema.name]);
          expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
          expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.NoNewClassHasHandlerCAInCoreSchemas);
          expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);
        }
        expect(resultHasEntries, `Test should have passed for class '${anyClass.fullName}' as Rule violation as it should not be in the list of allowable classes for ClassHasHandler custom attribute.`).to.be.true;
      };

      await ClassHasHandlerRuleTest("BisCore", "bis", "NewClass", new SchemaContext(), testValidation);
      await ClassHasHandlerRuleTest("Generic", "generic", "NewClass", await BisTestHelper.getNewContext(), testValidation);
      await ClassHasHandlerRuleTest("Functional", "func", "NewClass", await BisTestHelper.getNewContext(), testValidation);
    });
  });

  describe("ClassShouldNotDerivedFromDeprecatedClass", () => {
    it("Ignore deprecated class, rule passed", async () => {
      schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = schema as MutableSchema;

      const deprecatedClass = await mutableSchema.createEntityClass("DeprecatedEntity");
      const deprecatedMutable = deprecatedClass as ECClass as MutableClass;
      deprecatedMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const testEntity = await mutableSchema.createEntityClass("TestEntity");
      const testClassMutable = testEntity as ECClass as MutableClass;
      testClassMutable.baseClass = new DelayedPromiseWithProps(deprecatedClass.key, async () => deprecatedClass) as LazyLoadedSchemaItem<EntityClass>;
      testClassMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const result = Rules.classShouldNotDerivedFromDeprecatedClass(testEntity);
      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Entity class derived from a deprecated entity class, warning issued, no warning issue for deprecated mixin since the rule only check main base, rule passed", async () => {
      schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = schema as MutableSchema;

      const deprecatedClass = await mutableSchema.createEntityClass("DeprecatedEntity");
      const deprecatedMutable = deprecatedClass as ECClass as MutableClass;
      deprecatedMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const deprecatedMixin = await mutableSchema.createMixinClass("DeprecatedMixin");
      const deprecatedMixinMutable = deprecatedMixin as ECClass as MutableClass;
      deprecatedMixinMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const normalEntity = await mutableSchema.createEntityClass("Entity");
      const normalEntityMutable = normalEntity as MutableEntityClass;
      normalEntityMutable.baseClass = new DelayedPromiseWithProps(deprecatedClass.key, async () => deprecatedClass) as LazyLoadedSchemaItem<EntityClass>;
      normalEntityMutable.addMixin(deprecatedMixin);

      const result = Rules.classShouldNotDerivedFromDeprecatedClass(normalEntity);
      let resultHasEntries = false;
      for await (const diagnostic of result) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(normalEntity);
        expect(diagnostic!.messageArgs).to.eql(["TestSchema.Entity", "TestSchema.DeprecatedEntity", "TestSchema.DeprecatedEntity"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.ClassShouldNotDerivedFromDeprecatedClass);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries").to.be.true;
    });

    it("Relationship class derived from a deprecated relationship class, warning issued, rule passed", async () => {
      schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = schema as MutableSchema;

      const deprecatedRel = await mutableSchema.createRelationshipClass("DeprecatedRelationship");
      const deprecatedMutable = deprecatedRel as ECClass as MutableClass;
      deprecatedMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const normalRel = await mutableSchema.createRelationshipClass("NormalRelationship");
      const normalMutable = normalRel as ECClass as MutableClass;
      normalMutable.baseClass = new DelayedPromiseWithProps(deprecatedRel.key, async () => deprecatedRel) as LazyLoadedSchemaItem<RelationshipClass>;

      const result = Rules.classShouldNotDerivedFromDeprecatedClass(normalRel);
      let resultHasEntries = false;
      for await (const diagnostic of result) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(normalRel);
        expect(diagnostic!.messageArgs).to.eql(["TestSchema.NormalRelationship", "TestSchema.DeprecatedRelationship", "TestSchema.DeprecatedRelationship"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.ClassShouldNotDerivedFromDeprecatedClass);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries").to.be.true;
    });

    it("Class indirectly derives from a deprecated main class, mixin is ignored in this rule, warning issued, rule passed", async () => {
      schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = schema as MutableSchema;

      const deprecatedClass = await mutableSchema.createEntityClass("DeprecatedEntity");
      const deprecatedMutable = deprecatedClass as ECClass as MutableClass;
      deprecatedMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const indirectDeprecatedClass = await mutableSchema.createEntityClass("IndirectDeprecatedEntity");
      const indirectDeprecatedMutable = indirectDeprecatedClass as ECClass as MutableClass;
      indirectDeprecatedMutable.baseClass = new DelayedPromiseWithProps(deprecatedClass.key, async () => deprecatedClass) as LazyLoadedSchemaItem<EntityClass>;

      const deprecatedMixin = await mutableSchema.createMixinClass("DeprecatedMixin");
      const deprecatedMixinMutable = deprecatedMixin as ECClass as MutableClass;
      deprecatedMixinMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const indirectDeprecatedMixin = await mutableSchema.createMixinClass("IndirectDeprecatedMixin");
      const indirectDeprecatedMixinMutable = indirectDeprecatedMixin as ECClass as MutableClass;
      indirectDeprecatedMixinMutable.baseClass = new DelayedPromiseWithProps(deprecatedMixin.key, async () => deprecatedMixin) as LazyLoadedSchemaItem<Mixin>;

      const normalEntity = await mutableSchema.createEntityClass("Entity");
      const normalEntityMutable = normalEntity as MutableEntityClass;
      normalEntityMutable.baseClass = new DelayedPromiseWithProps(indirectDeprecatedClass.key, async () => deprecatedClass) as LazyLoadedSchemaItem<EntityClass>;
      normalEntityMutable.addMixin(indirectDeprecatedMixin);

      const result = Rules.classShouldNotDerivedFromDeprecatedClass(normalEntity);
      let resultHasEntries = false;
      for await (const diagnostic of result) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(normalEntity);
        expect(diagnostic!.messageArgs).to.eql(["TestSchema.Entity", "TestSchema.IndirectDeprecatedEntity", "TestSchema.DeprecatedEntity"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.ClassShouldNotDerivedFromDeprecatedClass);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries").to.be.true;
    });

    it("Class does not derived from deprecated class", async () => {
      schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = schema as MutableSchema;

      const base = await mutableSchema.createEntityClass("BaseEntity");
      const normalEntity = await mutableSchema.createEntityClass("Entity");
      normalEntity.baseClass = new DelayedPromiseWithProps(base.key, async () => base) as LazyLoadedSchemaItem<EntityClass>;

      const result = Rules.classShouldNotDerivedFromDeprecatedClass(normalEntity);
      for await (const _diagnostic of result) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("ClassShouldNotUseDeprecatedProperty", () => {
    it("Class has no deprecated property, rule passed", async () => {
      const testSchema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const testMutable = testSchema as MutableSchema;

      const normalEntity = await testMutable.createEntityClass("NormalEntity");
      const entityMutable = normalEntity as ECClass as MutableClass;
      await entityMutable.createPrimitiveProperty("IntProp", PrimitiveType.Integer);

      const result = Rules.classShouldNotHaveDeprecatedProperty(normalEntity);
      for await (const _diagnostic of result) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Ignore deprecated class, rule passed", async () => {
      schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = schema as MutableSchema;

      const testEntity = await mutableSchema.createEntityClass("TestEntity");
      const testClassMutable = testEntity as ECClass as MutableClass;
      testClassMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const deprecatedProp = await testClassMutable.createPrimitiveProperty("intProp", PrimitiveType.Integer);
      const deprecatedPropMutable = deprecatedProp as Property as MutableProperty;
      deprecatedPropMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const result = Rules.classShouldNotHaveDeprecatedProperty(testEntity);
      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Class has deprecated property, warning issued, rule passed", async () => {
      const testSchema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const testMutable = testSchema as MutableSchema;

      const normalEntity = await testMutable.createEntityClass("NormalEntity");
      const entityMutable = normalEntity as ECClass as MutableClass;
      const deprecatedProp = await entityMutable.createPrimitiveProperty("intProp", PrimitiveType.Integer);
      const deprecatedMutable = deprecatedProp as Property as MutableProperty;
      deprecatedMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const result = Rules.classShouldNotHaveDeprecatedProperty(normalEntity);
      let resultHasEntries = false;
      for await (const diagnostic of result) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(normalEntity);
        expect(diagnostic!.messageArgs).to.eql(["TestSchema.NormalEntity", "intProp"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.ClassShouldNotHaveDeprecatedProperty);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries").to.be.true;
    });
  });

  describe("ClassShouldNotUsePropertyOfDeprecatedStruct", () => {
    it("Class has no deprecated struct property, rule passed", async () => {
      const testSchema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const testMutable = testSchema as MutableSchema;

      const normalStruct = await testMutable.createStructClass("NormalStruct");
      const structMutable = normalStruct as ECClass as MutableClass;
      await structMutable.createPrimitiveProperty("intProps", PrimitiveType.Integer);
      await structMutable.createPrimitiveProperty("stringProps", PrimitiveType.String);

      const normalEntity = await testMutable.createStructClass("NormalEntity");
      const entityMutable = normalEntity as ECClass as MutableClass;
      await entityMutable.createStructProperty("structProps", normalStruct);

      const result = Rules.classShouldNotHavePropertyOfDeprecatedStructClass(normalEntity);
      for await (const _diagnostic of result) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Ignore deprecated class, rule passed", async () => {
      schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = schema as MutableSchema;

      const deprecatedStruct = await mutableSchema.createStructClass("DeprecatedStruct");
      const structMutable = deprecatedStruct as ECClass as MutableClass;
      await structMutable.createPrimitiveProperty("intProps", PrimitiveType.Integer);
      await structMutable.createPrimitiveProperty("stringProps", PrimitiveType.String);
      structMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const testEntity = await mutableSchema.createEntityClass("TestEntity");
      const testClassMutable = testEntity as ECClass as MutableClass;
      testClassMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });
      await testClassMutable.createStructProperty("structProp", deprecatedStruct);

      const result = Rules.classShouldNotHavePropertyOfDeprecatedStructClass(testEntity);
      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Ignore deprecated Property, rule passed", async () => {
      schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = schema as MutableSchema;

      const deprecatedStruct = await mutableSchema.createStructClass("DeprecatedStruct");
      const structMutable = deprecatedStruct as ECClass as MutableClass;
      await structMutable.createPrimitiveProperty("intProps", PrimitiveType.Integer);
      await structMutable.createPrimitiveProperty("stringProps", PrimitiveType.String);
      structMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const testEntity = await mutableSchema.createEntityClass("TestEntity");
      const testClassMutable = testEntity as ECClass as MutableClass;

      const deprecatedProp = await testClassMutable.createStructProperty("structProp", deprecatedStruct);
      const deprecatedPropMutable = deprecatedProp as Property as MutableProperty;
      deprecatedPropMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const result = Rules.classShouldNotHavePropertyOfDeprecatedStructClass(testEntity);
      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Class has property which is of deprecated struct, warning issued, rule passed", async () => {
      const testSchema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const testMutable = testSchema as MutableSchema;

      const deprecatedStruct = await testMutable.createStructClass("DeprecatedStruct");
      const deprecatedMutable = deprecatedStruct as ECClass as MutableClass;
      deprecatedMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });
      await deprecatedMutable.createPrimitiveProperty("IntProps", PrimitiveType.Integer);

      const entityClass = await testMutable.createEntityClass("EntityClass");
      const entityMutable = entityClass as ECClass as MutableClass;
      await entityMutable.createStructProperty("deprecatedStructProps", deprecatedStruct);
      await entityMutable.createStructArrayProperty("deprecatedStructArrayProps", deprecatedStruct);

      const result = Rules.classShouldNotHavePropertyOfDeprecatedStructClass(entityClass);
      let index = 0;
      for await (const diagnostic of result) {
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(entityClass);
        if (index === 0)
          expect(diagnostic!.messageArgs).to.eql(["TestSchema.EntityClass", "deprecatedStructProps", "TestSchema.DeprecatedStruct"]);
        else
          expect(diagnostic!.messageArgs).to.eql(["TestSchema.EntityClass", "deprecatedStructArrayProps", "TestSchema.DeprecatedStruct"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.ClassShouldNotHavePropertyOfDeprecatedStructClass);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);

        ++index;
      }
      expect(index === 2, "expected rule to return an AsyncIterable with 2 entries").to.be.true;
    });
  });

  describe("ClassShouldNotUseDeprecatedCustomAttributes", () => {
    it("Class use deprecated custom attributes, Warning issued, rule passed", async () => {
      const testSchema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = testSchema as MutableSchema;

      const deprecatedCA = await mutableSchema.createCustomAttributeClass("DeprecatedCustomAttribute");
      const deprecatedMutableCA = deprecatedCA as ECClass as MutableClass;
      deprecatedMutableCA.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const entityClass = await mutableSchema.createEntityClass("EntityClass");
      const entityMutable = entityClass as ECClass as MutableClass;
      entityMutable.addCustomAttribute({ className: "DeprecatedCustomAttribute" });

      const result = Rules.classShouldNotUseDeprecatedCustomAttributes(entityClass);
      let index = 0;
      for await (const diagnostic of result) {
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(entityClass);
        expect(diagnostic!.messageArgs).to.eql(["TestSchema.EntityClass", "TestSchema.DeprecatedCustomAttribute"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.ClassShouldNotUseDeprecatedCustomAttributes);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!["diagnosticType"]).to.equal(DiagnosticType.SchemaItem);

        ++index;
      }

      expect(index === 1, "expected rule to return an AsyncIterable with one entry").to.be.true;
    });

    it("Deprecated Class use deprecated custom attributes, No Warning issued, rule passed", async () => {
      const testSchema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = testSchema as MutableSchema;

      const deprecatedCA = await mutableSchema.createCustomAttributeClass("DeprecatedCustomAttribute");
      const deprecatedMutableCA = deprecatedCA as ECClass as MutableClass;
      deprecatedMutableCA.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });

      const entityClass = await mutableSchema.createEntityClass("EntityClass");
      const entityMutable = entityClass as ECClass as MutableClass;
      entityMutable.addCustomAttribute({ className: "CoreCustomAttributes.Deprecated" });
      entityMutable.addCustomAttribute({ className: "DeprecatedCustomAttribute" });

      const result = Rules.classShouldNotUseDeprecatedCustomAttributes(entityClass);
      for await (const _diagnostic of result) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Class does not use deprecated custom attributes, rule passed", async () => {
      const testSchema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = testSchema as MutableSchema;

      await mutableSchema.createCustomAttributeClass("CustomAttribute");

      const entityClass = await mutableSchema.createEntityClass("EntityClass");
      const entityMutable = entityClass as ECClass as MutableClass;
      entityMutable.addCustomAttribute({ className: "CustomAttribute" });

      const result = Rules.classShouldNotUseDeprecatedCustomAttributes(entityClass);
      for await (const _diagnostic of result) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Class use non-existent custom attributes, not crash, rule passed", async () => {
      const testSchema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
      const mutableSchema = testSchema as MutableSchema;

      const entityClass = await mutableSchema.createEntityClass("EntityClass");
      const entityMutable = entityClass as ECClass as MutableClass;
      entityMutable.addCustomAttribute({ className: "NonExistCA" });

      const result = Rules.classShouldNotUseDeprecatedCustomAttributes(entityClass);
      for await (const _diagnostic of result) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });
});
