/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as EC from "@bentley/ecschema-metadata";
import { DiagnosticCodes } from "@bentley/bis-rules";

interface ISchemaInfo {
  name: string;
  version: EC.ECVersion;
}

export const ruleSuppressionSet: EC.IRuleSuppressionSet = {
  name: "SuppressionSet",
  schemaRuleSuppressions: [
    // BIS-007
    { ruleCode: DiagnosticCodes.SchemaClassDisplayLabelMustBeUnique, rule: schemaClassDisplayLabelMustBeUnique },
  ],
  entityRuleSuppressions: [
    // BIS-605
    { ruleCode: DiagnosticCodes.ElementUniqueAspectMustHaveCorrespondingRelationship, rule: elementUniqueAspectMustHaveCorrespondingRelationship },
    // BIS-607
    { ruleCode: DiagnosticCodes.EntityClassesCannotDeriveFromModelClasses, rule: entityClassesCannotDeriveFromModelClasses },
    // BIS-609
    { ruleCode: DiagnosticCodes.BisModelSubClassesCannotDefineProperties, rule: bisModelSubClassesCannotDefineProperties },
  ],
  koqRuleSuppressions: [
    // BIS-1000
    { ruleCode: DiagnosticCodes.KOQMustNotUseUnitlessRatios, rule: koqMustNotUseUnitlessRatios },
    // BIS-1001
    { ruleCode: DiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit, rule: koqMustUseSIUnitForPersistenceUnit },
    // BIS-1002
    { ruleCode: DiagnosticCodes.KOQDuplicatePresentationFormat, rule: koqDuplicatePresentationFormat },
  ],
  propertyRuleSuppressions: [
    // BIS-1300
    { ruleCode: DiagnosticCodes.PropertyShouldNotBeOfTypeLong, rule: propertyShouldNotBeOfTypeLong },
  ],
  relationshipRuleSuppressions: [
    // BIS-1505
    { ruleCode: DiagnosticCodes.EmbeddingRelationshipsMustNotHaveHasInName, rule: embeddingRelationshipsMustNotHaveHasInName },
  ],
};

/** Rule BIS-1001 rule suppression. */
export async function koqMustUseSIUnitForPersistenceUnit(_diagnostic: EC.AnyDiagnostic, koq: EC.KindOfQuantity): Promise<boolean> {
  if (koq.schema.name === "ProcessPhysical" || koq.schema.name === "ProcessFunctional") {
    const schemaItem = await koq.schema.getItem("ONE");
    if (!schemaItem) { return false; }
    return schemaItem.schemaItemType ===  EC.SchemaItemType.KindOfQuantity;
  }
  return false;
}

/** Rule BIS-1000 rule suppression. */
export async function koqMustNotUseUnitlessRatios(_diagnostic: EC.AnyDiagnostic, koq: EC.KindOfQuantity): Promise<boolean> {
  if (koq.schema.name === "ProcessPhysical" || koq.schema.name === "ProcessFunctional") {
    const schemaItem = await koq.schema.getItem("ONE");
    if (!schemaItem) { return false; }
    return schemaItem.schemaItemType ===  EC.SchemaItemType.KindOfQuantity;
  }
  return false;
}

/** Rule BIS-1002 rule suppression. */
export async function koqDuplicatePresentationFormat(_diagnostic: EC.AnyDiagnostic, koq: EC.KindOfQuantity): Promise<boolean> {
  if (koq.schema.name === "ProcessPhysical" || koq.schema.name === "ProcessFunctional") {
    const schemaItem = await koq.schema.getItem("ONE");
    if (!schemaItem) { return false; }
    return schemaItem.schemaItemType ===  EC.SchemaItemType.KindOfQuantity;
  }
  return false;
}

