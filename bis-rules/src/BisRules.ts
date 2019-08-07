/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as EC from "@bentley/ecschema-metadata";

const bisCoreName = "BisCore";
const bisModelName = "Model";
const classHasHandlerName = "ClassHasHandler";
const customHandledPropertyName = "CustomHandledProperty";
const definitionModelName = "DefinitionModel";
const deprecatedFullName = "CoreCustomAttributes.Deprecated";
const classHasHandlerCAFullName = "BisCore.ClassHasHandler";
const documentListModelName = "DocumentListModel";
const elementAspectName = "ElementAspect";
const elementMultiAspectName = "ElementMultiAspect";
const elementOwnsMultiAspectsName = "ElementOwnsMultiAspects";
const elementOwnsUniqueAspectName = "ElementOwnsUniqueAspect";
const elementUniqueAspectName = "ElementUniqueAspect";
const informationRecordModelName = "InformationRecordModel";
const iParentElementName = "IParentElement";
const iSubModeledElementName = "ISubModeledElement";
const linkModelModelName = "LinkModel";
const percentagePhenomenonName = "PERCENTAGE";
const physicalModelName = "PhysicalModel";
const siUnitSystemName = "SI";
const spatialLocationModelName = "SpatialLocationModel";
const validExtendedTypes = ["BeGuid", "GeometryStream", "Json"];

const ruleSetName = "BIS";

function getCode(code: string): string {
  return ruleSetName + "-" + code;
}

/**
 * The unique diagnostic codes for BIS rules.
 *
 * To provide meaning to code values, with anticipation
 * of future rules for all current EC Types, the following
 * value ranges should be used:
 *
 * - Schema:                    000-099
 * - Class:                     100-199
 * - Constant:                  200-299
 * - CustomAttribute            300-399
 * - CustomAttributeClass:      400-499
 * - CustomAttributeContainer:  500-599
 * - EntityClass:               600-699
 * - Enumeration:               700-799
 * - Format:                    800-899
 * - InvertedUnit:              900-999
 * - KindOfQuantity:            1000-1099
 * - Mixin:                     1100-1199
 * - Phenomenon:                1200-1299
 * - Property:                  1300-1399
 * - PropertyCategory:          1400-1499
 * - RelationshipClass:         1500-1599
 * - RelationshipConstraint:    1600-1699
 * - StructClass:               1700-1799
 * - Unit:                      1800-1899
 * - UnitSystem:                1900-1999
 */
// tslint:disable-next-line:variable-name
export const DiagnosticCodes = {
  // Schema Rules (000-999)
  SchemaXmlVersionMustBeTheLatest: getCode("001"),
  SchemaMustNotReferenceOldStandardSchemas: getCode("002"),
  SchemaWithDynamicInNameMustHaveDynamicSchemaCA: getCode("003"),
  SchemaClassDisplayLabelMustBeUnique: getCode("004"),
  ClassHasHandlerCACannotAppliedOutsideCoreSchemas: getCode("009"),

  // Class Rules (100-199)
  MultiplePropertiesInClassWithSameLabel: getCode("100"),

  // CustomAttributeClass Rules (400-499)
  CustomAttributeClassCannotHaveBaseClasses: getCode("400"),

  // EntityClass Rules (600-699)
  EntityClassMustDeriveFromBisHierarchy: getCode("600"),
  EntityClassMayNotInheritSameProperty: getCode("601"),
  ElementMultiAspectMustHaveCorrespondingRelationship: getCode("602"),
  ElementUniqueAspectMustHaveCorrespondingRelationship: getCode("603"),
  EntityClassesCannotDeriveFromIParentElementAndISubModeledElement: getCode("604"),
  EntityClassesCannotDeriveFromModelClasses: getCode("605"),
  BisModelSubClassesCannotDefineProperties: getCode("606"),
  EntityClassesMayNotSubclassDeprecatedClasses: getCode("607"),

  // KindOfQuantity Rules (1000-1099)
  KOQMustNotUseUnitlessRatios: getCode("1000"),
  KOQMustUseSIUnitForPersistenceUnit: getCode("1001"),
  KOQDuplicatePresentationFormat: getCode("1002"),

  // Mixin Rules (1100-1199)
  MixinsCannotOverrideInheritedProperties: getCode("1100"),

  // Property Rules (1300-1399)
  PropertyShouldNotBeOfTypeLong: getCode("1300"),
  PropertyHasInvalidExtendedType: getCode("1301"),
  PropertyMustNotUseCustomHandledPropertyRestriction: getCode("1302"),

  // RelationshipClass Rules (1500-1599)
  RelationshipClassMustNotUseHoldingStrength: getCode("1500"),
  RelationshipSourceMultiplicityUpperBoundRestriction: getCode("1501"),
  RelationshipTargetMultiplicityUpperBoundRestriction: getCode("1502"),
  RelationshipElementAspectContraintRestriction: getCode("1503"),
  EmbeddingRelationshipsMustNotHaveHasInName: getCode("1504"),

  // StructClass Rules (1700-1799)
  StructsCannotHaveBaseClasses: getCode("1700"),
};

/**
 * The list of [[IDiagnostic]] implementation classes used by the BIS rule implementations.
 */
