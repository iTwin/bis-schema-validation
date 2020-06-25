/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import { expect } from "chai";
import { getOverflowTableName, getColumnCount } from "../src/iModelQualityChecker";
import { MetadataExtraction, MappingMetaData } from "../src/MetaDataExtraction";
import { IModelHost, SnapshotDb } from "@bentley/imodeljs-backend";

describe("iModelQualityChecker Tests", async () => {

  const imodelDir = path.join(__dirname, "assets");

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

  it("Get a class properties in overflow table.", async () => {
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
});
