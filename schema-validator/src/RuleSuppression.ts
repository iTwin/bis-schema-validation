/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { IRuleSuppressionSet, KindOfQuantity, SchemaItemType } from "@bentley/ecschema-metadata";
import { DiagnosticCodes } from "@bentley/bis-rules";

export const ruleSuppressionSet: IRuleSuppressionSet = {
  name: "SuppressionSet",
  koqRuleSuppressions: [
    { ruleCode: DiagnosticCodes.KOQMustNotUseUnitlessRatios, rule: koqMustNotUseUnitlessRatios },
    { ruleCode: DiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit, rule: koqMustUseSIUnitForPersistenceUnit },
    { ruleCode: DiagnosticCodes.KOQDuplicatePresentationFormat, rule: koqDuplicatePresentationFormat },
  ],
};

export async function koqMustUseSIUnitForPersistenceUnit(koq: KindOfQuantity): Promise<boolean> {
  if (koq.schema.name === "ProcessPhysical" || koq.schema.name === "ProcessFunctional") {
    const schemaItem = await koq.schema.getItem("ONE");
    if (!schemaItem) { return false; }
    return schemaItem.schemaItemType === SchemaItemType.KindOfQuantity;
  }
  return false;
}

export async function koqMustNotUseUnitlessRatios(koq: KindOfQuantity): Promise<boolean> {
  if (koq.schema.name === "ProcessPhysical" || koq.schema.name === "ProcessFunctional") {
    const schemaItem = await koq.schema.getItem("ONE");
    if (!schemaItem) { return false; }
    return schemaItem.schemaItemType === SchemaItemType.KindOfQuantity;
  }
  return false;
}

export async function koqDuplicatePresentationFormat(koq: KindOfQuantity): Promise<boolean> {
  if (koq.schema.name === "ProcessPhysical" || koq.schema.name === "ProcessFunctional") {
    const schemaItem = await koq.schema.getItem("ONE");
    if (!schemaItem) { return false; }
    return schemaItem.schemaItemType === SchemaItemType.KindOfQuantity;
  }
  return false;
}