/** Rule BIS-1505 rule suppression. */
export async function embeddingRelationshipsMustNotHaveHasInName(_diagnostic: EC.AnyDiagnostic, relationshipClass: EC.RelationshipClass): Promise<boolean> {
  if (relationshipClass.schema.name === "ProcessFunctional" || relationshipClass.schema.name === "ProcessPhysical" || relationshipClass.schema.name.startsWith("SP3D")) {
    return true;
  }
  return false;
}

/** Rule BIS-007 rule suppression. */
export async function schemaClassDisplayLabelMustBeUnique(diagnostic: EC.AnyDiagnostic, schema: EC.Schema): Promise<boolean> {
  const schemaList = [
    { name: "ProcessPidGraphical", version: new  EC.ECVersion(1, 99, 99) },
    { name: "RoadRailPhysical", version: new  EC.ECVersion(1, 99, 99) },
    { name: "ProcessPhysical", version: new EC.ECVersion(1, 0, 1) },
  ];

  const schemaInfo = findSchemaInfo(schemaList, schema);
  if (!schemaInfo)
    return false;

  if (schemaInfo.name === "ProcessPidGraphical") {
    if (diagnostic.messageArgs && diagnostic.messageArgs.includes("ProcessPidGraphical.OpSettings")
        && diagnostic.messageArgs.includes("ProcessPidGraphical.OpCheckOutId")
        && diagnostic.messageArgs.includes("OpenPlant Settings"))
      return true;

    return false;
  }

  if (schemaInfo.name === "RoadRailPhysical") {
    if (diagnostic.messageArgs && diagnostic.messageArgs.includes("RoadRailPhysical.DesignSpeedElement")
      && diagnostic.messageArgs.includes("RoadRailPhysical.DesignSpeed")
      && diagnostic.messageArgs.includes("Design Speed"))
      return true;

    if (diagnostic.messageArgs && diagnostic.messageArgs.includes("RoadRailPhysical.TypicalSectionPointDefinition")
      && diagnostic.messageArgs.includes("RoadRailPhysical.GenericTypicalSectionPointDefinition")
      && diagnostic.messageArgs.includes("Typical Section Point Definition"))
      return true;

    return false;
  }

  if (schemaInfo.name === "ProcessPhysical") {
    if (diagnostic.messageArgs && diagnostic.messageArgs.includes("ProcessPhysical.PipeAlignment")
        && diagnostic.messageArgs.includes("ProcessPhysical.PIPE_GUIDE")
        && diagnostic.messageArgs.includes("Pipe Guide"))
      return true;

    if (diagnostic.messageArgs && diagnostic.messageArgs.includes("ProcessPhysical.PipeClamp")
        && diagnostic.messageArgs.includes("ProcessPhysical.PIPE_CLAMP")
        && diagnostic.messageArgs.includes("Pipe Clamp"))
      return true;

    if (diagnostic.messageArgs && diagnostic.messageArgs.includes("ProcessPhysical.RiserClamp")
        && diagnostic.messageArgs.includes("ProcessPhysical.RISER_CLAMP")
        && diagnostic.messageArgs.includes("Riser Clamp"))
      return true;

    if (diagnostic.messageArgs && diagnostic.messageArgs.includes("ProcessPhysical.SpringHanger")
        && diagnostic.messageArgs.includes("ProcessPhysical.SPRING_HANGER")
        && diagnostic.messageArgs.includes("Spring Hanger"))
      return true;

    if (diagnostic.messageArgs && diagnostic.messageArgs.includes("ProcessPhysical.PLANT_BASE_OBJECT")
        && diagnostic.messageArgs.includes("ProcessPhysical.DESIGN_STATE")
        && diagnostic.messageArgs.includes("Design State"))
      return true;

    return false;
  }

  return false;
}

