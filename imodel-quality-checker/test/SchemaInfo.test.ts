/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import * as extra from "fs-extra";
import { SchemaInfo, MetaData } from "../src/SchemaInfo";
import { IModelHost, SnapshotDb } from "@bentley/imodeljs-backend";

describe("SChemaInfo Tests", async () => {
  const imodelDir = path.join(__dirname, "assets");
  const schemaDir = path.normalize(__dirname + "/../lib/test/output/schemas/");
  extra.ensureDirSync(schemaDir);

  it("Get schema names from an iModel.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "test.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const namesList = await SchemaInfo.getSchemaNames(iModel);
    iModel.close();
    await IModelHost.shutdown();

    expect(namesList[0]).to.equal("BisCore");
  });

  it("Get schema json based upon a schema name and save it locally.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "test.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const schemaNames = await SchemaInfo.getSchemaNames(iModel);
    const schemaJson = JSON.parse(await SchemaInfo.getSchemaJson(iModel, schemaNames[0]));
    for (const schemaName of schemaNames)
      await SchemaInfo.saveSchemaJson(iModel, schemaName, schemaDir);
    iModel.close();
    await IModelHost.shutdown();

    expect(schemaJson["name"]).to.equal("BisCore");

    let jsonFileStatus = false;
    if (fs.readdirSync(schemaDir).includes("BisCore.ecschema.json"))
      jsonFileStatus = true;
    expect(jsonFileStatus).to.equal(true);
  });

  it("Get object of a schema.", async () => {
    const schema = SchemaInfo.getSchema(schemaDir, "BisCore.ecschema.json");
    expect(schema.fullName).to.equal("BisCore");
  });

  it("Get property counts of a class and information about minimum, maximum and average values of properties counts.", async () => {
    const schema = SchemaInfo.getSchema(schemaDir, "BisCore.ecschema.json");
    const properties: MetaData[] = SchemaInfo.getMetaData(schema);
    expect(properties[0].className).to.equal("AnnotationElement2d");
    expect(properties[0].propertyCount).to.equal(16);

    const propCountInfo = SchemaInfo.getSchemaPropertiesCountInfo(properties);
    expect(propCountInfo.Max).to.equal(24);
    expect(propCountInfo.Min).to.equal(0);
    expect(Number(propCountInfo.Avg.toFixed(2))).to.equal(7.58);
  });

  it("Get sorted objects of MetaData based upon the property counts.", async () => {
    const schema = SchemaInfo.getSchema(schemaDir, "BisCore.ecschema.json");
    const properties: MetaData[] = SchemaInfo.getMetaData(schema);
    const sortedMetaData: MetaData[] = SchemaInfo.sortMetaDataByPropertyCount(properties);

    expect(sortedMetaData[0].schemaName).to.equal("BisCore");
    expect(sortedMetaData[0].className).to.equal("SectionLocation");
    expect(sortedMetaData[0].propertyCount).to.equal(24);
  });

  it("Get overflow table exists in the BIM file.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const tablesNames = SchemaInfo.getOverflowTables(iModel);
    iModel.close();
    await IModelHost.shutdown();

    expect(tablesNames[0]).to.equal("bis_GeometricElement3d_Overflow");
  });

  it("Overflow table does not exist in the BIM file.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "test.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const tablesNames = SchemaInfo.getOverflowTables(iModel);
    iModel.close();
    await IModelHost.shutdown();

    expect(tablesNames.length).to.equal(0);
  });

  it("Get column counts of a overflow table.", async () => {
    await IModelHost.startup();
    const imodelFile = path.join(imodelDir, "props_50.bim");
    const iModel = SnapshotDb.openFile(imodelFile);
    const columnCount = SchemaInfo.getOverflowTableColumnCount(iModel, "bis_GeometricElement3d_Overflow");
    iModel.close();
    await IModelHost.shutdown();

    expect(columnCount).to.equal(21);
  });

  it("Schema is not a standard schema.", async () => {
    const schema = SchemaInfo.getSchema(schemaDir, "BisCore.ecschema.json");
    const result = SchemaInfo.isStandardSchema(schema);

    expect(result).to.be.false;
  });

  it("Schema is a standard schema.", async () => {
    const schema = SchemaInfo.getSchema(schemaDir, "ECDbMap.ecschema.json");
    const result = SchemaInfo.isStandardSchema(schema);

    expect(result).to.be.true;
  });
});
