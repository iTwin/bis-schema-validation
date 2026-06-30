/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";

import * as path from "path";
import * as EC from "@itwin/ecschema-metadata";
import { SchemaDeserializer } from "../SchemaDeserializer";

use(chaiAsPromised);

const assetsDir = path.normalize(__dirname + "/assets/");

describe("SchemaDeserializer", () => {
  const refDir = path.join(assetsDir, "references");

  it("With references in separate folder, should successfully deserialize schema.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "SchemaA.ecschema.xml");

    const context = new EC.SchemaContext();
    const result = await deserializer.deserializeXmlFile(schemaPath, context, [refDir]);

    const schemaA = await context.getSchema(new EC.SchemaKey("SchemaA", 1, 1, 1), EC.SchemaMatchType.Exact) as EC.Schema;
    expect(schemaA).not.to.be.undefined;
    expect(result === schemaA).to.be.true;

    const schemaB = await schemaA.getReference("SchemaB") as EC.Schema;
    const schemaC = await schemaA.getReference("SchemaC") as EC.Schema;
    expect(schemaB).not.to.be.undefined;
    expect(schemaC).not.to.be.undefined;
    expect(schemaB.schemaKey.name).to.eql("SchemaB");
    expect(schemaC.schemaKey.name).to.eql("SchemaC");
  });

  it("No references, should successfully deserialize schema.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(refDir, "SchemaD.ecschema.xml");

    const context = new EC.SchemaContext();
    const result = await deserializer.deserializeXmlFile(schemaPath, context, [assetsDir]);

    const schemaD = await context.getSchema(new EC.SchemaKey("SchemaD", 4, 4, 4), EC.SchemaMatchType.Exact) as EC.Schema;
    expect(schemaD).not.to.be.undefined;
    expect(result === schemaD).to.be.true;
  });

  it("EC v2.0 schema, should successfully deserialize schema.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "ECv2Schema.ecschema.xml");

    const context = new EC.SchemaContext();
    const result = await deserializer.deserializeXmlFile(schemaPath, context);

    const schema = await context.getSchema(new EC.SchemaKey("ECv2Schema", 1, 0, 1), EC.SchemaMatchType.Exact) as EC.Schema;
    expect(schema).not.to.be.undefined;
    expect(result === schema).to.be.true;
  });

  it("Non-existent reference schema, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "BadRefSchema.ecschema.xml");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECSchemaError, "Unable to locate referenced schema: DoesNotExist.1.1.1");
  });

  it("Schema XML has no version, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "SchemaNoVersion.ecschema.xml");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECSchemaError, "Could not find the ECSchema 'schemaName' or 'version' tag in the given file.");
  });

  it("Non-existent schema, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "DoesNotExist.ecschema.xml");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECSchemaError, `Unable to locate schema XML file at ${schemaPath}`);
  });

  it("Should successfully parse BisCore schema", async () => {
    const schemaContext = new EC.SchemaContext();
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "BisCore.01.00.00.ecschema.xml");
    const biscore = await deserializer.deserializeXmlFile(schemaPath, schemaContext);
    expect(biscore).not.to.be.undefined;

    const coreCA = biscore.getReferenceSync("CoreCustomAttributes") as EC.Schema;
    expect(coreCA).not.to.be.undefined;
    expect(coreCA.schemaKey.toString()).to.eql("CoreCustomAttributes.01.00.04");

    const ecdbMap = biscore.getReferenceSync("ECDbMap") as EC.Schema;
    expect(ecdbMap).not.to.be.undefined;
    expect(ecdbMap.schemaKey.toString()).to.be.eql("ECDbMap.02.00.00");

    const ecdbPolicies = biscore.getReferenceSync("ECDbSchemaPolicies") as EC.Schema;
    expect(ecdbPolicies).not.to.be.undefined;
    expect(ecdbPolicies.schemaKey.toString()).to.be.eql("ECDbSchemaPolicies.01.00.00");
  });

  it("Should successfully parse Format and Unit", async () => {
    const schemaContext = new EC.SchemaContext();
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "Formats.01.00.00.ecschema.xml");
    const format = await deserializer.deserializeXmlFile(schemaPath, schemaContext);
    expect(format).not.to.be.undefined;

    const unit = format.getReferenceSync("Units") as EC.Schema;
    expect(unit).not.to.be.undefined;
    expect(unit.schemaKey.toString()).to.eql("Units.01.00.00");
  });

  it("should successfully parse comprehensive schema", async () => {
    const schemaContext = new EC.SchemaContext();
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "ComprehensiveSchema.01.00.00.ecschema.xml");
    const comprehensiveSchema = await deserializer.deserializeXmlFile(schemaPath, schemaContext);
    expect(comprehensiveSchema).not.to.be.undefined;

    const coreCA = comprehensiveSchema.getReferenceSync("CoreCustomAttributes") as EC.Schema;
    expect(coreCA).not.to.be.undefined;
    expect(coreCA.schemaKey.toString()).to.eql("CoreCustomAttributes.01.00.04");

    const biscore = comprehensiveSchema.getReferenceSync("BisCore") as EC.Schema;
    expect(biscore).not.to.be.undefined;
    expect(biscore.schemaKey.toString()).to.eql("BisCore.01.00.00");

    const unit = comprehensiveSchema.getReferenceSync("Units") as EC.Schema;
    expect(unit).not.to.be.undefined;
    expect(unit.schemaKey.toString()).to.eql("Units.01.00.00");

    const format = comprehensiveSchema.getReferenceSync("Formats") as EC.Schema;
    expect(format).not.to.be.undefined;
    expect(format.schemaKey.toString()).to.eql("Formats.01.00.00");
  });

  it("should successfully parse test AecUnits schema", async () => {
    const schemaContext = new EC.SchemaContext();
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "AecUnits.01.00.01.ecschema.xml");
    const aecUnits = await deserializer.deserializeXmlFile(schemaPath, schemaContext);
    expect(aecUnits).not.to.be.undefined;

    const unit = aecUnits.getReferenceSync("Units") as EC.Schema;
    expect(unit).not.to.be.undefined;
    expect(unit.schemaKey.toString()).to.eql("Units.01.00.00");

    const format = aecUnits.getReferenceSync("Formats") as EC.Schema;
    expect(format).not.to.be.undefined;
    expect(format.schemaKey.toString()).to.eql("Formats.01.00.00");
  });

  it("should successfully parse schema PartialComprehensiveSchema", async () => {
    const schemaContext = new EC.SchemaContext();
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "PartialComprehensiveSchema.ecschema.xml");
    const partialComprehensiveSchema = await deserializer.deserializeXmlFile(schemaPath, schemaContext);
    expect(partialComprehensiveSchema).not.to.be.undefined;

    const coreCA = partialComprehensiveSchema.getReferenceSync("CoreCustomAttributes") as EC.Schema;
    expect(coreCA).not.to.be.undefined;
    expect(coreCA.schemaKey.toString()).to.eql("CoreCustomAttributes.01.00.04");

    const biscore = partialComprehensiveSchema.getReferenceSync("BisCore") as EC.Schema;
    expect(biscore).not.to.be.undefined;
    expect(biscore.schemaKey.toString()).to.eql("BisCore.01.00.00");

    const comprehensiveSchema = partialComprehensiveSchema.getReferenceSync("ComprehensiveSchema") as EC.Schema;
    expect(comprehensiveSchema).not.to.be.undefined;
    expect(comprehensiveSchema.schemaKey.toString()).to.eql("ComprehensiveSchema.01.00.00");

    // check schema items
    const generalCA = partialComprehensiveSchema.getItemSync("GeneralCustomAttribute") as EC.CustomAttributeClass;
    expect(generalCA).not.to.be.undefined;

    const schemaCA = partialComprehensiveSchema.getItemSync("SchemaCustomAttribute") as EC.CustomAttributeClass;
    expect(schemaCA).not.to.be.undefined;

    const intEnum = partialComprehensiveSchema.getItemSync("IntEnumeration") as EC.Enumeration;
    expect(intEnum).not.to.be.undefined;
    expect(intEnum.isInt).to.be.true;
    expect(intEnum.getEnumeratorByName("IntEnumeration1")).to.have.property("value", 1);
    expect(intEnum.getEnumeratorByName("IntEnumeration2")).to.have.property("value", 2);
    expect(intEnum.getEnumeratorByName("IntEnumeration3")).to.have.property("value", 3);

    const stringEnum = partialComprehensiveSchema.getItemSync("StringEnumeration") as EC.Enumeration;
    expect(stringEnum).not.to.be.undefined;
    expect(stringEnum.isString).to.be.true;
    expect(stringEnum.getEnumeratorByName("spring")).to.have.property("value", "spring");
    expect(stringEnum.getEnumeratorByName("summer")).to.have.property("value", "summer");
    expect(stringEnum.getEnumeratorByName("fall")).to.have.property("value", "fall");
    expect(stringEnum.getEnumeratorByName("winter")).to.have.property("value", "winter");

    const abstractEntity = partialComprehensiveSchema.getItemSync("AbstractEntityClass") as EC.EntityClass;
    expect(abstractEntity).not.to.be.undefined;
    expect(abstractEntity.modifier === EC.ECClassModifier.Abstract).to.be.true;
    expect(abstractEntity.getPropertySync("AbstractClassProperty1")).to.have.property("propertyType", EC.PropertyType.DateTime);

    const abstractDerivedEntity = partialComprehensiveSchema.getItemSync("AbstractDerivedAbstract") as EC.EntityClass;
    expect(abstractDerivedEntity).not.to.be.undefined;
    expect(abstractDerivedEntity.getBaseClassSync() === abstractEntity).to.be.true;

    const mixinClass = partialComprehensiveSchema.getItemSync("MixinClass") as EC.Mixin;
    expect(mixinClass).not.to.be.undefined;
    expect(mixinClass.getPropertySync("MixinStringPrimitive")).to.have.property("propertyType", EC.PropertyType.String);
    expect(mixinClass.getPropertySync("MixinBinaryPrimitive")).to.have.property("propertyType", EC.PropertyType.Binary);
    expect(mixinClass.getPropertySync("MixinDateTimePrimitive")).to.have.property("propertyType", EC.PropertyType.DateTime);
    expect(mixinClass.getPropertySync("MixinDoublePrimitive")).to.have.property("propertyType", EC.PropertyType.Double);
    expect(mixinClass.getPropertySync("MixinIGeometryPrimitive")).to.have.property("propertyType", EC.PropertyType.IGeometry);
    expect(mixinClass.getPropertySync("MixinIntPrimitive")).to.have.property("propertyType", EC.PropertyType.Integer);
    expect(mixinClass.getPropertySync("MixinLongPrimitive")).to.have.property("propertyType", EC.PropertyType.Long);
    expect(mixinClass.getPropertySync("MixinPoint2dPrimitive")).to.have.property("propertyType", EC.PropertyType.Point2d);
    expect(mixinClass.getPropertySync("MixinPoint3dPrimitive")).to.have.property("propertyType", EC.PropertyType.Point3d);
    expect(mixinClass.getPropertySync("MixinIntEnumerationPrimitive")).to.have.property("propertyType", EC.PropertyType.Integer_Enumeration);
    expect(mixinClass.getPropertySync("MixinStringEnumerationPrimitive")).to.have.property("propertyType", EC.PropertyType.Integer_Enumeration); // bug in xml deserializer???

    const baseEntity = partialComprehensiveSchema.getItemSync("BaseEntity") as EC.EntityClass;
    expect(baseEntity).not.to.be.undefined;
    expect(baseEntity.modifier === EC.ECClassModifier.Abstract).to.be.true;
    expect(baseEntity.getBaseClassSync()).to.have.property("fullName", "BisCore.GraphicalModel2d");
    expect(Array.from(baseEntity.getMixinsSync())[0] === mixinClass).to.be.true;
    expect(baseEntity.getPropertySync("InheritedProperty")).to.have.property("propertyType", EC.PropertyType.String);

    const customStructCA = partialComprehensiveSchema.getItemSync("CustomStructClassAttribute") as EC.CustomAttributeClass;
    expect(customStructCA).not.to.be.undefined;

    const customAnyClassCA = partialComprehensiveSchema.getItemSync("CustomAnyClassAttribute") as EC.CustomAttributeClass;
    expect(customAnyClassCA).not.to.be.undefined;

    const struct = partialComprehensiveSchema.getItemSync("Struct") as EC.StructClass;
    expect(struct).not.to.be.undefined;
    expect(struct.getPropertySync("StructStringPrimitive")).to.have.property("propertyType", EC.PropertyType.String);
    expect(struct.getPropertySync("StructBinaryPrimitive")).to.have.property("propertyType", EC.PropertyType.Binary);
    expect(struct.getPropertySync("StructDateTimePrimitive")).to.have.property("propertyType", EC.PropertyType.DateTime);
    expect(struct.getPropertySync("StructDoublePrimitive")).to.have.property("propertyType", EC.PropertyType.Double);
    expect(struct.getPropertySync("StructIGeometryPrimitive")).to.have.property("propertyType", EC.PropertyType.IGeometry);

    const customAttributes = [];
    for (const [, customAttribute] of struct.customAttributes ?? []) {
      customAttributes.push(customAttribute);
    }
    expect(customAttributes[0].className).to.eql("PartialComprehensiveSchema.GeneralCustomAttribute");
    expect(customAttributes[1].className).to.eql("PartialComprehensiveSchema.CustomStructClassAttribute");
    expect(customAttributes[2].className).to.eql("PartialComprehensiveSchema.CustomAnyClassAttribute");

    const derivedStruct = partialComprehensiveSchema.getItemSync("DerivedStruct") as EC.StructClass;
    expect(derivedStruct).not.to.be.undefined;
    expect(derivedStruct.getBaseClassSync() === struct).to.be.true;
  });

  /**
   * Test is skipped because cyclic reference check will now be done in imodeljs:
   * Workitem 214993
   */
  it.skip("Test for cyclic references", async () => {
    // Round 1
    // B ----> C ----> D ---
    // ^                   |
    // |___________________|
    let deserializer = new SchemaDeserializer();
    let schemaPath = path.join(assetsDir, "cyclic-references", "round1", "SchemaB.ecschema.xml");
    await expect(deserializer.deserializeXmlFile(schemaPath, new EC.SchemaContext())).
      to.be.rejectedWith(`Schema SchemaD.01.00.02 and SchemaB.01.00.01 form cyclic dependency`);

    // Round 2
    // B---->C ---
    //       ^   |
    //       |___|
    deserializer = new SchemaDeserializer();
    schemaPath = path.join(assetsDir, "cyclic-references", "round2", "SchemaB.ecschema.xml");
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
    schemaPath = path.join(assetsDir, "cyclic-references", "round3", "SchemaB.ecschema.xml");
    const schemaB = await deserializer.deserializeXmlFile(schemaPath, schemaContext, [assetsDir]);
    expect(schemaB).not.to.be.undefined;

    const schemaC = schemaB.getReferenceSync("SchemaC") as EC.Schema;
    expect(schemaC).not.to.be.undefined;
    expect(schemaC.schemaKey.toString()).to.eql("SchemaC.01.00.00");

    const schemaD = schemaB.getReferenceSync("SchemaD") as EC.Schema;
    expect(schemaD).not.to.be.undefined;
    expect(schemaD.schemaKey.toString()).to.eql("SchemaD.01.00.02");

    const partialComprehensiveSchema = schemaD.getReferenceSync("PartialComprehensiveSchema") as EC.Schema;
    expect(partialComprehensiveSchema).not.to.be.undefined;
    expect(partialComprehensiveSchema.schemaKey.toString()).to.eql("PartialComprehensiveSchema.01.00.00");

    expect(schemaC.getReferenceSync("SchemaD") === schemaD).to.be.true;
  });
});