/** Rule BIS-605 rule suppression. */
export async function elementUniqueAspectMustHaveCorrespondingRelationship(_diagnostic: EC.AnyDiagnostic, entity: EC.EntityClass): Promise<boolean> {
  const schemaList = [
    { name: "BuildingCommon", version: new  EC.ECVersion(1, 99, 99) },
  ];

  const classList = [
    "BuildingCommon.ABDIFCOerrides", "BuildingCommon.ABDIdentification", "BuildingCommon.AcousticalProperties", "BuildingCommon.AnalyticalProperties",
    "BuildingCommon.Classification", "BuildingCommon.FireResistance", "BuildingCommon.IdentityData", "BuildingCommon.Manufacturer", "BuildingCommon.Phases",
  ];

  return findSchemaInfo(schemaList, entity.schema) && classList.includes(entity.fullName) ? true : false;
}

/** Rule BIS-607 rule suppression. */
export async function entityClassesCannotDeriveFromModelClasses(_diagnostic: EC.AnyDiagnostic, entity: EC.EntityClass): Promise<boolean> {
  const schemaList = [
    { name: "StructuralPhysical", version: new  EC.ECVersion(1, 99, 99) },
    { name: "BuildingPhysical", version: new  EC.ECVersion(1, 99, 99) },
    { name: "RoadRailAlignment", version: new  EC.ECVersion(1, 99, 99) },
    { name: "RoadRailPhysical", version: new  EC.ECVersion(1, 99, 99) },
  ];

  const schemaInfo = findSchemaInfo(schemaList, entity.schema);
  if (!schemaInfo)
    return false;

  if (schemaInfo.name === "StructuralPhysical") {
    return "StructuralPhysicalModel" === entity.name;
  }

  if (schemaInfo.name === "BuildingPhysical") {
    return ["BuildingPhysicalModel", "BuildingTypeDefinitionModel"].includes(entity.name);
  }

  if (schemaInfo.name === "RoadRailPhysical") {
    return ["RailwayStandardsModel", "RoadwayStandardsModel"].includes(entity.name);
  }

  if (schemaInfo.name === "RoadRailAlignment") {
    return ["AlignmentModel", "ConfigurationModel", "HorizontalAlignmentModel", "RoadRailCategoryModel"].includes(entity.name);
  }

  return false;
}

/** Rule BIS-609 rule suppression. */
export async function bisModelSubClassesCannotDefineProperties(_diagnostic: EC.AnyDiagnostic, entity: EC.EntityClass): Promise<boolean> {
  const schemaList = [
    { name: "ScalableMesh", version: new  EC.ECVersion(1, 99, 99) },
    { name: "Raster", version: new  EC.ECVersion(1, 99, 99) },
  ];

  const schemaInfo = findSchemaInfo(schemaList, entity.schema);
  if (!schemaInfo)
    return false;

  if (schemaInfo.name === "ScalableMesh") {
    return "ScalableMeshModel" === entity.name;
  }

  if (schemaInfo.name === "Raster") {
    return "RasterModel" === entity.name;
  }

  return false;
}

/** Rule BIS-1300 rule suppression. */
export async function propertyShouldNotBeOfTypeLong(_diagnostic: EC.AnyDiagnostic, property: EC.AnyProperty): Promise<boolean> {
  const schemaList = [
    { name: "Markup", version: new  EC.ECVersion(1, 99, 99) },
    { name: "BuildingCommon", version: new  EC.ECVersion(1, 99, 99) },
  ];

  const schemaInfo = findSchemaInfo(schemaList, property.schema);
  if (!schemaInfo)
    return false;

  if (schemaInfo.name === "Markup") {
    return "MarkupExternalLink.LinkedElementId" === property.fullName;
  }

  if (schemaInfo.name === "BuildingCommon") {
    return "ABDIdentification.ElementId" === property.fullName;
  }

  return false;
}

function findSchemaInfo(schemaList: ISchemaInfo[], schema: EC.Schema): ISchemaInfo | undefined {
  const matches = schemaList.filter((value) => value.name === schema.name);
  const index = matches.findIndex((value) => 0 <= value.version.compare(schema.schemaKey.version));

  return index >= 0 ? matches[index] : undefined;
}