// tslint:disable-next-line:variable-name
export const Diagnostics = {
  /** Required message parameters: latest ECXML version. */
  SchemaXmlVersionMustBeTheLatest: EC.createSchemaDiagnosticClass<[string]>(DiagnosticCodes.SchemaXmlVersionMustBeTheLatest,
    "Schema ECXML Version is not the latest ECVersion, {0}."),

  /** Required message parameters: Schema full name, standard schema name. */
  SchemaMustNotReferenceOldStandardSchemas: EC.createSchemaDiagnosticClass<[string, string]>(DiagnosticCodes.SchemaMustNotReferenceOldStandardSchemas,
    "Schema '{0}' references the old standard schema '{1}'. Only new standard schemas should be used."),

  /** Required message parameters: Schema full name. */
  SchemaWithDynamicInNameMustHaveDynamicSchemaCA: EC.createSchemaDiagnosticClass<[string]>(DiagnosticCodes.SchemaWithDynamicInNameMustHaveDynamicSchemaCA,
    "Schema '{0}' contains 'dynamic' in the name but does not apply the 'CoreCA:DynamicSchema' ECCustomAttribute."),

  /** Required message parameters: 1st class full name, 2nd class full name, and display label */
  SchemaClassDisplayLabelMustBeUnique: EC.createSchemaDiagnosticClass<[string, string, string]>(DiagnosticCodes.SchemaClassDisplayLabelMustBeUnique,
    "Classes {0} and {1} have the same display label, '{2}'. Classes in the same schema cannot have have the same label."),

  /** Required message parameters: mixin class fullName, class fullName, applies to constraint class fullName */
  MixinsCannotOverrideInheritedProperties: EC.createSchemaItemDiagnosticClass<EC.Mixin, [string, string]>(DiagnosticCodes.MixinsCannotOverrideInheritedProperties,
    "Mixin '{0}' overrides inherited property '{1}'. A mixin class must not override an inherited property."),

  /** Required message parameters: EntityClass fullName */
  EntityClassMustDeriveFromBisHierarchy: EC.createSchemaItemDiagnosticClass<EC.EntityClass, [string]>(DiagnosticCodes.EntityClassMustDeriveFromBisHierarchy,
    "Entity class '{0}' must derive from the BIS hierarchy."),

  /** Required message parameters: EntityClass fullName, property name, first class fullName, and second class fullName */
  EntityClassMayNotInheritSameProperty: EC.createSchemaItemDiagnosticClass<EC.EntityClass, [string, string, string, string]>(DiagnosticCodes.EntityClassMayNotInheritSameProperty,
    "Entity class '{0}' inherits the property '{1}' from more than one source: '{2}', '{3}'. Entity classes may not inherit the same property from more than one class (base class or mixins)."),

  /** Required message parameters: EntityClass fullName */
  ElementMultiAspectMustHaveCorrespondingRelationship: EC.createSchemaItemDiagnosticClass<EC.EntityClass, [string]>(DiagnosticCodes.ElementMultiAspectMustHaveCorrespondingRelationship,
    "The ElementMultiAspect Entity class '{0}' requires an ElementOwnsMultiAspects relationship with this class supported as a target constraint."),

  /** Required message parameters: EntityClass fullName */
  ElementUniqueAspectMustHaveCorrespondingRelationship: EC.createSchemaItemDiagnosticClass<EC.EntityClass, [string]>(DiagnosticCodes.ElementUniqueAspectMustHaveCorrespondingRelationship,
    "The ElementUniqueAspect Entity class '{0}' requires an ElementOwnsUniqueAspect relationship with this class supported as a target constraint."),

  /** Required message parameters: EntityClass fullName */
  EntityClassesCannotDeriveFromIParentElementAndISubModeledElement: EC.createSchemaItemDiagnosticClass<EC.EntityClass, [string]>(DiagnosticCodes.EntityClassesCannotDeriveFromIParentElementAndISubModeledElement,
    "Entity class '{0}' implements both IParentElement and ISubModeledElement which is not allowed."),

  /** Required message parameters: EntityClass fullName, model class fullName */
  EntityClassesCannotDeriveFromModelClasses: EC.createSchemaItemDiagnosticClass<EC.EntityClass, [string, string]>(DiagnosticCodes.EntityClassesCannotDeriveFromModelClasses,
    "Entity class '{0}' may not subclass '{1}'."),

  /** Required message parameters: EntityClass fullName */
  BisModelSubClassesCannotDefineProperties: EC.createSchemaItemDiagnosticClass<EC.EntityClass, [string]>(DiagnosticCodes.BisModelSubClassesCannotDefineProperties,
    "Entity class '{0}' may not define properties because it derives from 'BisCore.Model'. Model subclasses should not add new properties."),

  /** Required message parameters: EntityClass fullName, base class fullName */
  EntityClassesMayNotSubclassDeprecatedClasses: EC.createSchemaItemDiagnosticClass<EC.EntityClass, [string, string]>(DiagnosticCodes.EntityClassesMayNotSubclassDeprecatedClasses,
    "Entity class '{0}' derives from '{1}' which has been deprecated."),

  /** Required message parameters: RelationshipClass fullName */
  RelationshipClassMustNotUseHoldingStrength: EC.createSchemaItemDiagnosticClass<EC.RelationshipClass, [string]>(DiagnosticCodes.RelationshipClassMustNotUseHoldingStrength,
    "Relationship class '{0}' has a strength value of 'holding' which is not allowed."),

  /** Required message parameters: RelationshipClass fullName */
  RelationshipSourceMultiplicityUpperBoundRestriction: EC.createSchemaItemDiagnosticClass<EC.RelationshipClass, [string]>(DiagnosticCodes.RelationshipSourceMultiplicityUpperBoundRestriction,
    "Relationship class '{0}' has an 'embedding' strength with a forward direction so the source constraint may not have a multiplicity upper bound greater than 1."),

  /** Required message parameters: RelationshipClass fullName */
  RelationshipTargetMultiplicityUpperBoundRestriction: EC.createSchemaItemDiagnosticClass<EC.RelationshipClass, [string]>(DiagnosticCodes.RelationshipTargetMultiplicityUpperBoundRestriction,
    "Relationship class '{0}' has an 'embedding' strength with a backward direction so the target constraint may not have a multiplicity upper bound greater than 1."),

  /** Required message parameters: RelationshipClass fullName, relationship end (source/target) */
  RelationshipElementAspectContraintRestriction: EC.createSchemaItemDiagnosticClass<EC.RelationshipClass, [string, string]>(DiagnosticCodes.RelationshipElementAspectContraintRestriction,
    "Relationship class '{0}' may not have an ElementAspect {1} constraint, unless subclassed from ElementOwnsUniqueAspect or ElementOwnsMultiAspect."),

  /** Required message parameters: RelationshipClass fullName */
  EmbeddingRelationshipsMustNotHaveHasInName: EC.createSchemaItemDiagnosticClass<EC.RelationshipClass, [string]>(DiagnosticCodes.EmbeddingRelationshipsMustNotHaveHasInName,
    "Relationship class '{0}' has an 'embedding' strength and contains 'Has' in its name. Consider renaming this class."),

  /** Required message parameters: StructClass fullName */
  StructsCannotHaveBaseClasses: EC.createSchemaItemDiagnosticClass<EC.StructClass, [string]>(DiagnosticCodes.StructsCannotHaveBaseClasses,
    "Struct class '{0}' has a base class, but structs should not have base classes."),

  /** Required message parameters: CustomAttributeClass fullName */
  CustomAttributeClassCannotHaveBaseClasses: EC.createSchemaItemDiagnosticClass<EC.CustomAttributeClass, [string]>(DiagnosticCodes.CustomAttributeClassCannotHaveBaseClasses,
    "CustomAttribute class '{0}' has a base class, but CustomAttribute classes should not have base classes."),

  /** Required message parameters: KindOfQuantity fullName */
  KOQMustNotUseUnitlessRatios: EC.createSchemaItemDiagnosticClass<EC.KindOfQuantity, [string]>(DiagnosticCodes.KOQMustNotUseUnitlessRatios,
    "KindOfQuantity '{0}' has persistence unit of Phenomenon 'PERCENTAGE'. Unitless ratios are not allowed. Use a ratio phenomenon which includes units like VOLUME_RATIO"),

  /** Required message parameters: KindOfQuantity fullName, UnitSystem fullName */
  KOQMustUseSIUnitForPersistenceUnit: EC.createSchemaItemDiagnosticClass<EC.KindOfQuantity, [string, string]>(DiagnosticCodes.KOQMustUseSIUnitForPersistenceUnit,
    "KindOfQuantity '{0}' has persistence unit of unit system '{1}' but must have an SI unit system"),

  /** Required message parameters: KindOfQuantity fullName, UnitSystem fullName */
  KOQDuplicatePresentationFormat: EC.createSchemaItemDiagnosticClass<EC.KindOfQuantity, [string, string]>(DiagnosticCodes.KOQDuplicatePresentationFormat,
    "KindOfQuantity '{0}' has a duplicate presentation format '{1}' which is not allowed."),

  /** Required message parameters: ECClass FullName, property name */
  PropertyShouldNotBeOfTypeLong: EC.createPropertyDiagnosticClass<[string, string]>(DiagnosticCodes.PropertyShouldNotBeOfTypeLong,
    "Property '{0}:{1}' is of type 'long' and long properties are not allowed. Use int, double or if this represents a FK use a navigation property."),

  /** Required message parameters: ECClass FullName, property name, extendedType name */
  PropertyHasInvalidExtendedType: EC.createPropertyDiagnosticClass<[string, string, string]>(DiagnosticCodes.PropertyHasInvalidExtendedType,
    "Property '{0}:{1}' has extended type '{2}', which is not on the list of valid extended types (currently 'BeGuid', 'GeometryStream', and 'Json')."),

  /** Required message parameters: ECClass FullName, property name, extendedType name */
  PropertyMustNotUseCustomHandledPropertyRestriction: EC.createPropertyDiagnosticClass<[string, string]>(DiagnosticCodes.PropertyMustNotUseCustomHandledPropertyRestriction,
    "Property '{0}:{1}' has CustomAttribute 'bis:CustomHandledProperty, which requires the parent class to have the CustomAttribute 'bis:ClassHasHandler'."),

  /** Required message parameters: ECClass FullName, first property name, second property name, display label */
  MultiplePropertiesInClassWithSameLabel: EC.createClassDiagnosticClass<[string, string, string, string]>(DiagnosticCodes.MultiplePropertiesInClassWithSameLabel,
    "Class '{0}' has properties '{1}' and '{2}' with the same display label '{3}'."),

  /** Required message parameters: ECClass FullName,  Schema Name */
  ClassHasHandlerCACannotAppliedOutsideCoreSchemas: EC.createClassDiagnosticClass<[string, string]>(DiagnosticCodes.ClassHasHandlerCACannotAppliedOutsideCoreSchemas,
    "Class '{0}' in schema '{1}' has 'ClassHasHandler' Custom Attribute applied. 'ClassHasHandler' Custom Attribute not allowed outside of the BisCore, Functional, and Generic schemas. Consider using the SchemaHasBehavior Custom Attribute."),
};

