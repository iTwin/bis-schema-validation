/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import sinon = require("sinon");
import { expect } from "chai";
import * as Rules from "../BisRules";
import { RelationshipClass, Schema, SchemaContext } from "@itwin/ecschema-metadata";
import { DiagnosticCategory, DiagnosticType } from "@itwin/ecschema-editing";
import { createSchemaJsonWithItems } from "./utils/DeserializationHelpers";
import { BisTestHelper } from "./utils/BisTestHelper";

describe("RelationshipClass Rule Tests", () => {
  async function getTestSchema(items: any, withBisReference: boolean = true): Promise<Schema> {
    let context: SchemaContext | undefined;
    if (!context) {
      context = withBisReference ? await BisTestHelper.getNewContext() : new SchemaContext();
    }
    return Schema.fromJson(createSchemaJson(items, withBisReference), context);
  }

  function createSchemaJson(items: any, withBisReference: boolean) {
    const refJson = !withBisReference ? {} : {
      references: [
        {
          name: "BisCore",
          version: "1.0.0",
        },
        {
          name: "CoreCustomAttributes",
          version: "01.00.01",
        },
      ],
    };
    return createSchemaJsonWithItems(items, refJson);
  }

  beforeEach(async () => {
  });

  afterEach(() => {
    sinon.restore();

  });

  describe("RelationshipClassMustNotUseHoldingStrength tests", () => {
    it("RelationshipClass strength is holding, rule violated.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "holding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipClassMustNotUseHoldingStrength(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql([relationship.fullName]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.RelationshipClassMustNotUseHoldingStrength);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("RelationshipClass strength is not holding, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipClassMustNotUseHoldingStrength(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("RelationshipSourceMultiplicityUpperBoundRestriction tests", () => {
    it("RelationshipClass source upper bound greater than 1, embedding, forward, rule violated.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..2)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipSourceMultiplicityUpperBoundRestriction(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql([relationship.fullName]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.RelationshipSourceMultiplicityUpperBoundRestriction);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("RelationshipClass strength is not embedding, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "referencing",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..2)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipSourceMultiplicityUpperBoundRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("RelationshipClass strength direction is backward, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(1..2)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipSourceMultiplicityUpperBoundRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("RelationshipClass source multiplicity upper bound is 1, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipSourceMultiplicityUpperBoundRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("RelationshipTargetMultiplicityUpperBoundRestriction tests", () => {
    it("RelationshipClass target upper bound greater than 1, embedding, backward, rule violated.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipTargetMultiplicityUpperBoundRestriction(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql([relationship.fullName]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.RelationshipTargetMultiplicityUpperBoundRestriction);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("RelationshipClass strength is not embedding, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "referencing",
          strengthDirection: "backward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipTargetMultiplicityUpperBoundRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("RelationshipClass strength direction is backward, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipTargetMultiplicityUpperBoundRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("RelationshipClass target multiplicity upper bound is 1, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
          target: {
            multiplicity: "(0..1)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestEntity",
            ],
          },
        },
        TestEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipTargetMultiplicityUpperBoundRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("RelationshipElementAspectContraintRestriction tests", () => {
    it("RelationshipClass has source ElementAspect constraint, forward direction, no base class, rule violated.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "holding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestSourceEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestTargetEntity",
            ],
          },
        },
        TestSourceEntity: {
          schemaItemType: "EntityClass",
        },
        TestTargetEntity: {
          baseClass: "BisCore.ElementAspect",
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipElementAspectContraintRestriction(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql([relationship.fullName, "Target"]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.RelationshipElementAspectContraintRestriction);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("RelationshipClass has source ElementAspect constraint, forward direction, ElementOwnsMultiAspects base class, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "holding",
          strengthDirection: "forward",
          baseClass: "BisCore.ElementOwnsMultiAspects",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestSourceEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestTargetEntity",
            ],
          },
        },
        TestSourceEntity: {
          schemaItemType: "EntityClass",
        },
        TestTargetEntity: {
          baseClass: "BisCore.ElementAspect",
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipElementAspectContraintRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("RelationshipClass has source ElementAspect constraint, forward direction, ElementOwnsUniqueAspect base class, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "holding",
          strengthDirection: "forward",
          baseClass: "BisCore.ElementOwnsUniqueAspect",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestSourceEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestTargetEntity",
            ],
          },
        },
        TestSourceEntity: {
          schemaItemType: "EntityClass",
        },
        TestTargetEntity: {
          baseClass: "BisCore.ElementAspect",
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipElementAspectContraintRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("RelationshipClass has no constraints, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "holding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestSourceEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
            ],
          },
        },
        TestSourceEntity: {
          baseClass: "BisCore.ElementAspect",
          schemaItemType: "EntityClass",
        },
        TestTargetEntity: {
          baseClass: "BisCore.ElementAspect",
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipElementAspectContraintRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("RelationshipClass has source ElementAspect constraint, backward direction, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "holding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestSourceEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestTargetEntity",
            ],
          },
        },
        TestSourceEntity: {
          schemaItemType: "EntityClass",
        },
        TestTargetEntity: {
          baseClass: "BisCore.ElementAspect",
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipElementAspectContraintRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("RelationshipClass has target ElementAspect constraint, backward direction, no base class, rule violated.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "holding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestSourceEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestTargetEntity",
            ],
          },
        },
        TestSourceEntity: {
          baseClass: "BisCore.ElementAspect",
          schemaItemType: "EntityClass",
        },
        TestTargetEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipElementAspectContraintRestriction(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql([relationship.fullName, "Source"]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.RelationshipElementAspectContraintRestriction);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("RelationshipClass has target ElementAspect constraint, forward direction, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "holding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.TestSourceEntity",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
              "TestSchema.TestTargetEntity",
            ],
          },
        },
        TestSourceEntity: {
          baseClass: "BisCore.ElementAspect",
          schemaItemType: "EntityClass",
        },
        TestTargetEntity: {
          schemaItemType: "EntityClass",
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipElementAspectContraintRestriction(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("EmbeddingRelationshipsMustNotHaveHasInName tests", () => {
    it("Embedding RelationshipClass with 'Has' in name, rule violated.", async () => {
      const schemaJson = {
        TestHasRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
            ],
          },
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestHasRelationship")) as RelationshipClass;

      const result = Rules.embeddingRelationshipsMustNotHaveHasInName(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql([relationship.fullName]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.EmbeddingRelationshipsMustNotHaveHasInName);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Embedding RelationshipClass with 'has' (lowercase) in name, rule passes.", async () => {
      const schemaJson = {
        TestPhaseRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
            ],
          },
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestPhaseRelationship")) as RelationshipClass;

      const result = Rules.embeddingRelationshipsMustNotHaveHasInName(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Embedding RelationshipClass with 'hAs' in name, rule passes.", async () => {
      const schemaJson = {
        TesthAsRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
            ],
          },
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TesthAsRelationship")) as RelationshipClass;

      const result = Rules.embeddingRelationshipsMustNotHaveHasInName(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Embedding RelationshipClass with '_hAs_' in name, rule violated.", async () => {
      const schemaJson = {
        Test_hAs_Relationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
            ],
          },
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("Test_hAs_Relationship")) as RelationshipClass;

      const result = Rules.embeddingRelationshipsMustNotHaveHasInName(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result!) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql([relationship.fullName]);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.EmbeddingRelationshipsMustNotHaveHasInName);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }
      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Holding RelationshipClass with 'Has' in name, rule passes.", async () => {
      const schemaJson = {
        TestHasRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "holding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
            ],
          },
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestHasRelationship")) as RelationshipClass;

      const result = Rules.embeddingRelationshipsMustNotHaveHasInName(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Referencing RelationshipClass with 'Has' in name, rule passes.", async () => {
      const schemaJson = {
        TestHasRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "referencing",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            constraintClasses: [
            ],
          },
        },
      };
      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestHasRelationship")) as RelationshipClass;

      const result = Rules.embeddingRelationshipsMustNotHaveHasInName(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });

  describe("RelationshipConstraintShouldNotUseDeprecatedConstraintClasses", () => {
    it("Relationship constraint has no deprecated constraint classes (ignore deprecated property), rule passed", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [
              "TestSchema.EntityA1",
              "TestSchema.EntityA2",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [
              "TestSchema.EntityB1",
              "TestSchema.EntityB2",
            ],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
        EntityA1: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityA",
        },
        EntityA2: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityA",
        },
        EntityB1: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityB",
        },
        EntityB2: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityB",
          properties: [
            {
              customAttributes: [
                { className: "CoreCustomAttributes.Deprecated" },
              ],
              type: "PrimitiveProperty",
              typeName: "string",
              name: "TestProperty",
            },
          ],
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;
      const result = Rules.relationshipConstraintShouldNotUseDeprecatedConstraintClass(relationship);
      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Relationship constraint has deprecated constraint classes, warning issued, rule passed", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [
              "TestSchema.EntityA",
              "TestSchema.EntityA1",
              "TestSchema.EntityA2",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [
              "TestSchema.EntityB1",
              "TestSchema.EntityB2",
            ],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityB: {
          schemaItemType: "EntityClass",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityA1: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityA",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityA2: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityA",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityB1: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityB",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityB2: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityB",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipConstraintShouldNotUseDeprecatedConstraintClass(relationship);
      let index = 0;
      for await (const diagnostic of result) {
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        if (index === 0)
          expect(diagnostic!.messageArgs).to.eql(["Source", "TestSchema.TestRelationship", "TestSchema.EntityA"]);
        else if (index === 1)
          expect(diagnostic!.messageArgs).to.eql(["Source", "TestSchema.TestRelationship", "TestSchema.EntityA1"]);
        else if (index === 2)
          expect(diagnostic!.messageArgs).to.eql(["Source", "TestSchema.TestRelationship", "TestSchema.EntityA2"]);
        else if (index === 3)
          expect(diagnostic!.messageArgs).to.eql(["Target", "TestSchema.TestRelationship", "TestSchema.EntityB1"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.RelationshipConstraintShouldNotUseDeprecatedConstraintClass);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);

        ++index;
      }

      expect(index === 4, "There should be 4 warnings about deprecated constraint class").to.be.true;
    });
  });

  describe("RelationshipConstraintShouldNotUseDeprecatedAbstractConstraint", () => {
    it("Relation Constraints does not contains deprecated abstract constraint, rule passed", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.EntityA",
              "TestSchema.EntityA1",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
        EntityA1: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityA",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipConstraintShouldNotUseDeprecatedAbstractConstraint(relationship);
      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Relation Constraints contains abstract constraint that is deprecated, warning issued, rule passed", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            constraintClasses: [
              "TestSchema.EntityA",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityB: {
          schemaItemType: "EntityClass",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipConstraintShouldNotUseDeprecatedAbstractConstraint(relationship);
      let index = 0;
      for await (const diagnostic of result) {
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        if (index === 0)
          expect(diagnostic!.messageArgs).to.eql(["Source", "TestSchema.TestRelationship", "TestSchema.EntityA"]);
        else if (index === 1)
          expect(diagnostic!.messageArgs).to.eql(["Target", "TestSchema.TestRelationship", "TestSchema.EntityB"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.RelationshipConstraintShouldNotUseDeperecatedAbstractConstraint);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);

        ++index;
      }

      expect(index === 2, "There should be 2 warnings about deprecated abstract constraint").to.be.true;
    });
  });

  describe("RelationshipConstraintShouldNotUseConstraintClassesWithDeprecatedBase", () => {
    it("Relationship Constraints contain constraint classes directly or indirectly derives from deprecated base, warning issued, rule passed", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [
              "TestSchema.EntityA1",
              "TestSchema.EntityA2",
              "TestSchema.EntityA3",
            ],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [
              "TestSchema.EntityB1",
              "TestSchema.EntityB2",
            ],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityB: {
          schemaItemType: "EntityClass",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityA1: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityA",
        },
        EntityA2: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityA1",
        },
        EntityA3: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityA2",
        },
        EntityB1: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityB",
        },
        EntityB2: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityB",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipConstraintShouldNotUseConstraintClassWithDeprecatedBase(relationship);
      let index = 0;
      for await (const diagnostic of result) {
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        if (index === 0)
          expect(diagnostic!.messageArgs).to.eql(["Source", "TestSchema.TestRelationship", "TestSchema.EntityA1", "TestSchema.EntityA", "TestSchema.EntityA"]);
        else if (index === 1)
          expect(diagnostic!.messageArgs).to.eql(["Source", "TestSchema.TestRelationship", "TestSchema.EntityA2", "TestSchema.EntityA1", "TestSchema.EntityA"]);
        else if (index === 2)
          expect(diagnostic!.messageArgs).to.eql(["Source", "TestSchema.TestRelationship", "TestSchema.EntityA3", "TestSchema.EntityA2", "TestSchema.EntityA"]);
        else
          expect(diagnostic!.messageArgs).to.eql(["Target", "TestSchema.TestRelationship", "TestSchema.EntityB1", "TestSchema.EntityB", "TestSchema.EntityB"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.RelationshipConstraintShouldNotUseConstraintClassWithDeprecatedBase);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);

        ++index;
      }

      expect(index === 4, "There should be 3 warnings about constraint class derived from deprecated base").to.be.true;
    });
  });

  describe("RelationshipConstraintShouldNotUseAbstractConstraintsWithDeprecatedBase", () => {
    it("Relationship Constraint contains abstract constraint with deprecated base", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "owns",
            abstractConstraint: "TestSchema.EntityA1",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "is owned by",
            abstractConstraint: "TestSchema.EntityB2",
            constraintClasses: [],
          },
        },

        DeprecatedMixin: {
          schemaItemType: "Mixin",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
          appliesTo: "TestSchema.EntityA",
        },
        IndirectDeprecatedMixin: {
          schemaItemType: "Mixin",
          baseClass: "TestSchema.DeprecatedMixin",
          appliesTo: "TestSchema.EntityA",
        },

        EntityA: {
          schemaItemType: "EntityClass",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityB: {
          schemaItemType: "EntityClass",
          customAttributes: [
            { className: "CoreCustomAttributes.Deprecated" },
          ],
        },
        EntityA1: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityA",
          mixins: ["TestSchema.IndirectDeprecatedMixin"],
        },
        EntityB1: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityB",
        },
        EntityB2: {
          schemaItemType: "EntityClass",
          baseClass: "TestSchema.EntityB1",
          mixins: ["TestSchema.DeprecatedMixin"],
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.relationshipConstraintShouldNotUseAbstractConstraintWithDeprecatedBase(relationship);
      let index = 0;
      for await (const diagnostic of result) {
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        if (index === 0)
          expect(diagnostic!.messageArgs).to.eql(["Source", "TestSchema.TestRelationship", "TestSchema.EntityA1", "TestSchema.EntityA", "TestSchema.EntityA"]);
        else if (index === 1)
          expect(diagnostic!.messageArgs).to.eql(["Source", "TestSchema.TestRelationship", "TestSchema.EntityA1", "TestSchema.IndirectDeprecatedMixin", "TestSchema.DeprecatedMixin"]);
        else if (index === 2)
          expect(diagnostic!.messageArgs).to.eql(["Target", "TestSchema.TestRelationship", "TestSchema.EntityB2", "TestSchema.EntityB1", "TestSchema.EntityB"]);
        else
          expect(diagnostic!.messageArgs).to.eql(["Target", "TestSchema.TestRelationship", "TestSchema.EntityB2", "TestSchema.DeprecatedMixin", "TestSchema.DeprecatedMixin"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.RelationshipConstraintShouldNotUseAbstractConstraintWithDeprecatedBase);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Warning);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);

        ++index;
      }

      expect(index === 4, "There should be 4 warnings about abstract constraint class derived from deprecated base").to.be.true;
    });
  });

  describe("NoAdditionalLinkTableRelationships", () => {
    it("Relationship has properties, does not derive from BisCore relationship, rule violated.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "references",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "references",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
          properties: [
            {
              type: "PrimitiveProperty",
              typeName: "string",
              name: "TestProperty",
            },
          ],
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.noAdditionalLinkTableRelationships(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql(["TestSchema.TestRelationship"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.NoAdditionalLinkTableRelationships);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }

      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Relationship has properties, derives from Bis.ElementRefersToElements, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          baseClass: "BisCore.ElementRefersToElements",
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "references",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "references",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
          properties: [
            {
              type: "PrimitiveProperty",
              typeName: "string",
              name: "TestProperty",
            },
          ],
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.noAdditionalLinkTableRelationships(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Relationship has properties, derives from Bis.ElementDrivesElement, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          baseClass: "BisCore.ElementDrivesElement",
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "forward",
          source: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "references",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(1..1)",
            polymorphic: true,
            roleLabel: "references",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
          properties: [
            {
              type: "PrimitiveProperty",
              typeName: "string",
              name: "TestProperty",
            },
          ],
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.noAdditionalLinkTableRelationships(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Relationship with both constraints with zero to many multiplicity, does not derive from BisCore relationship, rule violated.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "source label",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "target label",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.noAdditionalLinkTableRelationships(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql(["TestSchema.TestRelationship"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.NoAdditionalLinkTableRelationships);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }

      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Relationship with both constraints with zero to many multiplicity, derives from BisCore.ElementRefersToElements, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          baseClass: "BisCore.ElementRefersToElements",
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "source label",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "target label",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.noAdditionalLinkTableRelationships(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Relationship with both constraints with zero to many multiplicity, derives from BisCore.ElementDrivesElement, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          baseClass: "BisCore.ElementDrivesElement",
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "source label",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(0..*)",
            polymorphic: true,
            roleLabel: "target label",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.noAdditionalLinkTableRelationships(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Relationship with both constraints with one to many multiplicity, does not derive from BisCore relationship, rule violated.", async () => {
      const schemaJson = {
        TestRelationship: {
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(1..*)",
            polymorphic: true,
            roleLabel: "source label",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(1..*)",
            polymorphic: true,
            roleLabel: "target label",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.noAdditionalLinkTableRelationships(relationship);

      let resultHasEntries = false;
      for await (const diagnostic of result) {
        resultHasEntries = true;
        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic!.ecDefinition).to.equal(relationship);
        expect(diagnostic!.messageArgs).to.eql(["TestSchema.TestRelationship"]);
        expect(diagnostic!.code).to.equal(Rules.DiagnosticCodes.NoAdditionalLinkTableRelationships);
        expect(diagnostic!.category).to.equal(DiagnosticCategory.Error);
        expect(diagnostic!.diagnosticType).to.equal(DiagnosticType.SchemaItem);
      }

      expect(resultHasEntries, "expected rule to return an AsyncIterable with entries.").to.be.true;
    });

    it("Relationship with both constraints with one to many multiplicity, derives from BisCore.ElementRefersToElements, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          baseClass: "BisCore.ElementRefersToElements",
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(1..*)",
            polymorphic: true,
            roleLabel: "source label",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(1..*)",
            polymorphic: true,
            roleLabel: "target label",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.noAdditionalLinkTableRelationships(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });

    it("Relationship with both constraints with one to many multiplicity, derives from BisCore.ElementDrivesElement, rule passes.", async () => {
      const schemaJson = {
        TestRelationship: {
          baseClass: "BisCore.ElementDrivesElement",
          schemaItemType: "RelationshipClass",
          strength: "embedding",
          strengthDirection: "backward",
          source: {
            multiplicity: "(1..*)",
            polymorphic: true,
            roleLabel: "source label",
            abstractConstraint: "TestSchema.EntityA",
            constraintClasses: [],
          },
          target: {
            multiplicity: "(1..*)",
            polymorphic: true,
            roleLabel: "target label",
            abstractConstraint: "TestSchema.EntityB",
            constraintClasses: [],
          },
        },
        EntityA: {
          schemaItemType: "EntityClass",
        },
        EntityB: {
          schemaItemType: "EntityClass",
        },
      };

      const schema = await getTestSchema(schemaJson);
      const relationship = (await schema.getItem("TestRelationship")) as RelationshipClass;

      const result = Rules.noAdditionalLinkTableRelationships(relationship);

      for await (const _diagnostic of result!) {
        expect(false, "Rule should have passed").to.be.true;
      }
    });
  });
});
