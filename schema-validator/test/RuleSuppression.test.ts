/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as utils from "./utilities/utils";
import { SchemaDeserializer } from "../src/SchemaDeserializer";
import { SchemaContext, KindOfQuantity, RelationshipClass, Schema, SchemaKey, ECVersion, ECClass, PrimitiveType} from "@bentley/ecschema-metadata";
import { MutableClass } from "@bentley/ecschema-metadata/lib/Metadata/Class";
import { MutableSchema } from "@bentley/ecschema-metadata/lib/Metadata/Schema";
import * as ruleSuppressionSet from "../src/RuleSuppression";
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

    afterEach(() => {
      IModelHost.shutdown();
    });

    it("koqMustNotUseUnitlessRatios is suppressed for KindOfQuantity named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessFunctional.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await testSchema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;
      const diag = new BisRules.Diagnostics.KOQMustNotUseUnitlessRatios(koq, [koq.fullName]);

      const result = await ruleSuppressionSet.koqMustNotUseUnitlessRatios(diag, koq);
      expect(result).to.be.true;
    });

    it("koqMustNotUseUnitlessRatios is not suppressed for KindOfQuantity named 'ONE' in schemas not named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "BadNameSchema.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await testSchema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;
      const diag = new BisRules.Diagnostics.KOQMustNotUseUnitlessRatios(koq, [koq.fullName]);

      const result = await ruleSuppressionSet.koqMustNotUseUnitlessRatios(diag, koq);
      expect(result).to.be.false;
    });

    it("koqMustNotUseUnitlessRatios is not suppressed for KindOfQuantity not named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessPhysical.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await testSchema.getItem<KindOfQuantity>("THREE") as KindOfQuantity;
      const diag = new BisRules.Diagnostics.KOQMustNotUseUnitlessRatios(koq, [koq.fullName]);

      const result = await ruleSuppressionSet.koqMustNotUseUnitlessRatios(diag, koq);
      expect(result).to.be.false;
    });

    it("koqMustUseSIUnitForPersistenceUnit is suppressed for KindOfQuantity named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessFunctional.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await testSchema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;
      const diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "TestUnitSystem"]);

      const result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result).to.be.true;
    });

    it("koqMustUseSIUnitForPersistenceUnit is not suppressed for KindOfQuantity named 'ONE' in schemas not named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "BadNameSchema.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await testSchema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;
      const diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "TestUnitSystem"]);

      const result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result).to.be.false;
    });

    it("koqMustUseSIUnitForPersistenceUnit is not suppressed for KindOfQuantity not named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessPhysical.ecschema.xml");
      const testSchema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await testSchema.getItem<KindOfQuantity>("THREE") as KindOfQuantity;
      const diag = new BisRules.Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, "TestUnitSystem"]);

      const result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(diag, koq);
      expect(result).to.be.false;
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

    afterEach(() => {
      IModelHost.shutdown();
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

  describe("BIS-007(Schema class display label must be unique) Tests", async () => {
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
      createSchema("RoadRailPhysical", 2);
      const diag = new BisRules.Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, ["ClassA", "ClassB", "TestLabel"]);

      const result = await ruleSuppressionSet.schemaClassDisplayLabelMustBeUnique(diag, schema);
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
});