/**
 * All schema validation rules that fall under the category of ECObjects.
 */
// tslint:disable-next-line:variable-name
export const BisRuleSet: EC.IRuleSet = {
  name: ruleSetName,
  schemaRules: [
    schemaXmlVersionMustBeTheLatest,
    schemaMustNotReferenceOldStandardSchemas,
    schemaWithDynamicInNameMustHaveDynamicSchemaCA,
    schemaClassDisplayLabelMustBeUnique,
  ],
  entityClassRules: [
    entityClassMustDeriveFromBisHierarchy,
    entityClassMayNotInheritSameProperty,
    elementMultiAspectMustHaveCorrespondingRelationship,
    elementUniqueAspectMustHaveCorrespondingRelationship,
    entityClassesCannotDeriveFromIParentElementAndISubModeledElement,
    entityClassesCannotDeriveFromModelClasses,
    bisModelSubClassesCannotDefineProperties,
    entityClassesMayNotSubclassDeprecatedClasses,
  ],
  relationshipRules: [
    relationshipClassMustNotUseHoldingStrength,
    relationshipSourceMultiplicityUpperBoundRestriction,
    relationshipTargetMultiplicityUpperBoundRestriction,
    relationshipElementAspectContraintRestriction,
    embeddingRelationshipsMustNotHaveHasInName,
  ],
  structClassRules: [
    structsCannotHaveBaseClasses,
  ],
  customAttributeClassRules: [
    customAttributeClassCannotHaveBaseClasses,
  ],
  kindOfQuantityRules: [
    koqMustNotUseUnitlessRatios,
    koqMustUseSIUnitForPersistenceUnit,
    koqDuplicatePresentationFormat,
  ],
  propertyRules: [
    propertyShouldNotBeOfTypeLong,
    propertyHasInvalidExtendedType,
    propertyMustNotUseCustomHandledPropertyRestriction,
  ],
  classRules: [
    multiplePropertiesInClassWithSameLabel,
    classHasHandlerCACannotAppliedOutsideCoreSchemas,
  ],
  mixinRules: [
    mixinsCannotOverrideInheritedProperties,
  ],
};

