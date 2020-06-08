/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as fs from "fs";
import { IModelProvider } from "../src/IModelProvider";
import * as path from "path";
import * as rimraf from "rimraf";
import { IModelHost } from "@bentley/imodeljs-backend";

describe("IModelProvider Tests", async () => {
  const oidcUserName: any = process.env.oidcUserName;
  const oidcPassword: any = process.env.oidcPassword;
  const tempDir: any = process.env.TMP;
  const briefcaseDir: string = path.join(tempDir, "iModelQuality", "Briefcases", "tests");

  beforeEach(async () => {
    if (fs.existsSync(briefcaseDir)) {
      rimraf.sync(briefcaseDir);
    }
  });

  afterEach(async () => {
    await IModelHost.shutdown();
  });

  it.skip("Get IModel Id Env QA, Get an iModel id by its name", async () => {
    await IModelProvider.setupHost("QA", briefcaseDir);
    const requestContext = await IModelProvider.oidcConnect(oidcUserName, oidcPassword, 102);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "9cf0d519-0436-446b-83b4-182752c9a4eb", "validation");

    expect(iModelId).to.equal("367ac967-9894-4434-842a-9d3557b3ddbd");
  });

  it.skip("Wrong IModel Name, When user insert wrong iModel name.", async () => {
    await IModelProvider.setupHost("QA", briefcaseDir);
    const requestContext = await IModelProvider.oidcConnect(oidcUserName, oidcPassword, 102);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "9cf0d519-0436-446b-83b4-182752c9a4eb", "val");

    expect(iModelId, "undefined");
  });

  it.skip("Get IModel Id Env DEV, Get an iModel id by its name", async () => {
    await IModelProvider.setupHost("DEV", briefcaseDir);
    const requestContext = await IModelProvider.oidcConnect(oidcUserName, oidcPassword, 103);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "28e761f7-2692-44bd-be31-5cbac5115a98", "validationtest");

    expect(iModelId).to.equal("5ea12a05-bf33-4d44-a0d2-32d70bead4fc");
  });

  it.skip("Get IModel Id Env PROD, Get an iModel id by its name", async () => {
    await IModelProvider.setupHost("PROD", briefcaseDir);
    const requestContext = await IModelProvider.oidcConnect(oidcUserName, oidcPassword, 0);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "c5a41e90-669b-47a6-8a3f-8b7287234a58", "test");

    expect(iModelId).to.equal("c4d869e8-c14a-4abd-8e60-30ed5d2016ff");
  });
});
