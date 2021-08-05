/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as utils from "./utilities/utils";
import { SchemaDeserializer } from "@bentley/native-schema-locater";
// eslint-disable-next-line sort-imports
import { AnyClass, ECClass, ECVersion, KindOfQuantity, PrimitiveType, RelationshipClass, Schema, SchemaContext, SchemaKey } from "@bentley/ecschema-metadata";
import { Diagnostics as ECDiagnostics } from "@bentley/ecschema-editing";
import { MutableClass } from "@bentley/ecschema-metadata/lib/Metadata/Class";
import { MutableSchema } from "@bentley/ecschema-metadata/lib/Metadata/Schema";
import * as ruleSuppressionSet from "../RuleSuppression";
import { expect } from "chai";
import { IModelHost } from "@bentley/imodeljs-backend";
import * as BisRules from "@bentley/bis-rules/lib/BisRules";

describe("Rule Suppression Tests", () => {
  let schema: Schema;
  let mutableSchema: MutableSchema;
  const assetDeserializationDir = path.join(utils.getAssetsDir(), "xml-deserialization");

  function createSchema(name: string, read: number, write?: number, minor?: number) {
    const key = new SchemaKey(name, new ECVersion(read, write, minor));
    schema = new Schema(new SchemaContext(), key, "ts");
    mutableSchema = schema as MutableSchema;
  }

  describe("Kind of Quantity Suppression Tests", async () => {
    const koqAssetsDir = utils.getKOQAssetDir();
    let deserializer: SchemaDeserializer;

    beforeEach(() => {
      deserializer = new SchemaDeserializer();
    });

    afterEach(async () => {
      await IModelHost.shutdown();
    });

    it("koqMustUseSIUnitForPersistenceUnit is suppressed for uses of MONETARY_UNIT related units in KOQs defined in the CifUnits schema.", async () => {
      const schemaPath = path.join(koqAssetsDir, "CifUnits.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      let koq = await testSchema.getItem<KindOfQuantity>("COST_PER_UNITVOLUME") as KindOfQuantity;
      let diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "Units.SI"]);

      let result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result, koq.fullName).to.be.true;

      koq = await testSchema.getItem<KindOfQuantity>("CURRENCY") as KindOfQuantity;
      diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "Units.SI"]);

      result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result, koq.fullName).to.be.true;

      koq = await testSchema.getItem<KindOfQuantity>("CURRENCY_PER_ENERGY") as KindOfQuantity;
      diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "Units.SI"]);

      result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result, koq.fullName).to.be.true;

      koq = await testSchema.getItem<KindOfQuantity>("CURRENCY_PER_POWER") as KindOfQuantity;
      diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "Units.SI"]);

      result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result, koq.fullName).to.be.true;
    });

    it("koqMustUseSIUnitForPersistenceUnit is not suppressed for uses of MONETARY_UNIT related units in KOQs defined in schemas not named CifUnits.", async () => {
      const schemaPath = path.join(koqAssetsDir, "CifUnitsNo.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      let koq = await testSchema.getItem<KindOfQuantity>("COST_PER_UNITVOLUME") as KindOfQuantity;
      let diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "Units.SI"]);

      let result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result, koq.fullName).to.be.false;

      koq = await testSchema.getItem<KindOfQuantity>("CURRENCY") as KindOfQuantity;
      diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "Units.SI"]);

      result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result, koq.fullName).to.be.false;

      koq = await testSchema.getItem<KindOfQuantity>("CURRENCY_PER_ENERGY") as KindOfQuantity;
      diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "Units.SI"]);

      result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result, koq.fullName).to.be.false;

      koq = await testSchema.getItem<KindOfQuantity>("CURRENCY_PER_POWER") as KindOfQuantity;
      diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "Units.SI"]);

      result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result, koq.fullName).to.be.false;
    });

    it("koqDuplicatePresentationFormat is suppressed for KindOfQuantity named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessFunctional.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await testSchema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;
      const diag = new BisRules.Diagnostics.KOQDuplicatePresentationFormat(koq, [koq.fullName, "TestFormat"]);

      const result = await ruleSuppressionSet.koqDuplicatePresentationFormat(diag, koq);
      expect(result).to.be.true;
    });

    it("koqDuplicatePresentationFormat is not suppressed for KindOfQuantity named 'ONE' in schemas not named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "BadNameSchema.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await testSchema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;
      const diag = new BisRules.Diagnostics.KOQDuplicatePresentationFormat(koq, [koq.fullName, "TestFormat"]);

      const result = await ruleSuppressionSet.koqDuplicatePresentationFormat(diag, koq);
      expect(result).to.be.false;
    });

    it("koqDuplicatePresentationFormat is not suppressed for KindOfQuantity not named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessPhysical.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await testSchema.getItem<KindOfQuantity>("THREE") as KindOfQuantity;
      const diag = new BisRules.Diagnostics.KOQDuplicatePresentationFormat(koq, [koq.fullName, "TestFormat"]);

      const result = await ruleSuppressionSet.koqDuplicatePresentationFormat(diag, koq);
      expect(result).to.be.false;
    });
  });

  describe("Relationship Class Suppression Tests", async () => {
    const relAssetsDir = utils.getRelationshipAssetDir();
    let deserializer: SchemaDeserializer;

    beforeEach(() => {
      deserializer = new SchemaDeserializer();
    });

    afterEach(async () => {
      await IModelHost.shutdown();
    });

    it("embeddingRelationshipsMustNotHaveHasInName is suppressed for schema named ProcessFunctional.", async () => {
      const schemaPath = path.join(relAssetsDir, "ProcessFunctional.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const relationshipClass = await testSchema.getItem<RelationshipClass>("hasString") as RelationshipClass;
      const diag = new BisRules.Diagnostics.EmbeddingRelationshipsMustNotHaveHasInName(relationshipClass, [relationshipClass.fullName]);

      const result = await ruleSuppressionSet.embeddingRelationshipsMustNotHaveHasInName(diag, relationshipClass);
      expect(result).to.be.true;
    });

    it("embeddingRelationshipsMustNotHaveHasInName is not suppressed for schema not named ProcessFunctional, ProcessPhysical, or starting with SP3D.", async () => {
      const schemaPath = path.join(relAssetsDir, "BadNameSchema.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const relationshipClass = await testSchema.getItem<RelationshipClass>("hasString") as RelationshipClass;
      const diag = new BisRules.Diagnostics.EmbeddingRelationshipsMustNotHaveHasInName(relationshipClass, [relationshipClass.fullName]);

      const result = await ruleSuppressionSet.embeddingRelationshipsMustNotHaveHasInName(diag, relationshipClass);
      expect(result).to.be.false;
    });
  });

  describe("BIS-007 & BIS-100 (display label must be unique) Tests", async () => {
    it("Random schema name, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ClassA", "ClassB", "TestLabel"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.false;
    });

    it("Schema ProcessPidGraphical.01.00.00 with classes OpSettings and OpCheckoutId, rule suppressed.", async () => {
      createSchema("ProcessPidGraphical", 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ProcessPidGraphical.OpSettings", "ProcessPidGraphical.OpCheckOutId", "OpenPlant Settings"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.true;
    });

    it("Schema ProcessPidGraphical.01.00.00  with unknown class, rule not suppressed.", async () => {
      createSchema("ProcessPidGraphical", 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ProcessPidGraphical.TestClassA", "ProcessPidGraphical.TestClassB", "TestLabel"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.false;
    });

    it("Schema ProcessPidGraphical.02.00.00, rule not suppressed.", async () => {
      createSchema("ProcessPidGraphical", 2);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ProcessPidGraphical.OpSettings", "ProcessPidGraphical.OpCheckOutId", "OpenPlant Settings"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.false;
    });

    it("Schema RoadRailPhysical.01.00.00 with classes DesignSpeedElement and DesignSpeed, rule suppressed.", async () => {
      createSchema("RoadRailPhysical", 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["RoadRailPhysical.DesignSpeedElement", "RoadRailPhysical.DesignSpeed", "Design Speed"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.true;
    });

    it("Schema RoadRailPhysical.01.00.00 with classes TypicalSectionPointDefinition and GenericTypicalSectionPointDefinition, rule suppressed.", async () => {
      createSchema("RoadRailPhysical", 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["RoadRailPhysical.TypicalSectionPointDefinition", "RoadRailPhysical.GenericTypicalSectionPointDefinition", "Typical Section Point Definition"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.true;
    });

    it("Schema RoadRailPhysical.01.00.00 with unknown class, rule not suppressed.", async () => {
      createSchema("RoadRailPhysical", 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["RoadRailPhysical.ClassA", "RoadRailPhysical.ClassB", "TestLabel"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.false;
    });

    it("Schema RoadRailPhysical.02.00.00, rule not suppressed.", async () => {
      createSchema("RoadRailPhysical", 1, 0, 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ClassA", "ClassB", "TestLabel"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.false;
    });

    it("Schema ProcessPhysical.01.00.01 with classes PipeAlignment and PIPE_GUIDE, rule suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ProcessPhysical.PipeAlignment", "ProcessPhysical.PIPE_GUIDE", "Pipe Guide"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.true;
    });

    it("Schema ProcessPhysical.01.00.01 with classes PipeClamp and PIPE_CLAMP, rule suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ProcessPhysical.PipeClamp", "ProcessPhysical.PIPE_CLAMP", "Pipe Clamp"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.true;
    });

    it("Schema ProcessPhysical.01.00.01 with classes RiserClamp and RISER_CLAMP, rule suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ProcessPhysical.RiserClamp", "ProcessPhysical.RISER_CLAMP", "Riser Clamp"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.true;
    });

    it("Schema ProcessPhysical.01.00.01 with classes SpringHanger and SPRING_HANGER, rule suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ProcessPhysical.SpringHanger", "ProcessPhysical.SPRING_HANGER", "Spring Hanger"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.true;
    });

    it("Schema ProcessPhysical.01.00.01 with unknown class, rule not suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ProcessPhysical.ClassA", "ProcessPhysical.ClassB", "TestLabel"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.false;
    });

    it("Schema ProcessPhysical.01.01.01, rule not suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 1, 1);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ProcessPhysical.PipeAlignment", "ProcessPhysical.PIPE_GUIDE", "Pipe Guide"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
      expect(result).to.be.false;
    });
  });

  describe("BIS-100 (display label must be unique) Tests", async () => {
    it("Schema ProcessPhysical.01.00.01 with class PLANT_BASE_OBJECT with DESIGN_STATE and DesignState property, duplicate label, rule suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("PLANT_BASE_OBJECT");
      const diag = new BisRules.Diagnostics.MultiplePropertiesInClassWithSameLabel(testClass, ["ProcessPhysical.PLANT_BASE_OBJECT", "DESIGN_STATE", "DesignState", "Design State"]);

      const result = await ruleSuppressionSet.multiplePropertiesInClassWithSameLabel(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema ProcessPhysical.01.00.01 with unknown class, rule not suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("PLANT_BASE_OBJECT");
      const diag = new BisRules.Diagnostics.MultiplePropertiesInClassWithSameLabel(testClass, ["ProcessPhysical.Unknown", "DESIGN_STATE", "DesignState", "Design State"]);

      const result = await ruleSuppressionSet.multiplePropertiesInClassWithSameLabel(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema ProcessPhysical.01.00.01 with different label, rule not suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("PLANT_BASE_OBJECT");
      const diag = new BisRules.Diagnostics.MultiplePropertiesInClassWithSameLabel(testClass, ["ProcessPhysical.PLANT_BASE_OBJECT", "Unknown", "DesignState", "Design State"]);

      const result = await ruleSuppressionSet.multiplePropertiesInClassWithSameLabel(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema ProcessPhysical.01.00.01 with different properties, rule not suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("PLANT_BASE_OBJECT");
      const diag = new BisRules.Diagnostics.MultiplePropertiesInClassWithSameLabel(testClass, ["ProcessPhysical.PLANT_BASE_OBJECT", "DESIGN_STATE_TEST", "DesignState", "Unknown"]);

      const result = await ruleSuppressionSet.multiplePropertiesInClassWithSameLabel(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema ProcessPhysical.01.01.01, rule not suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 1, 1);
      const testClass = await mutableSchema.createEntityClass("PLANT_BASE_OBJECT");
      const diag = new BisRules.Diagnostics.MultiplePropertiesInClassWithSameLabel(testClass as AnyClass, ["ProcessPhysical.PLANT_BASE_OBJECT", "DESIGN_STATE", "DesignState", "Design State"]);

      const result = await ruleSuppressionSet.multiplePropertiesInClassWithSameLabel(diag, testClass);
      expect(result).to.be.false;
    });
  });

  describe("BIS-101(ClassHasHandler applied outside core schemas) Tests", async () => {
    it("Schema Grids.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("Grids", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema Grids.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("Grids", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema Markup.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("Markup", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema Markup.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("Markup", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema Construction.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("Construction", 1, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema Construction.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("Construction", 1, 0, 3);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema StructuralPhysical.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("StructuralPhysical", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema StructuralPhysical.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("StructuralPhysical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema ThreeMx.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("ThreeMx", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema ThreeMx.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("ThreeMx", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema ScalableMesh.01.00.01 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("ScalableMesh", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema ScalableMesh.01.00.02 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("ScalableMesh", 1, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema Raster.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("Raster", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema Raster.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("Raster", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema PointCloud.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("PointCloud", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema PointCloud.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("PointCloud", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema QuantityTakeoffsAspects.01.00.01 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("QuantityTakeoffsAspects", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema QuantityTakeoffsAspects.01.00.02 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("QuantityTakeoffsAspects", 1, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema ProcessFunctional.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("ProcessFunctional", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema ProcessFunctional.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("ProcessFunctional", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema ProcessPhysical.01.00.01 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema ProcessPhysical.01.00.02 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("ProcessPhysical", 1, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema ProcessPidGraphical.01.00.01 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("ProcessPidGraphical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema ProcessPidGraphical.01.00.02 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("ProcessPidGraphical", 1, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema LinearReferencing.02.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("LinearReferencing", 2, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema LinearReferencing.02.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("LinearReferencing", 2, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema ClassificationSystems.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("ClassificationSystems", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema ClassificationSystems.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("ClassificationSystems", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema RoadRailPhysical.02.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("RoadRailPhysical", 2, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema RoadRailPhysical.02.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("RoadRailPhysical", 2, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema RoadRailAlignment.02.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("RoadRailAlignment", 2, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema RoadRailAlignment.02.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("RoadRailAlignment", 2, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema BridgeStructuralPhysical.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("BridgeStructuralPhysical", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema BridgeStructuralPhysical.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("BridgeStructuralPhysical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema BuildingSpatial.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("BuildingSpatial", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema BuildingSpatial.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("BuildingSpatial", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema BuildingPhysical.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("BuildingPhysical", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema BuildingPhysical.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("BuildingPhysical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema ArchitecturalPhysical.01.00.00 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("ArchitecturalPhysical", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema ArchitecturalPhysical.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("ArchitecturalPhysical", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });

    it("Schema DgnV8OpenRoadsDesigner.02.00.01 with class containing ClassHasHandler custom attribute, rule suppressed.", async () => {
      createSchema("DgnV8OpenRoadsDesigner", 2, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.true;
    });

    it("Schema DgnV8OpenRoadsDesigner.01.00.01 with class containing ClassHasHandler custom attribute, rule not suppressed.", async () => {
      createSchema("DgnV8OpenRoadsDesigner", 2, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "BisCore.ClassHasHandler" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new BisRules.Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(testClass, [testClass.fullName, testClass.schema.name]);
      const result = await ruleSuppressionSet.classHasHandlerCACannotAppliedOutsideCoreSchemas(diag, testClass);

      expect(result).to.be.false;
    });
  });

  describe("BIS-605(Entity class requires ElementOwnsUniqueAspect relationship with this class supported as a target constraint) Tests", async () => {
    it("Random schema name, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const testClass = await mutableSchema.createEntityClass("Classification");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema BuildingCommon.01.00.00 with unknown class, rule not suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema BuildingCommon.01.00.00 with class ABDIFCOerrides, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("ABDIFCOerrides");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.01.00.00 with class ABDIdentification, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("ABDIdentification");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.01.00.00 with class AcousticalProperties, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("AcousticalProperties");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.01.00.00 with class AnalyticalProperties, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("AnalyticalProperties");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.01.00.00 with class Classification, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("Classification");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.01.00.00 with class FireResistance, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("FireResistance");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.01.00.00 with class IdentityData, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("IdentityData");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.01.00.00 with class Manufacturer, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("Manufacturer");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.01.00.00 with class Phases, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("Phases");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.02.00.00 with suppressed class, rule not suppressed.", async () => {
      createSchema("BuildingCommon", 2);
      const testClass = await mutableSchema.createEntityClass("Phases");
      const diag = new BisRules.Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(testClass, [testClass.fullName]);

      const result = await ruleSuppressionSet.elementUniqueAspectMustHaveCorrespondingRelationship(diag, testClass);
      expect(result).to.be.false;
    });
  });

  describe("BIS-607(Entity may not subclass model classes) Tests", async () => {
    it("Random schema name, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema StructuralPhysical.01.00.00 with unknown class, rule not suppressed.", async () => {
      createSchema("StructuralPhysical", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema StructuralPhysical.01.00.00 with class StructuralPhysicalModel, rule suppressed.", async () => {
      createSchema("StructuralPhysical", 1);
      const testClass = await mutableSchema.createEntityClass("StructuralPhysicalModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema StructuralPhysical.02.00.00 with suppressed class, rule not suppressed.", async () => {
      createSchema("StructuralPhysical", 2);
      const testClass = await mutableSchema.createEntityClass("StructuralPhysicalModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema BuildingPhysical.01.00.00 with unknown class, rule not suppressed.", async () => {
      createSchema("BuildingPhysical", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema BuildingPhysical.01.00.00 with class BuildingPhysicalModel, rule suppressed.", async () => {
      createSchema("BuildingPhysical", 1);
      const testClass = await mutableSchema.createEntityClass("BuildingPhysicalModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingPhysical.01.00.00 with class BuildingTypeDefinitionModel, rule suppressed.", async () => {
      createSchema("BuildingPhysical", 1);
      const testClass = await mutableSchema.createEntityClass("BuildingTypeDefinitionModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingPhysical.02.00.00 with suppressed class, rule not suppressed.", async () => {
      createSchema("BuildingPhysical", 2);
      const testClass = await mutableSchema.createEntityClass("BuildingPhysicalModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema RoadRailPhysical.01.00.00 with unknown class, rule not suppressed.", async () => {
      createSchema("RoadRailPhysical", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema RoadRailPhysical.01.00.00 with class RailwayStandardsModel, rule suppressed.", async () => {
      createSchema("RoadRailPhysical", 1);
      const testClass = await mutableSchema.createEntityClass("RailwayStandardsModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema RoadRailPhysical.01.00.00 with class RoadwayStandardsModel, rule suppressed.", async () => {
      createSchema("RoadRailPhysical", 1);
      const testClass = await mutableSchema.createEntityClass("RoadwayStandardsModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema RoadRailPhysical.02.00.00 with suppressed class, rule not suppressed.", async () => {
      createSchema("RoadRailPhysical", 2);
      const testClass = await mutableSchema.createEntityClass("RailwayStandardsModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema RoadRailAlignment.01.00.00 with unknown class, rule suppressed.", async () => {
      createSchema("RoadRailAlignment", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema RoadRailAlignment.01.00.00 with class AlignmentModel, rule suppressed.", async () => {
      createSchema("RoadRailAlignment", 1);
      const testClass = await mutableSchema.createEntityClass("AlignmentModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema RoadRailAlignment.01.00.00 with class ConfigurationModel, rule suppressed.", async () => {
      createSchema("RoadRailAlignment", 1);
      const testClass = await mutableSchema.createEntityClass("ConfigurationModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema RoadRailAlignment.01.00.00 with class HorizontalAlignmentModel, rule suppressed.", async () => {
      createSchema("RoadRailAlignment", 1);
      const testClass = await mutableSchema.createEntityClass("HorizontalAlignmentModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema RoadRailAlignment.01.00.00 with class RoadRailCategoryModel, rule suppressed.", async () => {
      createSchema("RoadRailAlignment", 1);
      const testClass = await mutableSchema.createEntityClass("RoadRailCategoryModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema RoadRailAlignment.02.00.00 with suppressed class, rule not suppressed.", async () => {
      createSchema("RoadRailAlignment", 2);
      const testClass = await mutableSchema.createEntityClass("RoadRailCategoryModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.DefinitionModel"]);

      const result = await ruleSuppressionSet.entityClassesCannotDeriveFromModelClasses(diag, testClass);
      expect(result).to.be.false;
    });
  });

  describe("BIS-609(Bis model subclasses cannot define properties) Tests", async () => {
    it("Random schema name, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.Model"]);

      const result = await ruleSuppressionSet.bisModelSubClassesCannotDefineProperties(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema ScalableMesh.01.00.00 with unknown class, rule not suppressed.", async () => {
      createSchema("ScalableMesh", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.Model"]);

      const result = await ruleSuppressionSet.bisModelSubClassesCannotDefineProperties(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema ScalableMesh.01.00.00 with class ScalableMeshModel, rule suppressed.", async () => {
      createSchema("ScalableMesh", 1);
      const testClass = await mutableSchema.createEntityClass("ScalableMeshModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.Model"]);

      const result = await ruleSuppressionSet.bisModelSubClassesCannotDefineProperties(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema ScalableMesh.02.00.00 with suppressed class, rule not suppressed.", async () => {
      createSchema("ScalableMesh", 2);
      const testClass = await mutableSchema.createEntityClass("ScalableMeshModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.Model"]);

      const result = await ruleSuppressionSet.bisModelSubClassesCannotDefineProperties(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema Raster.01.00.00 with unknown class, rule not suppressed.", async () => {
      createSchema("Raster", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.Model"]);

      const result = await ruleSuppressionSet.bisModelSubClassesCannotDefineProperties(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema Raster.01.00.00 with class RasterModel, rule suppressed.", async () => {
      createSchema("Raster", 1);
      const testClass = await mutableSchema.createEntityClass("RasterModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.Model"]);

      const result = await ruleSuppressionSet.bisModelSubClassesCannotDefineProperties(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema Raster.02.00.00 with suppressed class, rule not suppressed.", async () => {
      createSchema("Raster", 2);
      const testClass = await mutableSchema.createEntityClass("RasterModel");
      const diag = new BisRules.Diagnostics.EntityClassesCannotDeriveFromModelClasses(testClass, [testClass.fullName, "BisCore.Model"]);

      const result = await ruleSuppressionSet.bisModelSubClassesCannotDefineProperties(diag, testClass);
      expect(result).to.be.false;
    });
  });

  describe("BIS-610(Entity classes may not subclass deprecated classes) Tests", async () => {
    it("Random schema name, SpatialStructureElement class, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const testClass = await mutableSchema.createEntityClass("SpatialStructureElement");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema 'SpatialComposition.01.00.00' with unknown class, rule not suppressed.", async () => {
      createSchema("SpatialComposition", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema 'SpatialComposition.01.00.00' with class SpatialStructureElement, rule suppressed.", async () => {
      createSchema("SpatialComposition", 1);
      const testClass = await mutableSchema.createEntityClass("SpatialStructureElement");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema SpatialComposition.02.00.00' with suppressed class, rule not suppressed.", async () => {
      createSchema("SpatialComposition", 2);
      const testClass = await mutableSchema.createEntityClass("SpatialStructureElement");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Random schema name, Building class, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const testClass = await mutableSchema.createEntityClass("Building");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema 'BuildingSpatial.01.00.00' with unknown class, rule not suppressed.", async () => {
      createSchema("BuildingSpatial", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema 'BuildingSpatial.01.00.00' with class Building, rule suppressed.", async () => {
      createSchema("BuildingSpatial", 1);
      const testClass = await mutableSchema.createEntityClass("Building");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingSpatial.02.00.00' with class Building, rule not suppressed.", async () => {
      createSchema("BuildingSpatial", 2);
      const testClass = await mutableSchema.createEntityClass("Building");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Random schema name, Story class, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const testClass = await mutableSchema.createEntityClass("Story");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema 'BuildingSpatial.01.00.00' with class Story, rule suppressed.", async () => {
      createSchema("BuildingSpatial", 1);
      const testClass = await mutableSchema.createEntityClass("Story");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingSpatial.02.00.00' with class Story, rule not suppressed.", async () => {
      createSchema("BuildingSpatial", 2);
      const testClass = await mutableSchema.createEntityClass("Story");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Random schema name, Space class, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const testClass = await mutableSchema.createEntityClass("Space");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema 'BuildingSpatial.01.00.00' with class Space, rule suppressed.", async () => {
      createSchema("BuildingSpatial", 1);
      const testClass = await mutableSchema.createEntityClass("Space");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema BuildingSpatial.02.00.00' with class Space, rule not suppressed.", async () => {
      createSchema("BuildingSpatial", 2);
      const testClass = await mutableSchema.createEntityClass("Space");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Random schema name, SpatialStructureElement class, rule not suppressed.", async () => {
      createSchema("TestSchema", 1, 1);
      const testClass = await mutableSchema.createEntityClass("SpatialStructureElement");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema 'BuildingTemplate_US.01.01.00' with unknown class, rule not suppressed.", async () => {
      createSchema("BuildingTemplate_US", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Schema 'BuildingTemplate_US.01.01.00' with class SpatialStructureElement, rule suppressed.", async () => {
      createSchema("BuildingTemplate_US", 1);
      const testClass = await mutableSchema.createEntityClass("Site");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.true;
    });

    it("Schema 'BuildingTemplate_US.01.02.00' with suppressed class, rule not suppressed.", async () => {
      createSchema("BuildingTemplate_US", 2);
      const testClass = await mutableSchema.createEntityClass("Site");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });

    it("Random schema name, Site class, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const testClass = await mutableSchema.createEntityClass("Site");
      const diag = new BisRules.Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(testClass, [testClass.fullName, "SpatialComposition.CompositeElement"]);

      const result = await ruleSuppressionSet.entityClassesMayNotSubclassDeprecatedClasses(diag, testClass);
      expect(result).to.be.false;
    });
  });

  describe("BIS-1300(long properties not allowed) Tests", async () => {
    it("Random schema name, rule not suppressed.", async () => {
      createSchema("TestSchema", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.Long);
      const diag = new BisRules.Diagnostics.PropertyShouldNotBeOfTypeLong(property, [property.class.fullName, property.name]);

      const result = await ruleSuppressionSet.propertyShouldNotBeOfTypeLong(diag, property);
      expect(result).to.be.false;
    });

    it("Schema BuildingCommon.01.00.00 with unknown property, rule not suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("ABDIdentification");
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.Long);
      const diag = new BisRules.Diagnostics.PropertyShouldNotBeOfTypeLong(property, [property.class.fullName, property.name]);

      const result = await ruleSuppressionSet.propertyShouldNotBeOfTypeLong(diag, property);
      expect(result).to.be.false;
    });

    it("Schema BuildingCommon.01.00.00 with class property ABDIdentification:ElementId, rule suppressed.", async () => {
      createSchema("BuildingCommon", 1);
      const testClass = await mutableSchema.createEntityClass("ABDIdentification");
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("ElementId", PrimitiveType.Long);
      const diag = new BisRules.Diagnostics.PropertyShouldNotBeOfTypeLong(property, [property.class.fullName, property.name]);

      const result = await ruleSuppressionSet.propertyShouldNotBeOfTypeLong(diag, property);
      expect(result).to.be.true;
    });

    it("Schema BuildingCommon.02.00.00 with class property ABDIdentification:ElementId, rule not suppressed.", async () => {
      createSchema("BuildingCommon", 2);
      const testClass = await mutableSchema.createEntityClass("ABDIdentification");
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("ElementId", PrimitiveType.Long);
      const diag = new BisRules.Diagnostics.PropertyShouldNotBeOfTypeLong(property, [property.class.fullName, property.name]);

      const result = await ruleSuppressionSet.propertyShouldNotBeOfTypeLong(diag, property);
      expect(result).to.be.false;
    });

    it("Schema Markup.01.00.00 with class property MarkupExternalLink:LinkedElementId, rule suppressed.", async () => {
      createSchema("Markup", 1);
      const testClass = await mutableSchema.createEntityClass("MarkupExternalLink");
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("LinkedElementId", PrimitiveType.Long);
      const diag = new BisRules.Diagnostics.PropertyShouldNotBeOfTypeLong(property, [property.class.fullName, property.name]);

      const result = await ruleSuppressionSet.propertyShouldNotBeOfTypeLong(diag, property);
      expect(result).to.be.true;
    });

    it("Schema Markup.02.00.00 with class property MarkupExternalLink:LinkedElementId, rule not suppressed.", async () => {
      createSchema("Markup", 2);
      const testClass = await mutableSchema.createEntityClass("MarkupExternalLink");
      const property = await (testClass as ECClass as MutableClass).createPrimitiveProperty("LinkedElementId", PrimitiveType.Long);
      const diag = new BisRules.Diagnostics.PropertyShouldNotBeOfTypeLong(property, [property.class.fullName, property.name]);

      const result = await ruleSuppressionSet.propertyShouldNotBeOfTypeLong(diag, property);
      expect(result).to.be.false;
    });
  });

  describe("EC-501(CA schema must be referenced) Tests", async () => {
    it("Construction.01.00.00 schema with ECDbMap.DbIndexList applied, rule suppressed", async () => {
      createSchema("Construction", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.true;
    });

    it("Construction.01.00.01 schema with ECDbMap.DbIndexList applied, rule suppressed", async () => {
      createSchema("Construction", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.true;
    });

    it("Construction.01.00.02 schema with ECDbMap.DbIndexList applied, rule not suppressed", async () => {
      createSchema("Construction", 1, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.false;
    });

    it("Construction schema with no ECDbMap.DbIndexList applied, rule not suppressed", async () => {
      createSchema("Construction", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.NotDbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.false;
    });

    it("Construction.01.00.00 schema with CoreCustomAttributes.HiddenProperty applied, rule suppressed", async () => {
      createSchema("Construction", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "CoreCustomAttributes.HiddenProperty" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.true;
    });

    it("Construction.01.00.01 schema with CoreCustomAttributes.HiddenProperty applied, rule suppressed", async () => {
      createSchema("Construction", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "CoreCustomAttributes.HiddenProperty" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.true;
    });

    it("Construction.01.00.02 schema with CoreCustomAttributes.HiddenProperty applied, rule not suppressed", async () => {
      createSchema("Construction", 1, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "CoreCustomAttributes.HiddenProperty" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.false;
    });

    it("RoadRailAlignment.1.00.00 schema with ECDbMap.DbIndexList applied, rule suppressed", async () => {
      createSchema("RoadRailAlignment", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.true;
    });

    it("RoadRailAlignment.2.00.01 schema with ECDbMap.DbIndexList applied, rule suppressed", async () => {
      createSchema("RoadRailAlignment", 2, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.true;
    });

    it("RoadRailAlignment.2.00.02 schema with ECDbMap.DbIndexList applied, rule suppressed", async () => {
      createSchema("RoadRailAlignment", 2, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.false;
    });

    it("RoadRailAlignment.3.XX.XX schema with ECDbMap.DbIndexList applied, rule not suppressed", async () => {
      createSchema("RoadRailAlignment", 3);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.false;
    });

    it("RoadRailAlignment schema with no ECDbMap.DbIndexList applied, rule not suppressed", async () => {
      createSchema("RoadRailAlignment", 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      await (testClass as ECClass as MutableClass).createPrimitiveProperty("TestProperty", PrimitiveType.Long);
      const ca = { className: "ECDbMap.NotDbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeSchemaMustBeReferenced(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.false;
    });
  });

  describe("EC-502(class not found) Tests", async () => {
    it("RoadRailAlignment.1.00.00 schema with ECDbMap.DbIndexList applied, rule suppressed", async () => {
      createSchema("RoadRailAlignment", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeClassNotFound(diag, testClass);
      expect(result).to.be.true;
    });

    it("RoadRailAlignment.2.00.01 schema with ECDbMap.DbIndexList applied, rule suppressed", async () => {
      createSchema("RoadRailAlignment", 2, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeClassNotFound(diag, testClass);
      expect(result).to.be.true;
    });

    it("RoadRailAlignment.2.00.01 schema with ECDbMap.DbIndexList not applied, rule not suppressed", async () => {
      createSchema("RoadRailAlignment", 2, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.NotDbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeClassNotFound(diag, testClass);
      expect(result).to.be.false;
    });

    it("RoadRailAlignment.2.00.02 schema with ECDbMap.DbIndexList applied, rule not suppressed", async () => {
      createSchema("RoadRailAlignment", 2, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeClassNotFound(diag, testClass);
      expect(result).to.be.false;
    });

    it("Construction.1.00.00 schema with ECDbMap.DbIndexList applied, rule suppressed", async () => {
      createSchema("Construction", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeClassNotFound(diag, testClass);
      expect(result).to.be.true;
    });

    it("Construction.1.00.01 schema with ECDbMap.DbIndexList applied, rule suppressed", async () => {
      createSchema("Construction", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeClassNotFound(diag, testClass);
      expect(result).to.be.true;
    });

    it("Construction.2.00.01 schema with ECDbMap.DbIndexList applied, rule not suppressed", async () => {
      createSchema("Construction", 2, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.DbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeClassNotFound(diag, testClass);
      expect(result).to.be.false;
    });

    it("Construction.1.00.01 schema with ECDbMap.DbIndexList not applied, rule not suppressed", async () => {
      createSchema("Construction", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "ECDbMap.NotDbIndexList" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeClassNotFound(diag, testClass);
      expect(result).to.be.false;
    });

    it("Construction.01.00.00 schema with CoreCustomAttributes.HiddenProperty applied, rule suppressed", async () => {
      createSchema("Construction", 1, 0, 0);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "CoreCustomAttributes.HiddenProperty" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.true;
    });

    it("Construction.01.00.01 schema with CoreCustomAttributes.HiddenProperty applied, rule suppressed", async () => {
      createSchema("Construction", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "CoreCustomAttributes.HiddenProperty" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.true;
    });

    it("Construction.01.00.02 schema with CoreCustomAttributes.HiddenProperty applied, rule not suppressed", async () => {
      createSchema("Construction", 1, 0, 2);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "CoreCustomAttributes.HiddenProperty" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.false;
    });

    it("Construction.01.00.01 schema with CoreCustomAttributes.HiddenProperty not applied, rule not suppressed", async () => {
      createSchema("Construction", 1, 0, 1);
      const testClass = await mutableSchema.createEntityClass("TestClass");
      const ca = { className: "CoreCustomAttributes.NotHiddenProperty" };
      (testClass as ECClass as MutableClass).addCustomAttribute(ca);
      const diag = new ECDiagnostics.CustomAttributeClassNotFound(testClass, [testClass.fullName, ca.className]);

      const result = await ruleSuppressionSet.customAttributeSchemaMustBeReferenced(diag, testClass);
      expect(result).to.be.false;
    });

  });
});