function getPrimitiveType(property: EC.Property): EC.PrimitiveType | undefined {
  if (property.isPrimitive)
    return (property as EC.PrimitiveProperty).primitiveType;

  return undefined;
}

/** SCHEMA RULES
 * ************************************************************
 */

/** The names of all pre-EC3 standard schemas */
const oldStandardSchemaNames = [
  "Bentley_Standard_CustomAttributes",
  "Bentley_Standard_Classes",
  "Bentley_ECSchemaMap",
  "EditorCustomAttributes",
  "Bentley_Common_Classes",
  "Dimension_Schema",
  "iip_mdb_customAttributes",
  "KindOfQuantity_Schema",
  "rdl_customAttributes",
  "SIUnitSystemDefaults",
  "Unit_Attributes",
  "Units_Schema",
  "USCustomaryUnitSystemDefaults",
  "ECDbMap",
];

/**
 * BIS Rule: Schema ECXML version must be the latest.
 */
export async function* schemaXmlVersionMustBeTheLatest(schema: EC.Schema): AsyncIterable<EC.SchemaDiagnostic<any[]>> {
  // TODO:  Implement rule once EC version management is complete...
  if (schema)
    return true;
  const latestVersion = "";
  yield new Diagnostics.SchemaXmlVersionMustBeTheLatest(schema, [latestVersion]);
}

/**
 * BIS Rule: Schema must not reference old standard schemas.
 */
export async function* schemaMustNotReferenceOldStandardSchemas(schema: EC.Schema): AsyncIterable<EC.SchemaDiagnostic<any[]>> {
  for (const ref of schema.references) {
    // can reference ECDbMap as long as its 2.0 or above.
    if (ref.name === "ECDbMap" && ref.readVersion > 1)
      continue;

    if (oldStandardSchemaNames.findIndex((x) => ref.name === x) !== -1)
      yield new Diagnostics.SchemaMustNotReferenceOldStandardSchemas(schema, [schema.schemaKey.toString(), ref.name]);
  }
}

/**
 * BIS Rule: Schema with 'dynamic' in the name (case-insensitive) requires the "CoreCA:Dynamic" custom attribute.
 */
export async function* schemaWithDynamicInNameMustHaveDynamicSchemaCA(schema: EC.Schema): AsyncIterable<EC.SchemaDiagnostic<any[]>> {
  if (!schema.name.toLowerCase().includes("dynamic"))
    return;

  if (!schema.customAttributes || !schema.customAttributes.has("CoreCustomAttributes.DynamicSchema")) {
    yield new Diagnostics.SchemaWithDynamicInNameMustHaveDynamicSchemaCA(schema, [schema.schemaKey.toString()]);
  }
}

