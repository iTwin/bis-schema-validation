/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as EC from "@bentley/ecschema-metadata";
import { DiagnosticCodes as BisDiagnosticCodes } from "@bentley/bis-rules";
import { CustomAttributeContainerProps } from "@bentley/ecschema-metadata/lib/Metadata/CustomAttribute";

interface ISchemaInfo {
  name: string;
  version: EC.ECVersion;
}

export const ruleSuppressionSet: EC.IRuleSuppressionSet = {
  name: "SuppressionSet",
  schemaRuleSuppressions: [
    // BIS-007
    { ruleCode: BisDiagnosticCodes.SchemaClassDisplayLabelMustBeUnique, rule: schemaClassDisplayLabelMustBeUnique },
  ],
  classRuleSuppressions: [
    // BIS-100
    { ruleCode: BisDiagnosticCodes.MultiplePropertiesInClassWithSameLabel, rule: multiplePropertiesInClassWithSameLabel },
    // BIS-101
    { ruleCode: BisDiagnosticCodes.ClassHasHandlerCACannotAppliedOutsideCoreSchemas, rule: classHasHandlerCACannotAppliedOutsideCoreSchemas },
  ],
  entityRuleSuppressions: [
    // BIS-605
    { ruleCode: BisDiagnosticCodes.ElementUniqueAspectMustHaveCorrespondingRelationship, rule: elementUniqueAspectMustHaveCorrespondingRelationship },
    // BIS-607
    { ruleCode: BisDiagnosticCodes.EntityClassesCannotDeriveFromModelClasses, rule: entityClassesCannotDeriveFromModelClasses },
    // BIS-609
    { ruleCode: BisDiagnosticCodes.BisModelSubClassesCannotDefineProperties, rule: bisModelSubClassesCannotDefineProperties },
  ],
  koqRuleSuppressions: [
    // BIS-1001
    { ruleCode: BisDiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit, rule: koqMustUseSIUnitForPersistenceUnit },
    // BIS-1002
    { ruleCode: BisDiagnosticCodes.KOQDuplicatePresentationFormat, rule: koqDuplicatePresentationFormat },
  ],
  propertyRuleSuppressions: [
    // BIS-1300
    { ruleCode: BisDiagnosticCodes.PropertyShouldNotBeOfTypeLong, rule: propertyShouldNotBeOfTypeLong },
  ],
  relationshipRuleSuppressions: [
    // BIS-1505
    { ruleCode: BisDiagnosticCodes.EmbeddingRelationshipsMustNotHaveHasInName, rule: embeddingRelationshipsMustNotHaveHasInName },
  ],
  customAttributeInstanceSuppressions: [
    { ruleCode: EC.DiagnosticCodes.CustomAttributeSchemaMustBeReferenced, rule: customAttributeSchemaMustBeReferenced },
  ],
};

/** Rule BIS-1001 rule suppression. */
export async function koqMustUseSIUnitForPersistenceUnit(_diagnostic: EC.AnyDiagnostic, koq: EC.KindOfQuantity): Promise<boolean> {
  if (koq.schema.name === "CifUnits") {
    const persistenceUnit = await koq.persistenceUnit;
    if (persistenceUnit?.fullName === "Units.MONETARY_UNIT" || persistenceUnit?.fullName === "CifUnits.MONETARY_UNIT_PER_J" ||
      persistenceUnit?.fullName === "CifUnits.MONETARY_UNIT_PER_W" || persistenceUnit?.fullName === "CifUnits.MONETARY_UNIT_PER_CUB_M") {
      return true;
    }
  }
  return false;
}

/** Rule BIS-1002 rule suppression. */
export async function koqDuplicatePresentationFormat(_diagnostic: EC.AnyDiagnostic, koq: EC.KindOfQuantity): Promise<boolean> {
  if (koq.schema.name === "ProcessPhysical" || koq.schema.name === "ProcessFunctional") {
    if (koq.name === "ONE")
      return true;
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
    { name: "ProcessPidGraphical", version: new EC.ECVersion(1, 99, 99) },
    { name: "RoadRailPhysical", version: new EC.ECVersion(1, 99, 99) },
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

    return false;
  }

  return false;
}

/** Rule BIS-100 rule suppression. */
export async function multiplePropertiesInClassWithSameLabel(diagnostic: EC.AnyDiagnostic, ecClass: EC.AnyClass): Promise<boolean> {
  const schemaList = [
    { name: "ProcessPhysical", version: new EC.ECVersion(1, 0, 1) },
  ];

  const schemaInfo = findSchemaInfo(schemaList, ecClass.schema);
  if (!schemaInfo)
    return false;

  if (diagnostic.messageArgs && diagnostic.messageArgs.includes("ProcessPhysical.PLANT_BASE_OBJECT")
    && diagnostic.messageArgs.includes("DesignState")
    && diagnostic.messageArgs.includes("DESIGN_STATE")
    && diagnostic.messageArgs.includes("Design State"))
    return true;

  return false;
}

