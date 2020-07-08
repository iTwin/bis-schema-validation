/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import { expect } from "chai";
import * as rimraf from "rimraf";
import * as extra from "fs-extra";
import { createTestImodel } from "./utilities/utils";
import { IModelHost, SnapshotDb } from "@bentley/imodeljs-backend";
import { MetadataExtraction, MappingMetaData } from "../src/MetaDataExtraction";
import { getOverflowTableName, getColumnCount, checkIModelQuality, createBriefcaseDir } from "../src/iModelQualityChecker";

describe("iModelQualityChecker Tests", async () => {

  const imodelDir = path.join(__dirname, "assets");
  const output = path.normalize(__dirname + "/../lib/test/output/");
  extra.ensureDirSync(output);
  let dynamicImodelFile;

  before(async () => {
    dynamicImodelFile = await createTestImodel();
  });

  after(async () => {
    if (dynamicImodelFile)
      rimraf.sync(dynamicImodelFile);
  });

  it("Get overflow table name for a class, if it exists.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const mappingInfo: MappingMetaData[] = MetadataExtraction.getMappingInfo(iModel, "PropElement", "TestPropsSchema");
    iModel.close();
    await IModelHost.shutdown();

    const overflowTableName = getOverflowTableName(mappingInfo);
    if (overflowTableName) {
      expect(overflowTableName).to.equals("bis_GeometricElement3d_Overflow");
    }
  });

  it("Get a class properties in overflow table (Overall Case).", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const mappingInfo: MappingMetaData[] = MetadataExtraction.getMappingInfo(iModel, "PropElement", "TestPropsSchema");
    iModel.close();
    await IModelHost.shutdown();

    const overflowTableName = getOverflowTableName(mappingInfo);
    if (overflowTableName) {
      const columnCount = getColumnCount(overflowTableName, mappingInfo);
      if (columnCount)
        expect(columnCount).to.equals(19);
    }
  });

  it("Get a class properties in overflow table (Non-Bis Property Overriding Case).", async () => {
    await IModelHost.startup();
    const iModel = SnapshotDb.openFile(dynamicImodelFile);
    const mappingInfo: MappingMetaData[] = MetadataExtraction.getMappingInfo(iModel, "PropElementMapping_NonBisCase", "TestPropsSchema");

    const bisCount = await MetadataExtraction.getPropCountOfBaseClassesFromBis(iModel, "TestPropsSchema", "PropElementMapping_NonBisCase");
    const notBisCount = await MetadataExtraction.getPropCountOfBaseClassesNotFromBis(iModel, "TestPropsSchema", "PropElementMapping_NonBisCase");
    const classProp = await MetadataExtraction.getPropertiesCountExcludedBaseClassProp(iModel, "TestPropsSchema", "PropElementMapping_NonBisCase");
    iModel.close();
    await IModelHost.shutdown();

    const overflowTableName: any = getOverflowTableName(mappingInfo);
    const columnCount: any = getColumnCount(overflowTableName, mappingInfo);

    expect(bisCount).to.equals(14);
    expect(notBisCount).to.equals(3);
    expect(classProp).to.equals(50);
    expect(columnCount).to.equals(26);
    expect(overflowTableName).to.equals("bis_DefinitionElement_Overflow");
  });

  it("Get a class properties in overflow table (Bis Property Overriding Case).", async () => {
    await IModelHost.startup();
    const iModel = SnapshotDb.openFile(dynamicImodelFile);
    const mappingInfo: MappingMetaData[] = MetadataExtraction.getMappingInfo(iModel, "PropElementMapping_BisCase", "TestPropsSchema");

    const bisCount = await MetadataExtraction.getPropCountOfBaseClassesFromBis(iModel, "TestPropsSchema", "PropElementMapping_BisCase");
    const notBisCount = await MetadataExtraction.getPropCountOfBaseClassesNotFromBis(iModel, "TestPropsSchema", "PropElementMapping_BisCase");
    const classProp = await MetadataExtraction.getPropertiesCountExcludedBaseClassProp(iModel, "TestPropsSchema", "PropElementMapping_BisCase");
    iModel.close();
    await IModelHost.shutdown();

    const overflowTableName: any = getOverflowTableName(mappingInfo);
    const columnCount: any = getColumnCount(overflowTableName, mappingInfo);

    expect(bisCount).to.equals(14);
    expect(notBisCount).to.equals(0);
    expect(classProp).to.equals(50);
    expect(columnCount).to.equals(23);
    expect(overflowTableName).to.equals("bis_DefinitionElement_Overflow");
  });

  it.skip("Check overall workflow of the tool on a local BIM.", async () => {
    const localBimPath = path.join(imodelDir, "props_50.bim");
    // tslint:disable-next-line: only-arrow-functions
    console.log = function () { };
    const briefcaseDir = createBriefcaseDir("localBIM");
    await checkIModelQuality("", "localBIM", "QA", "", "", localBimPath, briefcaseDir, output, 200);
    delete console.log;
  });
});
