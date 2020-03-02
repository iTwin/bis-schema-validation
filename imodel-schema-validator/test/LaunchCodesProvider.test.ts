
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { LaunchCodesProvider } from "../src/LaunchCodesProvider";
import { getSha1Hash } from "../src/Sha1HashHelper";
import { expect } from "chai";
import * as path from "path";

describe("LaunchCodesProvider Tests", async () => {

  const signOffExecutable: any = process.env.SignoffToolPath;
  const inventoryRepo = path.resolve(path.normalize(__dirname + "/assets/"));

  it("Sha1 Comparison, Check if a sha1 of a schema matches to the one from schema inventory json", async () => {
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const launchCodes = await launchCodesProvider.getSchemaInventory(inventoryRepo);
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    const sha1 = getSha1Hash(signOffExecutable, schemaAFile, "", false);
    const sha1Comparison = launchCodesProvider.compareCheckSums("SchemaA", sha1, launchCodes);
    expect(sha1Comparison.result).to.equal(false);
  });

  it("Approved and Verified Schema, Check if a schema is approved and verified using schema inventory json", async () => {
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const launchCodes = await launchCodesProvider.getSchemaInventory(inventoryRepo);
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    const sha1 = getSha1Hash(signOffExecutable, schemaAFile, "", false);
    const sha1Comparison = launchCodesProvider.compareCheckSums("SchemaA", sha1, launchCodes);
    const approvalResult = launchCodesProvider.checkApprovalAndVerification("SchemaA", sha1Comparison.schemaIndex, sha1Comparison.inventorySchema, launchCodes);
    expect(approvalResult).to.equal(false);
  });

  it("Approved and Verified Schema, Find index of a schema and check approval", async () => {
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const launchCodes = await launchCodesProvider.getSchemaInventory(inventoryRepo);
    const schemaInfo = launchCodesProvider.findSchemaInfo("BisCore", "01.00.01", launchCodes);
    const approvalResult = launchCodesProvider.checkApprovalAndVerification("BisCore", schemaInfo.schemaIndex, schemaInfo.inventorySchema, launchCodes);
    expect(approvalResult).to.equal(true);
  });

  it("Index of Schema, Find index of a schema from schema inventory json", async () => {
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const launchCodes = await launchCodesProvider.getSchemaInventory(inventoryRepo);
    const schemaInfo = launchCodesProvider.findSchemaInfo("SchemaA", "00.00.01", launchCodes);
    expect(schemaInfo.schemaIndex).to.equal(undefined);
  });

  it("Index of Schema, Find index of a schema based upon schema name", async () => {
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const launchCodes = await launchCodesProvider.getSchemaInventory(inventoryRepo);
    const schemaInfo = launchCodesProvider.findSchemaInfo("BuildingSpatial", "01.00.00", launchCodes);
    const approvalResult = launchCodesProvider.checkApprovalAndVerification("BuildingSpatial", schemaInfo.schemaIndex, schemaInfo.inventorySchema, launchCodes);
    expect(approvalResult).to.equal(true);
  });
});