/** Rule BIS-101 rule suppression. */
export async function classHasHandlerCACannotAppliedOutsideCoreSchemas(_diagnostic: EC.AnyDiagnostic, ecClass: EC.AnyClass): Promise<boolean> {
  const schemaList = [
    { name: "Grids", version: new EC.ECVersion(1, 0, 0) },
    { name: "Markup", version: new EC.ECVersion(1, 0, 0) },
    { name: "Construction", version: new EC.ECVersion(1, 0, 2) },
    { name: "StructuralPhysical", version: new EC.ECVersion(1, 0, 0) },
    { name: "ThreeMx", version: new EC.ECVersion(1, 0, 0) },
    { name: "ScalableMesh", version: new EC.ECVersion(1, 0, 1) },
    { name: "Raster", version: new EC.ECVersion(1, 0, 0) },
    { name: "PointCloud", version: new EC.ECVersion(1, 0, 0) },
    { name: "QuantityTakeoffsAspects", version: new EC.ECVersion(1, 0, 1) },
    { name: "ProcessFunctional", version: new EC.ECVersion(1, 0, 0) },
    { name: "ProcessPhysical", version: new EC.ECVersion(1, 0, 1) },
    { name: "ProcessPidGraphical", version: new EC.ECVersion(1, 0, 1) },
    { name: "LinearReferencing", version: new EC.ECVersion(2, 0, 0) },
    { name: "ClassificationSystems", version: new EC.ECVersion(1, 0, 0) },
    { name: "RoadRailPhysical", version: new EC.ECVersion(2, 0, 0) },
    { name: "RoadRailAlignment", version: new EC.ECVersion(2, 0, 0) },
    { name: "BridgeStructuralPhysical", version: new EC.ECVersion(1, 0, 0) },
    { name: "BuildingSpatial", version: new EC.ECVersion(1, 0, 0) },
    { name: "BuildingPhysical", version: new EC.ECVersion(1, 0, 0) },
    { name: "ArchitecturalPhysical", version: new EC.ECVersion(1, 0, 0) },
    { name: "DgnV8OpenRoadsDesigner", version: new EC.ECVersion(2, 0, 1) },
  ];

  const schemaInfo = findSchemaInfo(schemaList, ecClass.schema);
  if (schemaInfo)
    return true;

  return false;
}

/** Rule BIS-605 rule suppression. */
export async function elementUniqueAspectMustHaveCorrespondingRelationship(_diagnostic: EC.AnyDiagnostic, entity: EC.EntityClass): Promise<boolean> {
  const schemaList = [
    { name: "BuildingCommon", version: new EC.ECVersion(1, 99, 99) },
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
    { name: "StructuralPhysical", version: new EC.ECVersion(1, 99, 99) },
    { name: "BuildingPhysical", version: new EC.ECVersion(1, 99, 99) },
    { name: "RoadRailAlignment", version: new EC.ECVersion(1, 99, 99) },
    { name: "RoadRailPhysical", version: new EC.ECVersion(1, 99, 99) },
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
    { name: "ScalableMesh", version: new EC.ECVersion(1, 99, 99) },
    { name: "Raster", version: new EC.ECVersion(1, 99, 99) },
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
    { name: "Markup", version: new EC.ECVersion(1, 99, 99) },
    { name: "BuildingCommon", version: new EC.ECVersion(1, 99, 99) },
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

/** EC Rule EC-501 rule suppression. */
export async function customAttributeSchemaMustBeReferenced(diagnostic: EC.AnyDiagnostic, container: CustomAttributeContainerProps): Promise<boolean> {
  const schemaList = [
    { name: "RoadRailAlignment", version: new EC.ECVersion(2, 0, 1) },
    { name: "Construction", version: new EC.ECVersion(1, 0, 1) },
  ];

  const schemaInfo = findSchemaInfo(schemaList, container.schema);
  if (!schemaInfo)
    return false;

  if (diagnostic.messageArgs && diagnostic.messageArgs[1] === "ECDbMap.DbIndexList")
    return true;

  if (schemaInfo.name === "Construction" && diagnostic.messageArgs && diagnostic.messageArgs[1] === "CoreCustomAttributes.HiddenProperty")
    return true;

  return false;
}

function findSchemaInfo(schemaList: ISchemaInfo[], schema: EC.Schema): ISchemaInfo | undefined {
  const matches = schemaList.filter((value) => value.name === schema.name);
  const index = matches.findIndex((value) => 0 <= value.version.compare(schema.schemaKey.version));

  return index >= 0 ? matches[index] : undefined;
}
