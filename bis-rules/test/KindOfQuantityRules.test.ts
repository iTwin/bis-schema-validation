/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as Rules from "../../bis-rules/src/BisRules";
import { SchemaContext, Schema, KindOfQuantity } from "@bentley/ecschema-metadata";
import { createSchemaJsonWithItems } from "./utils/DeserializationHelpers";
import { TestSchemaLocater } from "./utils/TestSchemaLocater";
import { IDiagnostic, DiagnosticCategory, DiagnosticType } from "@bentley/ecschema-metadata/lib/Validation/Diagnostic";

function createSchemaJson(koq: any) {
  return createSchemaJsonWithItems({
    TestKindOfQuantity: {
      schemaItemType: "KindOfQuantity",
      ...koq,
    },
  }, {
      references: [
        {
          name: "Formats",
          version: "1.0.0",
        },
      ],
    });
}

async function iterableToArray(asyncIterable: AsyncIterable<IDiagnostic<KindOfQuantity, any []>>): Promise<IDiagnostic<KindOfQuantity, any []> []> {
  const array: IDiagnostic<KindOfQuantity, any []> [] = [];
  for await (const item of asyncIterable) {
    array.push(item);
  }
  return array;
}

describe("KindOfQuantity Rule Tests", () => {
  let context: SchemaContext;
  let schema: Schema;

  const baseJson = {
    schemaItemType: "KindOfQuantity",
    name: "TestKindOfQuantity",
    label: "SomeDisplayLabel",
    description: "A really long description...",
  };

  beforeEach(() => {
    schema = new Schema(new SchemaContext(), "TestSchema", 1, 2, 3);
    context = new SchemaContext();
    context.addLocater(new TestSchemaLocater());
  });

  describe("KOQMustNotUseUnitlessRatios tests", () => {
    it("KindOfQuantity has 'PERCENTAGE' phenomenon, rule violated.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Formats.PERCENT",
        presentationUnits: [
          "Formats.PERCENT",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem<KindOfQuantity>(koqProps.name) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqMustNotUseUnitlessRatios(testKoq));
      expect(result.length).to.equal(1);
      expect(result[0].ecDefinition).to.equal(testKoq);
      expect(result[0].messageArgs).to.eql([testKoq.fullName]);
      expect(result[0].category).to.equal(DiagnosticCategory.Error);
      expect(result[0].code).to.equal(Rules.DiagnosticCodes.KOQMustNotUseUnitlessRatios);
      expect(result[0].diagnosticType).to.equal(DiagnosticType.SchemaItem);
    });

    it("KindOfQuantity does not have 'PERCENTAGE' phenomenon, rule passes.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Formats.IN",
        presentationUnits: [
          "Formats.IN",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem<KindOfQuantity>(koqProps.name) as KindOfQuantity;
      const result = await iterableToArray(Rules.koqMustNotUseUnitlessRatios(testKoq));

      expect(result.length).to.equal(0, "Rule should have passed.");
    });
  });

  describe("KOQMustUseSIUnitForPersistenceUnit tests", () => {
    it("KindOfQuantity does not have an 'SI' persistence unit, rule violated.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Formats.IN",
        presentationUnits: [
          "Formats.IN",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem<KindOfQuantity>(koqProps.name) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));
      expect(result.length).to.equal(1);
      expect(result[0].ecDefinition).to.equal(testKoq);
      expect(result[0].messageArgs).to.eql([testKoq.fullName, "Formats.USCustom"]);
      expect(result[0].category).to.equal(DiagnosticCategory.Error);
      expect(result[0].code).to.equal(Rules.DiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit);
      expect(result[0].diagnosticType).to.equal(DiagnosticType.SchemaItem);
    });

    it("KindOfQuantity does have an 'SI' persistence unit, rule passes.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Formats.M",
        presentationUnits: [
          "Formats.IN",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem<KindOfQuantity>(koqProps.name) as KindOfQuantity;
      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));

      expect(result.length).to.equal(0, "Rule should have passed.");
    });
  });

  describe("KOQDuplicatePresentationFormat tests", () => {
    it("KindOfQuantity has duplicate presentation formats, rule violated.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Formats.IN",
        presentationUnits: [
          "Formats.IN",
          "Formats.IN",
          "Formats.FT",
          "Formats.FT",
          "Formats.M",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem<KindOfQuantity>(koqProps.name) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqDuplicatePresentationFormat(testKoq));

      expect(result.length).to.equal(2);
      expect(result[0].ecDefinition).to.equal(testKoq);
      expect(result[0].messageArgs).to.eql([testKoq.fullName, "Formats.IN"]);
      expect(result[0].category).to.equal(DiagnosticCategory.Error);
      expect(result[0].code).to.equal(Rules.DiagnosticCodes.KOQDuplicatePresentationFormat);
      expect(result[0].diagnosticType).to.equal(DiagnosticType.SchemaItem);
      expect(result[1].ecDefinition).to.equal(testKoq);
      expect(result[1].messageArgs).to.eql([testKoq.fullName, "Formats.FT"]);
      expect(result[1].category).to.equal(DiagnosticCategory.Error);
      expect(result[1].code).to.equal(Rules.DiagnosticCodes.KOQDuplicatePresentationFormat);
      expect(result[1].diagnosticType).to.equal(DiagnosticType.SchemaItem);
    });

    it("KindOfQuantity has no duplicate presentation formats, rule passes.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Formats.IN",
        presentationUnits: [
          "Formats.IN",
          "Formats.FT",
          "Formats.M",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem<KindOfQuantity>(koqProps.name) as KindOfQuantity;
      const result = await iterableToArray(Rules.koqDuplicatePresentationFormat(testKoq));

      expect(result.length).to.equal(0);
    });
  });
});
