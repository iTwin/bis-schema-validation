
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { LaunchCodesProvider } from "../src/LaunchCodesProvider";
import { getSha1Hash } from "../src/Sha1HashHelper";
import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";

describe ("LaunchCodesProvider Tests", async () => {
  const username: any = process.env.Mapped_domUserName;
  const password: any = process.env.Mapped_domPassword;
  const signOffExecutable: any = process.env.SignoffToolPath;

  it ("Get LaunchCodes Success, Get launch codes from wiki page", async () => {
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const data: any =  await launchCodesProvider.getCheckSumInfoFromWiki(username, password);
    const launchCodesFilePath: any = launchCodesProvider.getLaunchCodesFilePath();
    launchCodesProvider.writeCheckSumToJson(launchCodesFilePath, data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    let result: boolean = false;
    if (fs.existsSync(launchCodesFilePath)) {
      result = true;
    }
    expect(result).to.equal(true);
  });

  it ("Get LaunchCodes failure, Get launch codes from wiki page failed", async () => {
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const data: any =  await launchCodesProvider.getCheckSumInfoFromWiki(username, "test");
    const result: boolean = data.toString().includes("Unauthorized");
    expect(result).to.equal(true);
  });

  it ("Sha1 Comparison, Check if a sha1 of a schema matches to he one from LaunchCodes", async () => {
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const launchCodes =  await launchCodesProvider.getLaunchCodeDict(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    const sha1 = getSha1Hash(signOffExecutable, schemaAFile, "");
    const sha1Comparison = launchCodesProvider.compareCheckSums("SchemaA", sha1, launchCodes);
    expect(sha1Comparison.result).to.equal(false);
  });

  it ("Approved and Verified Schema, Check if a schema is approved and verified from LaunchCodes", async () => {
    const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
    const launchCodes =  await launchCodesProvider.getLaunchCodeDict(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    const sha1 = getSha1Hash(signOffExecutable, schemaAFile, "");
    const sha1Comparison = launchCodesProvider.compareCheckSums("SchemaA", sha1, launchCodes);
    const approvalResult = launchCodesProvider.checkApprovalAndVerification("SchemaA", sha1Comparison.schemaIndex, launchCodes);
    expect(approvalResult).to.equal(false);
  });
});