describe("SchemaJsonFileDeserializer", () => {
  const refDir = path.join(assetsDir, "references");

  it("With references in separate folder, should successfully deserialize schema.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "SchemaA.ecschema.json");

    const context = new EC.SchemaContext();
    const result = await deserializer.deserializeJsonFile(schemaPath, context, [refDir]);

    const schemaA = await context.getSchema(new EC.SchemaKey("SchemaA", 1, 1, 1), EC.SchemaMatchType.Exact) as EC.Schema;
    expect(schemaA).not.to.be.undefined;
    expect(result === schemaA).to.be.true;

    const schemaB = await schemaA.getReference("SchemaB") as EC.Schema;
    const schemaC = await schemaA.getReference("SchemaC") as EC.Schema;
    expect(schemaB).not.to.be.undefined;
    expect(schemaC).not.to.be.undefined;
    expect(schemaB.schemaKey.name).to.eql("SchemaB");
    expect(schemaC.schemaKey.name).to.eql("SchemaC");
  });

  it("No references, should successfully deserialize schema.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(refDir, "SchemaD.ecschema.json");

    const context = new EC.SchemaContext();
    const result = await deserializer.deserializeJsonFile(schemaPath, context);

    const schemaD = await context.getSchema(new EC.SchemaKey("SchemaD", 4, 4, 4), EC.SchemaMatchType.Exact) as EC.Schema;
    expect(schemaD).not.to.be.undefined;
    expect(result === schemaD).to.be.true;
  });

  it("Non-existent schema, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "DoesNotExist.ecschema.json");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeJsonFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECSchemaError, `Unable to locate schema JSON file at ${schemaPath}`);
  });

  it("Non-existent reference schema, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "BadRefSchema.ecschema.json");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeJsonFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECSchemaError, "Could not locate the referenced schema, DoesNotExist.01.00.00, of BadRefSchema");
  });

  it("Schema contains bad JSON, throws.", async () => {
    const deserializer = new SchemaDeserializer();
    const schemaPath = path.join(assetsDir, "BadJson.ecschema.json");
    const context = new EC.SchemaContext();

    await expect(deserializer.deserializeJsonFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECSchemaError);
  });
});
