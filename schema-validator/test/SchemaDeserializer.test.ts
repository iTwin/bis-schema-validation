/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";

import * as path from "path";
import * as utils from "./utilities/utils";
import * as EC from "@bentley/ecschema-metadata";
import { SchemaDeserializer } from "../src/SchemaDeserializer";
import { IModelHost } from "@bentley/imodeljs-backend";

use(chaiAsPromised);

describe("SchemaXmlFileDeserializer", () => {
  const assetDeserializationDir = path.join(utils.getAssetsDir(), "xml-deserialization");
  const refDir = path.join(assetDeserializationDir, "references");

  afterEach(() => {
    IModelHost.shutdown();
  });

  it("With references in separate folder, should successfully deserialize schema.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "SchemaA.ecschema.xml");

    const context = new EC.SchemaContext();
    const result = await deserializer.deserializeXmlFile(schemaPath, context, [refDir]);

    const schemaA = await context.getSchema(new EC.SchemaKey("SchemaA", 1, 1, 1), EC.SchemaMatchType.Exact);
    expect(schemaA).not.to.be.undefined;
    expect(result === schemaA).to.be.true;

    const schemaB = await schemaA!.getReference("SchemaB");
    const schemaC = await schemaA!.getReference("SchemaC");
    expect(schemaB).not.to.be.undefined;
    expect(schemaC).not.to.be.undefined;
    expect(schemaB!.schemaKey.name).to.eql("SchemaB");
    expect(schemaC!.schemaKey.name).to.eql("SchemaC");
  });

  it("No references, should successfully deserialize schema.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(refDir, "SchemaD.ecschema.xml");

    const context = new EC.SchemaContext();
    const result = await deserializer.deserializeXmlFile(schemaPath, context);

    const schemaD = await context.getSchema(new EC.SchemaKey("SchemaD", 4, 0, 4), EC.SchemaMatchType.Exact);
    expect(schemaD).not.to.be.undefined;
    expect(result === schemaD).to.be.true;
  });

  it("Non-existent reference schema, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "BadRefSchema.ecschema.xml");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, "Unable to load schema 'BadRefSchema'. A referenced schema could not be found.");
  });

  it("Schema XML has no version, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "SchemaNoVersion.ecschema.xml");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, "Could not find the ECSchema 'schemaName' or 'version' tag in the given file.");
  });

  it("Non-existent schema, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "DoesNotExist.ecschema.xml");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, `Unable to locate schema XML file at ${schemaPath}`);
  });

  it("Should successfully parse BisCore schema", async () => {
    const schemaContext = new EC.SchemaContext();
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "BisCore.01.00.00.ecschema.xml");
    const biscore = await deserializer.deserializeXmlFile(schemaPath, schemaContext);
    expect(biscore).not.to.be.undefined;

    const coreCA = biscore.getReferenceSync("CoreCustomAttributes");
    expect(coreCA).not.to.be.undefined;
    expect(coreCA!.schemaKey.toString()).to.eql("CoreCustomAttributes.01.00.03");

    const ecdbMap = biscore.getReferenceSync("ECDbMap");
    expect(ecdbMap).not.to.be.undefined;
    expect(ecdbMap!.schemaKey.toString()).to.be.eql("ECDbMap.02.00.00");

    const ecdbPolicies = biscore.getReferenceSync("ECDbSchemaPolicies");
    expect(ecdbPolicies).not.to.be.undefined;
    expect(ecdbPolicies!.schemaKey.toString()).to.be.eql("ECDbSchemaPolicies.01.00.00");
  });

  it("Should successfully parse Format and Unit", async () => {
    const schemaContext = new EC.SchemaContext();
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "Formats.01.00.00.ecschema.xml");
    const format = await deserializer.deserializeXmlFile(schemaPath, schemaContext);
    expect(format).not.to.be.undefined;

    const unit = format.getReferenceSync("Units");
    expect(unit).not.to.be.undefined;
    expect(unit!.schemaKey.toString()).to.eql("Units.01.00.00");
  });

  it("should successfully parse comprehensive schema", async () => {
    const schemaContext = new EC.SchemaContext();
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "ComprehensiveSchema.01.00.00.ecschema.xml");
    const comprehensiveSchema = await deserializer.deserializeXmlFile(schemaPath, schemaContext);
    expect(comprehensiveSchema).not.to.be.undefined;

    const coreCA = comprehensiveSchema.getReferenceSync("CoreCustomAttributes");
    expect(coreCA).not.to.be.undefined;
    expect(coreCA!.schemaKey.toString()).to.eql("CoreCustomAttributes.01.00.03");

    const biscore = comprehensiveSchema.getReferenceSync("BisCore");
    expect(biscore).not.to.be.undefined;
    expect(biscore!.schemaKey.toString()).to.eql("BisCore.01.00.00");

    const unit = comprehensiveSchema.getReferenceSync("Units");
    expect(unit).not.to.be.undefined;
    expect(unit!.schemaKey.toString()).to.eql("Units.01.00.00");

    const format = comprehensiveSchema.getReferenceSync("Formats");
    expect(format).not.to.be.undefined;
    expect(format!.schemaKey.toString()).to.eql("Formats.01.00.00");
  });

  it("should successfully parse schema PartialComprehensiveSchema", async () => {
    const schemaContext = new EC.SchemaContext();
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "PartialComprehensiveSchema.ecschema.xml");
    const partialComprehensiveSchema = await deserializer.deserializeXmlFile(schemaPath, schemaContext);
    expect(partialComprehensiveSchema).not.to.be.undefined;

    const coreCA = partialComprehensiveSchema.getReferenceSync("CoreCustomAttributes");
    expect(coreCA).not.to.be.undefined;
    expect(coreCA!.schemaKey.toString()).to.eql("CoreCustomAttributes.01.00.03");

    const biscore = partialComprehensiveSchema.getReferenceSync("BisCore");
    expect(biscore).not.to.be.undefined;
    expect(biscore!.schemaKey.toString()).to.eql("BisCore.01.00.00");

    const comprehensiveSchema = partialComprehensiveSchema.getReferenceSync("ComprehensiveSchema");
    expect(comprehensiveSchema).not.to.be.undefined;
    expect(comprehensiveSchema!.schemaKey.toString()).to.eql("ComprehensiveSchema.01.00.00");

    // check schema items
    const generalCA = partialComprehensiveSchema.getItemSync("GeneralCustomAttribute") as EC.CustomAttributeClass;
    expect(generalCA).not.to.be.undefined;

    const schemaCA = partialComprehensiveSchema.getItemSync("SchemaCustomAttribute") as EC.CustomAttributeClass;
    expect(schemaCA).not.to.be.undefined;

    const intEnum = partialComprehensiveSchema.getItemSync("IntEnumeration") as EC.Enumeration;
    expect(intEnum).not.to.be.undefined;
    expect(intEnum.isInt).to.be.true;
    expect(intEnum.getEnumeratorByName("IntEnumeration1")!.value === 1).to.be.true;
    expect(intEnum.getEnumeratorByName("IntEnumeration2")!.value === 2).to.be.true;
    expect(intEnum.getEnumeratorByName("IntEnumeration3")!.value === 3).to.be.true;

    const stringEnum = partialComprehensiveSchema.getItemSync("StringEnumeration") as EC.Enumeration;
    expect(stringEnum).not.to.be.undefined;
    expect(stringEnum.isString).to.be.true;
    expect(stringEnum.getEnumeratorByName("spring")!.value === "spring").to.be.true;
    expect(stringEnum.getEnumeratorByName("summer")!.value === "summer").to.be.true;
    expect(stringEnum.getEnumeratorByName("fall")!.value === "fall").to.be.true;
    expect(stringEnum.getEnumeratorByName("winter")!.value === "winter").to.be.true;

    const abstractEntity = partialComprehensiveSchema.getItemSync("AbstractEntityClass") as EC.EntityClass;
    expect(abstractEntity).not.to.be.undefined;
    expect(abstractEntity.modifier === EC.ECClassModifier.Abstract).to.be.true;
    expect(abstractEntity.getPropertySync("AbstractClassProperty1")!.propertyType === EC.PropertyType.DateTime).to.be.true;

    const abstractDerivedEntity = partialComprehensiveSchema.getItemSync("AbstractDerivedAbstract") as EC.EntityClass;
    expect(abstractDerivedEntity).not.to.be.undefined;
    expect(abstractDerivedEntity.getBaseClassSync() === abstractEntity).to.be.true;

    const mixinClass = partialComprehensiveSchema.getItemSync("MixinClass") as EC.Mixin;
    expect(mixinClass).not.to.be.undefined;
    expect(mixinClass.getPropertySync("MixinStringPrimitive")!.propertyType === EC.PropertyType.String).to.be.true;
    expect(mixinClass.getPropertySync("MixinBinaryPrimitive")!.propertyType === EC.PropertyType.Binary).to.be.true;
    expect(mixinClass.getPropertySync("MixinDateTimePrimitive")!.propertyType === EC.PropertyType.DateTime).to.be.true;
    expect(mixinClass.getPropertySync("MixinDoublePrimitive")!.propertyType === EC.PropertyType.Double).to.be.true;
    expect(mixinClass.getPropertySync("MixinIGeometryPrimitive")!.propertyType === EC.PropertyType.IGeometry).to.be.true;
    expect(mixinClass.getPropertySync("MixinIntPrimitive")!.propertyType === EC.PropertyType.Integer).to.be.true;
    expect(mixinClass.getPropertySync("MixinLongPrimitive")!.propertyType === EC.PropertyType.Long).to.be.true;
    expect(mixinClass.getPropertySync("MixinPoint2dPrimitive")!.propertyType === EC.PropertyType.Point2d).to.be.true;
    expect(mixinClass.getPropertySync("MixinPoint3dPrimitive")!.propertyType === EC.PropertyType.Point3d).to.be.true;
    expect(mixinClass.getPropertySync("MixinIntEnumerationPrimitive")!.propertyType === EC.PropertyType.Integer_Enumeration).to.be.true;
    expect(mixinClass.getPropertySync("MixinStringEnumerationPrimitive")!.propertyType === EC.PropertyType.Integer_Enumeration).to.be.true; // bug in xml deserializer???

    const baseEntity = partialComprehensiveSchema.getItemSync("BaseEntity") as EC.EntityClass;
    expect(baseEntity).not.to.be.undefined;
    expect(baseEntity.modifier === EC.ECClassModifier.Abstract).to.be.true;
    expect(baseEntity.getBaseClassSync()!.fullName).to.eql("BisCore.GraphicalModel2d");
    expect(Array.from(baseEntity.getMixinsSync())[0] === mixinClass).to.be.true;
    expect(baseEntity.getPropertySync("InheritedProperty")!.propertyType === EC.PropertyType.String).to.be.true;

    const customStructCA = partialComprehensiveSchema.getItemSync("CustomStructClassAttribute") as EC.CustomAttributeClass;
    expect(customStructCA).not.to.be.undefined;

    const customAnyClassCA = partialComprehensiveSchema.getItemSync("CustomAnyClassAttribute") as EC.CustomAttributeClass;
    expect(customAnyClassCA).not.to.be.undefined;

    const struct = partialComprehensiveSchema.getItemSync("Struct") as EC.StructClass;
    expect(struct).not.to.be.undefined;
    expect(struct.getPropertySync("StructStringPrimitive")!.propertyType === EC.PropertyType.String).to.be.true;
    expect(struct.getPropertySync("StructBinaryPrimitive")!.propertyType === EC.PropertyType.Binary).to.be.true;
    expect(struct.getPropertySync("StructDateTimePrimitive")!.propertyType === EC.PropertyType.DateTime).to.be.true;
    expect(struct.getPropertySync("StructDoublePrimitive")!.propertyType === EC.PropertyType.Double).to.be.true;
    expect(struct.getPropertySync("StructIGeometryPrimitive")!.propertyType === EC.PropertyType.IGeometry).to.be.true;
    const customAttributes = [];
    for (const [, customAttribute] of struct.customAttributes!) {
      customAttributes.push(customAttribute);
    }
    expect(customAttributes[0].className).to.eql("PartialComprehensiveSchema.GeneralCustomAttribute");
    expect(customAttributes[1].className).to.eql("PartialComprehensiveSchema.CustomStructClassAttribute");
    expect(customAttributes[2].className).to.eql("PartialComprehensiveSchema.CustomAnyClassAttribute");

    const derivedStruct = partialComprehensiveSchema.getItemSync("DerivedStruct") as EC.StructClass;
    expect(derivedStruct).not.to.be.undefined;
    expect(derivedStruct.getBaseClassSync() === struct).to.be.true;
  });

  it.skip("Test for cyclic references", async () => {
    // Round 1
    // B ----> C ----> D ---
    // ^                   |
    // |___________________|
    let deserializer = new SchemaDeserializer();
    let schemaPath = path.join(assetDeserializationDir, "cyclic-references", "round1", "SchemaB.ecschema.xml");
    await expect(deserializer.deserializeXmlFile(schemaPath, new EC.SchemaContext())).
    to.be.rejectedWith(`Schema SchemaD.01.00.02 and SchemaB.01.00.01 form cyclic dependency`);

    // Round 2
    // B---->C ---
    //       ^   |
    //       |___|
    deserializer = new SchemaDeserializer();
    schemaPath = path.join(assetDeserializationDir, "cyclic-references", "round2", "SchemaB.ecschema.xml");
    await expect(deserializer.deserializeXmlFile(schemaPath, new EC.SchemaContext()))
    .to.be.rejectedWith(`Schema SchemaC.01.00.00 and SchemaC.01.00.00 form cyclic dependency`);

    // Round 3
    // B ------>C
    //   \    /
    //    \  /
    //     \/
    //     \/
    //      D-----------> PartialComprehensiveSchema (references BisCore and so on with no cyclic dependencies here)
    deserializer = new SchemaDeserializer();
    const schemaContext = new EC.SchemaContext();
    schemaPath = path.join(assetDeserializationDir, "cyclic-references", "round3", "SchemaB.ecschema.xml");
    const schemaB = await deserializer.deserializeXmlFile(schemaPath, schemaContext, [assetDeserializationDir]);
    expect(schemaB).not.to.be.undefined;

    const schemaC = schemaB.getReferenceSync("SchemaC");
    expect(schemaC).not.to.be.undefined;
    expect(schemaC!.schemaKey.toString()).to.eql("SchemaC.01.00.00");

    const schemaD = schemaB.getReferenceSync("SchemaD");
    expect(schemaD).not.to.be.undefined;
    expect(schemaD!.schemaKey.toString()).to.eql("SchemaD.01.00.02");

    const partialComprehensiveSchema = schemaD!.getReferenceSync("PartialComprehensiveSchema");
    expect(partialComprehensiveSchema).not.to.be.undefined;
    expect(partialComprehensiveSchema!.schemaKey.toString()).to.eql("PartialComprehensiveSchema.01.00.00");

    expect(schemaC!.getReferenceSync("SchemaD") === schemaD).to.be.true;
  });
});


