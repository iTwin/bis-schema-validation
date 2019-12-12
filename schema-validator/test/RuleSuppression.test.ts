/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as utils from "./utilities/utils";
import { SchemaDeserializer } from "../src/SchemaDeserializer";
import { SchemaContext, KindOfQuantity, RelationshipClass } from "@bentley/ecschema-metadata";
import * as ruleSuppressionSet from "../src/RuleSuppression";
import { expect } from "chai";
import { IModelHost } from "@bentley/imodeljs-backend";

describe("Rule Suppression Tests", () => {
  const koqAssetsDir = utils.getKOQAssetDir();
  const relAssetsDir = utils.getRelationshipAssetDir();
  const assetDeserializationDir = path.join(utils.getAssetsDir(), "xml-deserialization");

  describe("Kind of Quantity Suppression Tests", async () => {
    let deserializer: SchemaDeserializer;

    beforeEach(() => {
      deserializer = new SchemaDeserializer();
    });

    afterEach(() => {
      IModelHost.shutdown();
    });

    it("koqMustNotUseUnitlessRatios is suppressed for KindOfQuantity named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessFunctional.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await schema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;

      const result = await ruleSuppressionSet.koqMustNotUseUnitlessRatios(koq);
      expect(result).to.be.true;
    });

    it("koqMustNotUseUnitlessRatios is not suppressed for KindOfQuantity named 'ONE' in schemas not named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "BadNameSchema.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await schema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;

      const result = await ruleSuppressionSet.koqMustNotUseUnitlessRatios(koq);
      expect(result).to.be.false;
    });

    it("koqMustNotUseUnitlessRatios is not suppressed for KindOfQuantity not named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessPhysical.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await schema.getItem<KindOfQuantity>("THREE") as KindOfQuantity;

      const result = await ruleSuppressionSet.koqMustNotUseUnitlessRatios(koq);
      expect(result).to.be.false;
    });

    it("koqMustUseSIUnitForPersistenceUnit is suppressed for KindOfQuantity named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessFunctional.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await schema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;

      const result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(koq);
      expect(result).to.be.true;
    });

    it("koqMustUseSIUnitForPersistenceUnit is not suppressed for KindOfQuantity named 'ONE' in schemas not named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "BadNameSchema.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await schema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;

      const result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(koq);
      expect(result).to.be.false;
    });

    it("koqMustUseSIUnitForPersistenceUnit is not suppressed for KindOfQuantity not named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessPhysical.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await schema.getItem<KindOfQuantity>("THREE") as KindOfQuantity;

      const result = await ruleSuppressionSet.koqMustUseSIUnitForPersistenceUnit(koq);
      expect(result).to.be.false;
    });

    it("koqDuplicatePresentationFormat is suppressed for KindOfQuantity named 'ONE' in schemas named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessFunctional.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await schema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;

      const result = await ruleSuppressionSet.koqDuplicatePresentationFormat(koq);
      expect(result).to.be.true;
    });

    it("koqDuplicatePresentationFormat is not suppressed for KindOfQuantity named 'ONE' in schemas not named ProcessFunctional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "BadNameSchema.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await schema.getItem<KindOfQuantity>("ONE") as KindOfQuantity;

      const result = await ruleSuppressionSet.koqDuplicatePresentationFormat(koq);
      expect(result).to.be.false;
    });

    it("koqDuplicatePresentationFormat is not suppressed for KindOfQuantity not named 'ONE' in schemas named ProcessFuntional or ProcessPhysical.", async () => {
      const schemaPath = path.join(koqAssetsDir, "ProcessPhysical.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const koq = await schema.getItem<KindOfQuantity>("THREE") as KindOfQuantity;

      const result = await ruleSuppressionSet.koqDuplicatePresentationFormat(koq);
      expect(result).to.be.false;
    });
  });

  describe("Relationship Class Suppression Tests", async () => {
    let deserializer: SchemaDeserializer;

    beforeEach(() => {
      deserializer = new SchemaDeserializer();
    });

    afterEach(() => {
      IModelHost.shutdown();
    });

    it("embeddingRelationshipsMustNotHaveHasInName is suppressed for schema named ProcessFunctional.", async () => {
      const schemaPath = path.join(relAssetsDir, "ProcessFunctional.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const relationshipClass = await schema.getItem<RelationshipClass>("hasString") as RelationshipClass;

      const result = await ruleSuppressionSet.embeddingRelationshipsMustNotHaveHasInName(relationshipClass);
      expect(result).to.be.true;
    });

    it("embeddingRelationshipsMustNotHaveHasInName is not suppressed for schema not named ProcessFunctional, ProcessPhysical, or starting with SP3D.", async () => {
      const schemaPath = path.join(relAssetsDir, "BadNameSchema.ecschema.xml");

      const schema = await deserializer.deserializeXmlFile(schemaPath, new SchemaContext(), [assetDeserializationDir]);
      const relationshipClass = await schema.getItem<RelationshipClass>("hasString") as RelationshipClass;

      const result = await ruleSuppressionSet.embeddingRelationshipsMustNotHaveHasInName(relationshipClass);
      expect(result).to.be.false;
    });

  });
});