/**
 * BIS Rule: Classes within the same schema cannot have the same display label.
 */
export async function* schemaClassDisplayLabelMustBeUnique(schema: EC.Schema): AsyncIterable<EC.SchemaDiagnostic<any[]>> {
  const existingLabels = new Map<string, EC.ECClass>();
  for (const ecClass of schema.getClasses()) {
    if (!ecClass.label)
      continue;

    const entry = existingLabels.get(ecClass.label);
    if (entry) {
      yield new Diagnostics.SchemaClassDisplayLabelMustBeUnique(schema, [ecClass.fullName, entry.fullName, ecClass.label]);
      continue;
    }

    existingLabels.set(ecClass.label, ecClass);
  }
}

/** Mixin RULES
 * ************************************************************
 */

/**
 * BIS Rule: A Mixin class cannot override inherited properties.
 */
export async function* mixinsCannotOverrideInheritedProperties(mixin: EC.Mixin): AsyncIterable<EC.SchemaItemDiagnostic<EC.Mixin, any[]>> {
  if (!mixin.properties || !mixin.baseClass)
    return;

  const baseClass = await mixin.baseClass;
  const allBaseProperties = await baseClass.getProperties();
  if (!allBaseProperties || allBaseProperties.length === 0)
    return;

  for (const property of mixin.properties) {
    if (allBaseProperties.some((x) => x.name === property.name))
      yield new Diagnostics.MixinsCannotOverrideInheritedProperties(mixin, [mixin.fullName, property.name]);
  }
}

/** EntityClass RULES
 * ************************************************************
 */

/**
 * BIS Rule: Entity classes must derive from the BIS hierarchy.
 */
