/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as Rules from "../BisRules";
import { KindOfQuantity, Schema, SchemaContext } from "@itwin/ecschema-metadata";
import { createSchemaJsonWithItems } from "./utils/DeserializationHelpers";
import { TestSchemaLocater } from "./utils/TestSchemaLocater";
import { DiagnosticCategory, DiagnosticType, IDiagnostic } from "@itwin/ecschema-editing";

function createSchemaJson(koq: any) {
  return createSchemaJsonWithItems({
    TestKindOfQuantity: {
      schemaItemType: "KindOfQuantity",
      ...koq,
    },
  }, {
    references: [
      {
        name: "Units",
        version: "1.0.0",
      },
      {
        name: "Formats",
        version: "1.0.0",
      },
    ],
  });
}

async function iterableToArray(asyncIterable: AsyncIterable<IDiagnostic<KindOfQuantity, any[]>>): Promise<IDiagnostic<KindOfQuantity, any[]>[]> {
  const array: IDiagnostic<KindOfQuantity, any[]>[] = [];
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
    schema = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 2, 3);
    context = new SchemaContext();
    context.addLocater(new TestSchemaLocater());
  });

  describe("KOQMustUseSIUnitForPersistenceUnit tests", () => {
    it("KindOfQuantity does not have an 'SI' persistence unit, rule violated.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.IN",
        presentationUnits: [
          "Formats.DefaultReal",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));
      expect(result.length).to.equal(1);
      expect(result[0].ecDefinition).to.equal(testKoq);
      expect(result[0].messageArgs).to.eql([testKoq.fullName, "Units.USCustom"]);
      expect(result[0].category).to.equal(DiagnosticCategory.Error);
      expect(result[0].code).to.equal(Rules.DiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit);
      expect(result[0].diagnosticType).to.equal(DiagnosticType.SchemaItem);
    });

    it("KindOfQuantity uses 'COEFFICIENT' as storage unit, rule passes.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.COEFFICIENT",
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));
      expect(result.length).to.equal(0, "Rule should have passed because we made a special case for COEFFICIENT unit");
    });

    it("KindOfQuantity uses 'ONE' as storage unit, rule fails.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.ONE",
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));
      expect(result.length).to.equal(1);
      expect(result[0].ecDefinition).to.equal(testKoq, "KindOfQuantity Definition not as expected");
      expect(result[0].messageArgs).to.eql([testKoq.fullName, (await (await testKoq.persistenceUnit)?.unitSystem)?.fullName], "Message arguments not as expected");
      expect(result[0].category).to.equal(DiagnosticCategory.Error, "Category not correct");
      expect(result[0].code).to.equal(Rules.DiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit, "Diagnostic code not correct");
      expect(result[0].diagnosticType).to.equal(DiagnosticType.SchemaItem, "Diagnostic type not correct");
    });
    it("KindOfQuantity uses 'DECIMAL_PERCENT' as storage unit, rule passes.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.DECIMAL_PERCENT",
        presentationUnits: [
          "Formats.DefaultReal",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));
      expect(result.length).to.equal(0, "Rule should have passed because we made a special case for unitless ratios");
    });

    it("KindOfQuantity uses 'PERCENT' as storage unit, rule fails.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.PERCENT",
        presentationUnits: [
          "Formats.DefaultReal",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));
      expect(result.length).to.equal(1);
      expect(result[0].ecDefinition).to.equal(testKoq, "KindOfQuantity Definition not as expected");
      expect(result[0].messageArgs).to.eql([testKoq.fullName, (await (await testKoq.persistenceUnit)?.unitSystem)?.fullName], "Message arguments not as expected");
      expect(result[0].category).to.equal(DiagnosticCategory.Error, "Category not correct");
      expect(result[0].code).to.equal(Rules.DiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit, "Diagnostic code not correct");
      expect(result[0].diagnosticType).to.equal(DiagnosticType.SchemaItem, "Diagnostic type not correct");
    });

    it("KindOfQuantity uses 'MONETARY_UNIT' as storage unit, rule fails.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.MONETARY_UNIT",
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));
      expect(result.length).to.equal(1);
      expect(result[0].ecDefinition).to.equal(testKoq, "KindOfQuantity definition not as expected");
      expect(result[0].messageArgs).to.eql([testKoq.fullName, (await (await testKoq.persistenceUnit)?.unitSystem)?.fullName], "Message argument not as expected");
      expect(result[0].category).to.equal(DiagnosticCategory.Error, "Category not correct");
      expect(result[0].code).to.equal(Rules.DiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit, "Code not correct");
      expect(result[0].diagnosticType).to.equal(DiagnosticType.SchemaItem, "Type not correct");
    });

    it("KindOfQuantity uses 'US_DOLLAR' as storage unit, rule fails.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.US_DOLLAR",
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));
      expect(result.length).to.equal(1);
      expect(result[0].ecDefinition).to.equal(testKoq, "KindOfQuantity definition not as expected");
      expect(result[0].messageArgs).to.eql([testKoq.fullName, (await (await testKoq.persistenceUnit)?.unitSystem)?.fullName], "Message argument not as expected");
      expect(result[0].category).to.equal(DiagnosticCategory.Error, "Category not correct");
      expect(result[0].code).to.equal(Rules.DiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit, "Code not correct");
      expect(result[0].diagnosticType).to.equal(DiagnosticType.SchemaItem, "Type not correct");
    });

    it("KindOfQuantity does have an 'SI' persistence unit, rule passes.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.M",
        presentationUnits: [
          "Formats.DefaultReal",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;
      const result = await iterableToArray(Rules.koqMustUseSIUnitForPersistenceUnit(testKoq));

      expect(result.length).to.equal(0, "Rule should have passed.");
    });
  });

  describe("KOQDuplicatePresentationFormat tests", () => {
    it("KindOfQuantity has duplicate presentation formats, rule violated.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.IN",
        presentationUnits: [
          "Formats.DefaultReal",
          "Formats.SingleUnitFormat",
          "Formats.SingleUnitFormat",
          "Formats.DoubleUnitFormat",
          "Formats.DoubleUnitFormat",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      const result = await iterableToArray(Rules.koqDuplicatePresentationFormat(testKoq));

      expect(result.length).to.equal(2);
      expect(result[0].ecDefinition).to.equal(testKoq);
      expect(result[0].messageArgs).to.eql([testKoq.fullName, "Formats.SingleUnitFormat"]);
      expect(result[0].category).to.equal(DiagnosticCategory.Error);
      expect(result[0].code).to.equal(Rules.DiagnosticCodes.KOQDuplicatePresentationFormat);
      expect(result[0].diagnosticType).to.equal(DiagnosticType.SchemaItem);
      expect(result[1].ecDefinition).to.equal(testKoq);
      expect(result[1].messageArgs).to.eql([testKoq.fullName, "Formats.DoubleUnitFormat"]);
      expect(result[1].category).to.equal(DiagnosticCategory.Error);
      expect(result[1].code).to.equal(Rules.DiagnosticCodes.KOQDuplicatePresentationFormat);
      expect(result[1].diagnosticType).to.equal(DiagnosticType.SchemaItem);
    });

    it("KindOfQuantity has no duplicate presentation formats, rule passes.", async () => {
      const koqProps = {
        ...baseJson,
        relativeError: 1.234,
        persistenceUnit: "Units.IN",
        presentationUnits: [
          "Formats.SingleUnitFormat",
          "Formats.DoubleUnitFormat",
          "Formats.DefaultReal",
        ],
      };
      schema = await Schema.fromJson(createSchemaJson(koqProps), context);
      const testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;
      const result = await iterableToArray(Rules.koqDuplicatePresentationFormat(testKoq));

      expect(result.length).to.equal(0);
    });

    it("KindOfQuantity has duplicate presentation formats, exception made for AecUnits:LENGTH_SHORT less than 1.0.0 and 1.0.1.", async () => {
      const koqProps = {
        schemaItemType: "KindOfQuantity",
        name: "LENGTH_SHORT",
        label: "Short Length",
        relativeError: 0.01,
        persistenceUnit: "Units.IN",
        presentationUnits: [
          "Formats.DefaultReal",
          "Formats.SingleUnitFormat",
          "Formats.SingleUnitFormat",
        ],
      };

      const schemaJson = createSchemaJsonWithItems(
        {
          LENGTH_SHORT: {
            ...koqProps,
          },
        },
        {
          references: [
            {
              name: "Units",
              version: "1.0.0",
            },
            {
              name: "Formats",
              version: "1.0.0",
            },
          ],
        });
      schemaJson.name = "AecUnits";

      // schema AecUnits 1.0.0 rule pass
      schemaJson.version = "1.0.0";
      context = new SchemaContext();
      context.addLocater(new TestSchemaLocater());
      schema = await Schema.fromJson(schemaJson, context);
      let testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      let result = await iterableToArray(Rules.koqDuplicatePresentationFormat(testKoq));
      expect(result.length).to.equal(0);

      // schema AecUnits 1.0.1 rule pass
      schemaJson.version = "1.0.1";
      context = new SchemaContext();
      context.addLocater(new TestSchemaLocater());
      schema = await Schema.fromJson(schemaJson, context);
      testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

      result = await iterableToArray(Rules.koqDuplicatePresentationFormat(testKoq));
      expect(result.length).to.equal(0);

      // schema AecUnits above or equal to 1.0.2 rule violated
      const latestSchemaJsonVersion = ["1.0.2", "1.0.3", "1.1.3", "1.1.0", "2.0.0", "2.1.1", "3.0.0"];
      for (const latest of latestSchemaJsonVersion) {
        schemaJson.version = latest;
        context = new SchemaContext();
        context.addLocater(new TestSchemaLocater());
        schema = await Schema.fromJson(schemaJson, context);
        testKoq = await schema.getItem(koqProps.name, KindOfQuantity) as KindOfQuantity;

        result = await iterableToArray(Rules.koqDuplicatePresentationFormat(testKoq));
        expect(result.length).to.equal(1);
      }
    });
  });
});