describe("SchemaJsonFileDeserializer", () => {
  const assetDeserializationDir = path.join(utils.getAssetsDir(), "json-deserialization");
  const refDir = path.join(assetDeserializationDir, "references");

  it("With references in separate folder, should successfully deserialize schema.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "SchemaA.ecschema.json");

    const context = new EC.SchemaContext();
    const result = await deserializer.deserializeJsonFile(schemaPath, context, [refDir]);

    const schemaA = await context.getSchema(new EC.SchemaKey("SchemaA", 1, 1, 1), EC.SchemaMatchType.Exact);
    expect(schemaA).not.to.be.undefined;
    expect(result === schemaA).to.be.true;

    const schemaB = await schemaA!.getReference("SchemaB");
    const schemaC = await schemaA!.getReference("SchemaC");
    expect(schemaB).not.to.be.undefined;
    expect(schemaC).not.to.be.undefined;
    expect(schemaB!.schemaKey.name).to.eql("SchemaB");
    expect(schemaC!.schemaKey.name).to.eql("SchemaC");
  });

  it("No references, should successfully deserialize schema.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(refDir, "SchemaD.ecschema.json");

    const context = new EC.SchemaContext();
    const result = await deserializer.deserializeJsonFile(schemaPath, context);

    const schemaD = await context.getSchema(new EC.SchemaKey("SchemaD", 4, 4, 4), EC.SchemaMatchType.Exact);
    expect(schemaD).not.to.be.undefined;
    expect(result === schemaD).to.be.true;
  });

  it("Non-existent schema, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "DoesNotExist.ecschema.json");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeJsonFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, `Unable to locate schema JSON file at ${schemaPath}`);
  });

  it("Non-existent reference schema, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "BadRefSchema.ecschema.json");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeJsonFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, "Could not locate the referenced schema, DoesNotExist.01.00.00, of BadRefSchema");
  });

  it("Schema contains bad JSON, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetDeserializationDir, "BadJson.ecschema.json");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeJsonFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError);
  });
});