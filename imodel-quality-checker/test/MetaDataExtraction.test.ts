/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import { expect } from "chai";
import { createTestImodel } from "./utilities/utils";
import { IModelHost, SnapshotDb } from "@bentley/imodeljs-backend";
import { MetadataExtraction, SchemaMetaData, MappingMetaData } from "../src/MetaDataExtraction";

describe("MetadataExtraction Tests", async () => {

  const imodelDir = path.join(__dirname, "assets");
  const dynamicImodelFile = await createTestImodel();

  it("Get schema names from an iModel.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const namesList = await MetadataExtraction.getSchemaNames(iModel);
    iModel.close();
    await IModelHost.shutdown();

    expect(namesList[0]).to.equal("BisCore");
  });

  it("Get names of classes from a schema, (success).", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const namesList = await MetadataExtraction.getClasses(iModel, "BisCore");
    iModel.close();
    await IModelHost.shutdown();

    expect(namesList[0]).to.equals("AnnotationElement2d");
  });

  it("Get names of classes from a schema, (failure).", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    // schema name is wrong
    const namesList = await MetadataExtraction.getClasses(iModel, "testSchema");
    iModel.close();
    await IModelHost.shutdown();

    expect(namesList.length).to.equals(0);
  });

  it("Get properties count of base classes of a class (When a property inherited from a class inside of BisCore).", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const bisCount = await MetadataExtraction.getPropCountOfBaseClassesFromBis(iModel, "TestPropsSchema", "PropElement");
    const notBisCount = await MetadataExtraction.getPropCountOfBaseClassesNotFromBis(iModel, "TestPropsSchema", "PropElement");
    iModel.close();
    await IModelHost.shutdown();

    expect(bisCount).to.equals(20);
    expect(notBisCount).to.equals(0);
  });

  it("Get properties count of base classes of a class (When a property inherited from a class outside of BisCore).", async () => {
    await IModelHost.startup();
    const iModel = SnapshotDb.openFile(dynamicImodelFile);
    const bisCount = await MetadataExtraction.getPropCountOfBaseClassesFromBis(iModel, "Generic", "ElevationCallout");
    const notBisCount = await MetadataExtraction.getPropCountOfBaseClassesNotFromBis(iModel, "Generic", "ElevationCallout");
    iModel.close();
    await IModelHost.shutdown();

    expect(bisCount).to.equals(16);
    expect(notBisCount).to.equals(1);
  });

  it("Get properties count of base classes of a class (When property count is 0).", async () => {
    await IModelHost.startup();
    const iModel = SnapshotDb.openFile(dynamicImodelFile);
    const bisCount = await MetadataExtraction.getPropCountOfBaseClassesFromBis(iModel, "Generic", "ViewAttachmentLabelAnnotatesViewAttachment");
    const notBisCount = await MetadataExtraction.getPropCountOfBaseClassesNotFromBis(iModel, "Generic", "ViewAttachmentLabelAnnotatesViewAttachment");
    iModel.close();
    await IModelHost.shutdown();

    expect(bisCount).to.equals(0);
    expect(notBisCount).to.equals(0);
  });

  it("Get properties count of base classes of a class [When 1 property override (Angle) from Bis].", async () => {
    await IModelHost.startup();
    const iModel = SnapshotDb.openFile(dynamicImodelFile);
    const notBisCount = await MetadataExtraction.getPropCountOfBaseClassesNotFromBis(iModel, "TestPropsSchema", "ElementPropChild");
    iModel.close();
    await IModelHost.shutdown();

    expect(notBisCount).to.equals(3);
  });

  it("Get properties count of base classes of a class [When 1 property override (ElementProp2) from Non Bis].", async () => {
    await IModelHost.startup();
    const iModel = SnapshotDb.openFile(dynamicImodelFile);
    const notBisCount = await MetadataExtraction.getPropCountOfBaseClassesNotFromBis(iModel, "TestPropsSchema", "SpatialElementPropChild");
    iModel.close();
    await IModelHost.shutdown();

    expect(notBisCount).to.equals(6);
  });

  it("Get properties count of a class excluding base class properties (success).", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const count = await MetadataExtraction.getPropertiesCountExcludedBaseClassProp(iModel, "TestPropsSchema", "PropElement");
    iModel.close();
    await IModelHost.shutdown();

    expect(count).to.equals(50);
  });

  it("Get properties count of a class excluding base class properties, (failure).", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    // class name name is wrong
    const count = await MetadataExtraction.getPropertiesCountExcludedBaseClassProp(iModel, "TestPropsSchema", "PropElement1");
    iModel.close();
    await IModelHost.shutdown();

    expect(count).to.equals(0);
  });

  it("Get schema metadata.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const metaData: SchemaMetaData[] = await MetadataExtraction.getMetaData(iModel, "BisCore");
    iModel.close();
    await IModelHost.shutdown();

    expect(metaData[0].className).to.equal("AnnotationElement2d");
    expect(metaData[0].classPropCount).to.equal(0);
    expect(metaData[0].baseClassesNotFromBisPropCount).to.equal(0);
    expect(metaData[0].baseClassesFromBisPropCount).to.equal(16);
  });

  it("Get sorted objects of MetaData based upon the property counts.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const properties: SchemaMetaData[] = await MetadataExtraction.getMetaData(iModel, "BisCore");
    const sortedMetaData: SchemaMetaData[] = MetadataExtraction.sortMetaDataByPropertyCount(properties);
    const totalCount = sortedMetaData[0].baseClassesFromBisPropCount + sortedMetaData[0].baseClassesNotFromBisPropCount + sortedMetaData[0].classPropCount;
    iModel.close();
    await IModelHost.shutdown();

    expect(sortedMetaData[0].schemaName).to.equal("BisCore");
    expect(sortedMetaData[0].className).to.equal("SectionLocation");
    expect(totalCount).to.equal(24);
  });

  it("Get overflow table exists in the BIM file.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const tablesNames = MetadataExtraction.getOverflowTables(iModel);
    iModel.close();
    await IModelHost.shutdown();

    expect(tablesNames[0]).to.equal("bis_GeometricElement3d_Overflow");
  });

  it("Overflow table does not exist in the BIM file.", async () => {
    await IModelHost.startup();
    let result = false;
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const tablesNames = MetadataExtraction.getOverflowTables(iModel);

    if (tablesNames.length === 0)
      result = true;

    iModel.close();
    await IModelHost.shutdown();

    expect(result).to.equal(false);
  });

  it("Get column counts of a overflow table.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const columnCount = MetadataExtraction.getOverflowTableColumnCount(iModel, "bis_GeometricElement3d_Overflow");
    iModel.close();
    await IModelHost.shutdown();

    expect(columnCount).to.equal(21);
  });

  it("Schema is not a standard schema.", async () => {
    const result = MetadataExtraction.isStandardSchema("BisCore");

    expect(result).to.be.false;
  });

  it("Schema is a standard schema.", async () => {
    const result = MetadataExtraction.isStandardSchema("ECDbMap");

    expect(result).to.be.true;
  });

  it("Get meta data about mapping (success).", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const mappingInfo: MappingMetaData[] = MetadataExtraction.getMappingInfo(iModel, "PropElement", "TestPropsSchema");
    iModel.close();
    await IModelHost.shutdown();

    expect(mappingInfo[0].tableName).to.equals("bis_GeometricElement3d");
    expect(mappingInfo[0].columnName).to.equals("BBoxHigh_X");
  });

  it("Get meta data about mapping (failure).", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const mappingInfo: MappingMetaData[] = MetadataExtraction.getMappingInfo(iModel, "PropElemen", "TestPropsSchema");
    iModel.close();
    await IModelHost.shutdown();

    expect(mappingInfo[0]).is.undefined;
    expect(() => { mappingInfo[0].tableName; }).to.throw("Cannot read property 'tableName' of undefined");
    expect(() => { mappingInfo[0].columnName; }).to.throw("Cannot read property 'columnName' of undefined");
  });

  it("Get statistics of an overflow table (success).", async () => {
    const calculatePerformanceData: SchemaMetaData[] = [
      {
        schemaName: "testSchema1", className: "testClass1", classPropCount: 30, baseClassesFromBisPropCount: 20,
        baseClassesNotFromBisPropCount: 10, overflowTable: "testSchema1_Overflow", overflowColumnCount: 8, MetaData: [],
      },
      {
        schemaName: "testSchema2", className: "testClass2", classPropCount: 100, baseClassesFromBisPropCount: 50,
        baseClassesNotFromBisPropCount: 0, overflowTable: "testSchema1_Overflow", overflowColumnCount: 68, MetaData: [],
      },
      {
        schemaName: "testSchema3", className: "testClass3", classPropCount: 25, baseClassesFromBisPropCount: 38,
        baseClassesNotFromBisPropCount: 48, overflowTable: "testSchema1_Overflow", overflowColumnCount: 41, MetaData: [],
      }];

    const statistics = MetadataExtraction.getStatistics(calculatePerformanceData);
    if (statistics) {
      expect(statistics.maxPropCount).to.equals(68);
      expect(statistics.minPropCount).to.equals(8);
      expect(statistics.avgPropCount).to.equals(39.00);
    }
  });
});