export async function* entityClassMustDeriveFromBisHierarchy(entity: EC.EntityClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.EntityClass, any[]>> {
  if (entity.schema.name === bisCoreName)
    return;

  for await (const baseClass of entity.getAllBaseClasses()) {
    if (baseClass.schema.name === bisCoreName)
      return;
  }

  yield new Diagnostics.EntityClassMustDeriveFromBisHierarchy(entity, [entity.fullName]);
}

/**
 * BIS Rule: Entity classes may not inherit a property from more than one base class or mixin.
 */
export async function* entityClassMayNotInheritSameProperty(entity: EC.EntityClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.EntityClass, any[]>> {
  const baseClass = await entity.baseClass;
  if (entity.mixins.length === 0 || entity.mixins.length === 1 && !baseClass)
    return;

  // The properties of each base class must be retrieved separately in order to discover duplicates.
  // entity.getProperties() would merge them in a map, removing duplicates...
  const allProperties: EC.Property[] = [];
  if (baseClass) {
    allProperties.push(...await baseClass.getProperties());
  }
  for (const promise of entity.mixins) {
    const mixin = await promise;
    allProperties.push(...await mixin.getProperties());
  }

  // Now find duplicates in the array
  const seenProps = new Map<string, EC.Property>();
  for (const prop of allProperties) {
    if (prop.class.name === entity.name)
      continue;

    if (seenProps.has(prop.name)) {
      const prevProp = seenProps.get(prop.name);
      yield new Diagnostics.EntityClassMayNotInheritSameProperty(entity, [entity.fullName, prop.name, prevProp!.class.fullName, prop.class.fullName]);
      continue;
    }

    seenProps.set(prop.name, prop);
  }
}

/**
 * BIS Rule: If an ElementMultiAspect exists, there must be a relationship that derives from the ElementOwnsMultiAspects
 * relationship with this class supported as a target constraint.
 */
export async function* elementMultiAspectMustHaveCorrespondingRelationship(entity: EC.EntityClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.EntityClass, any[]>> {
  const context = entity.schema.context;
  if (!context)
    throw new EC.ECObjectsError(EC.ECObjectsStatus.SchemaContextUndefined, `Schema context is undefined for schema ${entity.schema.fullName}.`);

  if (!await entity.is(elementMultiAspectName, bisCoreName))
    return;

  let relationships = Array.from(entity.schema.getClasses());
  relationships = relationships.filter((c) => c.schemaItemType === EC.SchemaItemType.RelationshipClass);
  if (relationships.length === 0) {
    yield new Diagnostics.ElementMultiAspectMustHaveCorrespondingRelationship(entity, [entity.fullName]);
    return;
  }

  for (const relationship of relationships) {
    if (!await relationship.is(elementOwnsMultiAspectsName, bisCoreName))
      continue;

    if ((relationship as EC.RelationshipClass).target.supportsClass(entity))
      return;
  }

  yield new Diagnostics.ElementMultiAspectMustHaveCorrespondingRelationship(entity, [entity.fullName]);
}

/**
 * BIS Rule: If an ElementUniqueAspect exists, there must be a relationship that derives from the ElementOwnsUniqueAspect
 * relationship with this class supported as a target constraint.
 */
export async function* elementUniqueAspectMustHaveCorrespondingRelationship(entity: EC.EntityClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.EntityClass, any[]>> {
  const context = entity.schema.context;
  if (!context)
    throw new EC.ECObjectsError(EC.ECObjectsStatus.SchemaContextUndefined, `Schema context is undefined for schema ${entity.schema.fullName}.`);

  if (!await entity.is(elementUniqueAspectName, bisCoreName))
    return;

  let relationships = Array.from(entity.schema.getClasses());
  relationships = relationships.filter((c) => c.schemaItemType === EC.SchemaItemType.RelationshipClass);
  if (relationships.length === 0) {
    yield new Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(entity, [entity.fullName]);
    return;
  }

  for (const relationship of relationships) {
    if (!await relationship.is(elementOwnsUniqueAspectName, bisCoreName))
      continue;

    if ((relationship as EC.RelationshipClass).target.supportsClass(entity))
      return;
  }

  yield new Diagnostics.ElementUniqueAspectMustHaveCorrespondingRelationship(entity, [entity.fullName]);
}

/**
 * BIS Rule: Entity classes cannot implement both bis:IParentElement and bis:ISubModeledElement.
 */
export async function* entityClassesCannotDeriveFromIParentElementAndISubModeledElement(entity: EC.EntityClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.EntityClass, any[]>> {
  const context = entity.schema.context;
  if (!context)
    throw new EC.ECObjectsError(EC.ECObjectsStatus.SchemaContextUndefined, `Schema context is undefined for schema ${entity.schema.fullName}.`);

  if (await entity.is(iParentElementName, bisCoreName) && await entity.is(iSubModeledElementName, bisCoreName))
    yield new Diagnostics.EntityClassesCannotDeriveFromIParentElementAndISubModeledElement(entity, [entity.fullName]);
}

/**
 * BIS Rule: Entity classes cannot drive from bis:PhysicalModel, bis:SpatialLocationModel, bis:GroupInformationModel, bis:InformationRecordModel,
 * bis:DefinitionModel, bis:DocumentListModel, or bis:LinkModel.
 */
export async function* entityClassesCannotDeriveFromModelClasses(entity: EC.EntityClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.EntityClass, any[]>> {
  if (entity.schema.name === bisCoreName)
    return;

  const context = entity.schema.context;
  if (!context)
    throw new EC.ECObjectsError(EC.ECObjectsStatus.SchemaContextUndefined, `Schema context is undefined for schema ${entity.schema.fullName}.`);

  const bisCore = await context.getSchema(new EC.SchemaKey(bisCoreName));
  if (!bisCore || !entity.baseClass || entity.baseClass.schemaName !== bisCoreName)
    return;

  const modelNames = [physicalModelName, spatialLocationModelName, informationRecordModelName,
    definitionModelName, documentListModelName, linkModelModelName];

  for (const modelName of modelNames) {
    const modelClass = await bisCore.getItem(modelName);
    if (!modelClass)
      throw new EC.ECObjectsError(EC.ECObjectsStatus.ClassNotFound, `Class ${modelName} could not be found.`);

    const isModel = await entity.is(modelClass as EC.ECClass);
    if (isModel)
      yield new Diagnostics.EntityClassesCannotDeriveFromModelClasses(entity, [entity.fullName, modelClass.fullName]);
  }
}

/**
 * BIS Rule: Subclasses of bis:Model cannot have additional properties defined outside of BisCore.
 */
export async function* bisModelSubClassesCannotDefineProperties(entity: EC.EntityClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.EntityClass, any[]>> {
  if (entity.schema.name === bisCoreName)
    return;

  const context = entity.schema.context;
  if (!context)
    throw new EC.ECObjectsError(EC.ECObjectsStatus.SchemaContextUndefined, `Schema context is undefined for schema ${entity.schema.fullName}.`);

  const bisCore = await context.getSchema(new EC.SchemaKey(bisCoreName));
  if (!bisCore || !entity.baseClass || entity.baseClass.schemaName !== bisCoreName)
    return;

  const modelClass = await bisCore.getItem(bisModelName);
  if (!modelClass)
    throw new EC.ECObjectsError(EC.ECObjectsStatus.ClassNotFound, `Class ${bisModelName} could not be found.`);

  const isModel = await entity.is(modelClass as EC.ECClass);
  if (!isModel)
    return;

  if (entity.properties)
    yield new Diagnostics.BisModelSubClassesCannotDefineProperties(entity, [entity.fullName]);
}

/**
 * BIS Rule: Entity classes may not subclass deprecated classes.
 */
export async function* entityClassesMayNotSubclassDeprecatedClasses(entity: EC.EntityClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.EntityClass, any[]>> {
  if (!entity.baseClass)
    return;

  // If the class itself is deprecated, the rule should pass
  if (entity.customAttributes && entity.customAttributes.has(deprecatedFullName))
    return;

  const baseClass = await entity.baseClass;
  if (baseClass.customAttributes && baseClass.customAttributes.has(deprecatedFullName))
    yield new Diagnostics.EntityClassesMayNotSubclassDeprecatedClasses(entity, [entity.fullName, baseClass.fullName]);
}

/** RelationshipClass RULES
 * ************************************************************
 */

/** BIS Rule: Relationship classes must not use the holding strength. */
export async function* relationshipClassMustNotUseHoldingStrength(relationshipClass: EC.RelationshipClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.RelationshipClass, any[]>> {
  if (relationshipClass.strength === EC.StrengthType.Holding)
    yield new Diagnostics.RelationshipClassMustNotUseHoldingStrength(relationshipClass, [relationshipClass.fullName]);
}

/** BIS Rule: Relationship classes must not have a source constraint multiplicity upper bound greater than 1 if the strength is embedding and the direction is forward. */
export async function* relationshipSourceMultiplicityUpperBoundRestriction(relationshipClass: EC.RelationshipClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.RelationshipClass, any[]>> {
  if (relationshipClass.strength !== EC.StrengthType.Embedding || relationshipClass.strengthDirection !== EC.StrengthDirection.Forward)
    return;

  const multiplicity = relationshipClass.source.multiplicity;
  if (multiplicity && multiplicity.upperLimit > 1)
    yield new Diagnostics.RelationshipSourceMultiplicityUpperBoundRestriction(relationshipClass, [relationshipClass.fullName]);
}

/** BIS Rule: Relationship classes must not have a target constraint multiplicity upper bound greater than 1 if the strength is embedding and the direction is backward. */
export async function* relationshipTargetMultiplicityUpperBoundRestriction(relationshipClass: EC.RelationshipClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.RelationshipClass, any[]>> {
  if (relationshipClass.strength !== EC.StrengthType.Embedding || relationshipClass.strengthDirection !== EC.StrengthDirection.Backward)
    return;

  const multiplicity = relationshipClass.target.multiplicity;
  if (multiplicity && multiplicity.upperLimit > 1)
    yield new Diagnostics.RelationshipTargetMultiplicityUpperBoundRestriction(relationshipClass, [relationshipClass.fullName]);
}

/** BIS Rule: Relationship classes must not have an ElementAspect target constraint (or source constraint if direction is backwards), unless they derive from ElementOwnsUniqueAspect or ElementOwnsMultiAspect */
export async function* relationshipElementAspectContraintRestriction(relationshipClass: EC.RelationshipClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.RelationshipClass, any[]>> {
  const context = relationshipClass.schema.context;
  if (!context)
    throw new EC.ECObjectsError(EC.ECObjectsStatus.SchemaContextUndefined, `Schema context is undefined for schema ${relationshipClass.schema.fullName}.`);

  if (await relationshipClass.is(elementOwnsUniqueAspectName, bisCoreName) || await relationshipClass.is(elementOwnsMultiAspectsName, bisCoreName))
    return;

  const constraint = relationshipClass.strengthDirection === EC.StrengthDirection.Forward ? relationshipClass.target : relationshipClass.source;
  if (!constraint.constraintClasses)
    return;

  for (const promise of constraint.constraintClasses) {
    const constraintClass = await promise;
    if (await constraintClass.is(elementAspectName, bisCoreName)) {
      const constraintType = constraint.isSource ? EC.ECStringConstants.RELATIONSHIP_END_SOURCE : EC.ECStringConstants.RELATIONSHIP_END_TARGET;
      yield new Diagnostics.RelationshipElementAspectContraintRestriction(relationshipClass, [relationshipClass.fullName, constraintType]);
    }
  }
}

/** BIS Rule: Embedding relationships should not have 'Has' in the class name. */
export async function* embeddingRelationshipsMustNotHaveHasInName(relationshipClass: EC.RelationshipClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.RelationshipClass, any[]>> {
  if (relationshipClass.strength !== EC.StrengthType.Embedding)
    return;

  if (relationshipClass.name.includes("Has"))
    yield new Diagnostics.EmbeddingRelationshipsMustNotHaveHasInName(relationshipClass, [relationshipClass.fullName]);
}

/** StructClass RULES
 * ************************************************************
 */

/** BIS Rule: Struct classes must not have base classes. */
export async function* structsCannotHaveBaseClasses(structClass: EC.StructClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.StructClass, any[]>> {
  if (structClass.baseClass)
    yield new Diagnostics.StructsCannotHaveBaseClasses(structClass, [structClass.fullName]);
}

/** CustomAttributesClass RULES
 * ************************************************************
 */

/** BIS Rule: CustomAttributes classes must not have base classes. */
export async function* customAttributeClassCannotHaveBaseClasses(customAttribute: EC.CustomAttributeClass): AsyncIterable<EC.SchemaItemDiagnostic<EC.CustomAttributeClass, any[]>> {
  if (customAttribute.baseClass)
    yield new Diagnostics.CustomAttributeClassCannotHaveBaseClasses(customAttribute, [customAttribute.fullName]);
}

/** KindOfQuantity RULES
 * ************************************************************
 */

/** BIS Rule: Kind Of Quantities must not use 'PERCENTAGE' or other unitless ratios. */
export async function* koqMustNotUseUnitlessRatios(koq: EC.KindOfQuantity): AsyncIterable<EC.SchemaItemDiagnostic<EC.KindOfQuantity, any[]>> {
  const unit = await koq.persistenceUnit;
  if (!unit || !(unit instanceof EC.Unit))
    return;

  const phenomenon = await unit.phenomenon;
  if (!phenomenon)
    return;

  if (phenomenon.name === percentagePhenomenonName)
    yield new Diagnostics.KOQMustNotUseUnitlessRatios(koq, [koq.fullName]);
}

/** BIS Rule: Kind Of Quantities must use an SI Unit for their persistence unit. */
export async function* koqMustUseSIUnitForPersistenceUnit(koq: EC.KindOfQuantity): AsyncIterable<EC.SchemaItemDiagnostic<EC.KindOfQuantity, any[]>> {
  const unit = await koq.persistenceUnit;
  if (!unit || !(unit instanceof EC.Unit))
    return;

  const unitSystem = await unit.unitSystem;
  if (!unitSystem)
    return;

  if (unitSystem.name !== siUnitSystemName)
    yield new Diagnostics.KOQMustUseSIUnitForPersistenceUnit(koq, [koq.fullName, unitSystem.fullName]);
}

/** BIS Rule: Kind Of Quantities must not have duplicate presentation formats. */
export async function* koqDuplicatePresentationFormat(koq: EC.KindOfQuantity): AsyncIterable<EC.SchemaItemDiagnostic<EC.KindOfQuantity, any[]>> {
  const koqSchema = koq.schema.schemaKey;
  const maxAllowedAecUnits: EC.SchemaKey = new EC.SchemaKey("AecUnits", 1, 0, 2);
  const isExceptionAecUnits = koqSchema.compareByName(maxAllowedAecUnits) && koqSchema.compareByVersion(maxAllowedAecUnits) < 0;
  if (koq.fullName === "AecUnits.LENGTH_SHORT" && isExceptionAecUnits)
    return;

  const formats = koq.presentationUnits;
  if (!formats)
    return;

  const uniqueFormatNames: string[] = [];

  for (const format of formats) {
    if (uniqueFormatNames.includes(format.fullName))
      yield new Diagnostics.KOQDuplicatePresentationFormat(koq, [koq.fullName, format.fullName]);

    uniqueFormatNames.push(format.fullName);
  }
}

/** Property RULES
 * ************************************************************
 */

/** BIS Rule: Properties should not be of type long. These properties should be navigation properties if they represent a FK or be of type int or double if they represent a number. */
export async function* propertyShouldNotBeOfTypeLong(property: EC.AnyProperty): AsyncIterable<EC.PropertyDiagnostic<any[]>> {
  const primitiveType = getPrimitiveType(property);
  if (!primitiveType)
    return;

  if (primitiveType === EC.PrimitiveType.Long) {
    yield new Diagnostics.PropertyShouldNotBeOfTypeLong(property, [property.class.fullName, property.name]);
  }
}

/** BIS Rule: Properties must use the following supported ExtendedTypes: BeGuid, GeometrySystem, and Json */
export async function* propertyHasInvalidExtendedType(property: EC.AnyProperty): AsyncIterable<EC.PropertyDiagnostic<any[]>> {
  if (!(property instanceof EC.PrimitiveOrEnumPropertyBase))
    return;

  if (!property.extendedTypeName)
    return;

  if (!validExtendedTypes.includes(property.extendedTypeName))
    yield new Diagnostics.PropertyHasInvalidExtendedType(property, [property.class.fullName, property.name, property.extendedTypeName]);
}

/** BIS Rule: Properties must not use CustomAttribute bis:CustomHandledProperty unless CustomAttribute bis:ClassHasHandler is defined on their parent class (not derived from a base class). */
export async function* propertyMustNotUseCustomHandledPropertyRestriction(property: EC.AnyProperty): AsyncIterable<EC.PropertyDiagnostic<any[]>> {
  if (!property.customAttributes)
    return;

  if (!property.customAttributes.has(customHandledPropertyName))
    return;

  const parentAttributes = property.class.customAttributes;
  if (!parentAttributes || !parentAttributes.has(classHasHandlerName))
    yield new Diagnostics.PropertyMustNotUseCustomHandledPropertyRestriction(property, [property.class.fullName, property.name]);
}

/** ECClass RULES */

/** BIS Rule: Properties within the same class and category cannot have the same display label. */
export async function* multiplePropertiesInClassWithSameLabel(ecClass: EC.AnyClass): AsyncIterable<EC.ClassDiagnostic<any[]>> {
  if (!ecClass.properties)
    return;

  const visitedProperties: EC.Property[] = [];
  for (const property of ecClass.properties) {
    const label = property.label;
    if (!label)
      continue;

    const category = await property.category;

    for (const seenProperty of visitedProperties) {
      if (seenProperty.label === label) {
        const seenCategory = await seenProperty.category;
        if (!seenCategory && !category)
          yield new Diagnostics.MultiplePropertiesInClassWithSameLabel(ecClass, [ecClass.fullName, seenProperty.name, property.name, label]);

        if (!seenCategory || !category)
          continue;

        if (seenCategory.fullName === category.fullName)
          yield new Diagnostics.MultiplePropertiesInClassWithSameLabel(ecClass, [ecClass.fullName, seenProperty.name, property.name, label]);
      }
    }

    visitedProperties.push(property);
  }
}

/** BIS Rule: ClassHasHandler cannot applied outside of BisCore, Functional, and Generic Schema */
export async function* classHasHandlerCACannotAppliedOutsideCoreSchemas(ecClass: EC.AnyClass): AsyncIterable<EC.ClassDiagnostic<any[]>> {
  if (ecClass.customAttributes === undefined)
    return;

  const schemaName: string = ecClass.schema.name;
  const isExceptionSchema = (schemaName === "BisCore") || (schemaName === "Functional") || (schemaName === "Generic");
  if (!isExceptionSchema && ecClass.customAttributes.has(classHasHandlerCAFullName)) {
    yield new Diagnostics.ClassHasHandlerCACannotAppliedOutsideCoreSchemas(ecClass, [ecClass.fullName, ecClass.schema.name]);
  }
}
