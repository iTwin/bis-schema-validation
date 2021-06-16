/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { ISchemaLocater,Schema,SchemaContext,SchemaKey,SchemaMatchType } from "@bentley/ecschema-metadata";

const formatsKey = new SchemaKey("Formats", 1, 0, 0);
const unitsKey = new SchemaKey("Units", 1, 0, 0);

export class TestSchemaLocater implements ISchemaLocater {
  public async getSchema<T extends Schema>(schemaKey: SchemaKey, matchType: SchemaMatchType, context: SchemaContext): Promise<T | undefined> {
    if (schemaKey.matches(formatsKey, matchType))
      return await Schema.fromJson(testFormatSchema, context) as T;

    if (schemaKey.matches(unitsKey, matchType))
      return await Schema.fromJson(testUnitsSchema, context) as T;

    return undefined;
  }

  public getSchemaSync<T extends Schema>(schemaKey: SchemaKey, matchType: SchemaMatchType, context: SchemaContext): T | undefined {
    if (schemaKey.matches(formatsKey, matchType))
      return Schema.fromJsonSync(testFormatSchema, context) as T;

    if (schemaKey.matches(unitsKey, matchType))
      return Schema.fromJsonSync(testUnitsSchema, context) as T;

    return undefined;
  }
}

const testUnitsSchema = {
  $schema: "https://dev.bentley.com/json_schemas/ec/32/ecschema",
  name: "Units",
  version: "1.0.0",
  alias: "u",
  items: {
    Length: {
      schemaItemType: "Phenomenon",
      definition: "LENGTH(1)",
    },
    NUMBER: {
      schemaItemType: "Phenomenon",
      definition: "NUMBER",
    },
    PERCENTAGE: {
      schemaItemType: "Phenomenon",
      definition: "NUMBER",
    },
    CURRENCY: {
      schemaItemType: "Phenomenon",
      definition: "CURRENCY",
    },
    USCustom: {
      schemaItemType: "UnitSystem",
    },
    SI: {
      schemaItemType: "UnitSystem",
    },
    INTERNATIONAL: {
      schemaItemType: "UnitSystem",
    },
    FINANCE: {
      schemaItemType: "UnitSystem",
    },
    M: {
      schemaItemType: "Unit",
      label: "m",
      phenomenon: "Units.Length",
      unitSystem: "Units.SI",
      definition: "M",
    },
    MILE: {
      schemaItemType: "Unit",
      label: "mile",
      phenomenon: "Units.Length",
      unitSystem: "Units.USCustom",
      definition: "YRD",
      numerator: 1760.0,
    },
    YRD: {
      schemaItemType: "Unit",
      label: "yard",
      phenomenon: "Units.Length",
      unitSystem: "Units.USCustom",
      definition: "FT",
      numerator: 3.0,
    },
    FT: {
      schemaItemType: "Unit",
      label: "foot",
      phenomenon: "Units.Length",
      unitSystem: "Units.USCustom",
      definition: "IN",
      numerator: 12.0,
    },
    IN: {
      schemaItemType: "Unit",
      label: "inch",
      phenomenon: "Units.Length",
      unitSystem: "Units.USCustom",
      definition: "MM",
      numerator: 25.4,
    },
    MILLIINCH: {
      schemaItemType: "Unit",
      label: "mil",
      phenomenon: "Units.Length",
      unitSystem: "Units.USCustom",
      definition: "[MILLI]*IN",
    },
    PERCENT: {
      schemaItemType: "Unit",
      label: "%",
      phenomenon: "Units.PERCENTAGE",
      unitSystem: "Units.INTERNATIONAL",
      definition: "ONE",
    },
    DECIMAL_PERCENT: {
      schemaItemType: "Unit",
      label: "",
      phenomenon: "Units.PERCENTAGE",
      unitSystem: "Units.INTERNATIONAL",
      definition: "PERCENT",
      numerator: 100,
    },
    MONETARY_UNIT: {
      schemaItemType: "Unit",
      label: "¤",
      phenomenon: "Units.CURRENCY",
      unitSystem: "Units.FINANCE",
      definition: "MONETARY_UNIT",
    },
    US_DOLLAR: {
      schemaItemType: "Unit",
      label: "$",
      phenomenon: "Units.CURRENCY",
      unitSystem: "Units.FINANCE",
      definition: "US_DOLLAR",
    },
    COEFFICIENT: {
      schemaItemType: "Unit",
      label: "",
      phenomenon: "Units.NUMBER",
      unitSystem: "Units.INTERNATIONAL",
      definition: "ONE",
    },
    ONE: {
      schemaItemType: "Unit",
      label: "one",
      phenomenon: "Units.NUMBER",
      unitSystem: "Units.INTERNATIONAL",
      definition: "ONE",
    },
  },
};

const testFormatSchema = {
  $schema: "https://dev.bentley.com/json_schemas/ec/32/ecschema",
  name: "Formats",
  version: "1.0.0",
  alias: "f",
  references: [
    {
      name: "Units",
      version: "01.00.00",
    },
  ],
  items: {
    DefaultReal: {
      schemaItemType: "Format",
      type: "decimal",
      precision: 6,
    },
    SingleUnitFormat: {
      schemaItemType: "Format",
      type: "decimal",
      precision: 6,
      composite: {
        includeZero: false,
        spacer: "-",
        units: [
          {
            name: "Units.YRD",
            label: "yard(s)",
          },
        ],
      },
    },
    DoubleUnitFormat: {
      schemaItemType: "Format",
      type: "decimal",
      precision: 6,
      composite: {
        includeZero: false,
        spacer: "-",
        units: [
          {
            name: "Units.YRD",
            label: "yard(s)",
          },
          {
            name: "Units.FT",
            label: "feet",
          },
        ],
      },
    },
    TripleUnitFormat: {
      schemaItemType: "Format",
      type: "decimal",
      precision: 6,
      composite: {
        includeZero: false,
        spacer: "-",
        units: [
          {
            name: "Units.YRD",
            label: "yard(s)",
          },
          {
            name: "Units.FT",
            label: "feet",
          },
          {
            name: "Units.IN",
            label: "inch(es)",
          },
        ],
      },
    },
    QuadUnitFormat: {
      schemaItemType: "Format",
      type: "decimal",
      precision: 6,
      composite: {
        includeZero: false,
        spacer: "-",
        units: [
          {
            name: "Units.MILE",
            label: "mile(s)",
          },
          {
            name: "Units.YRD",
            label: "yard(s)",
          },
          {
            name: "Units.FT",
            label: "feet",
          },
          {
            name: "Units.IN",
            label: "inch(es)",
          },
        ],
      },
    },
  },
};
