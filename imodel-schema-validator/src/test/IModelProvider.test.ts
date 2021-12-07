/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import * as fs from "fs";
import { IModelProvider } from "../IModelProvider";
import * as path from "path";
import * as rimraf from "rimraf";
import { IModelHost } from "@itwin/core-backend";

describe("IModelProvider Tests", async () => {
  const oidcUserName: any = process.env.oidcUserName;
  const oidcPassword: any = process.env.oidcPassword;
  const tempDir: any = process.env.TMP;
  const briefcaseDir: string = path.join(tempDir, "SchemaValidation", "Briefcases", "validation");
  const url: any = process.env.imjs_default_relying_party_uri;

  beforeEach(async () => {
    if (fs.existsSync(briefcaseDir)) {
      rimraf.sync(briefcaseDir);
    }
  });

  afterEach(async () => {
    await IModelHost.shutdown();
  });

  it("Get IModel Id Env QA, Get an iModel id by its name", async () => {
    await IModelProvider.setupHost("QA", briefcaseDir, url);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword, 102);
    const iModelId: any = await IModelProvider.getIModelId(token, "9cf0d519-0436-446b-83b4-182752c9a4eb", "testiModel");

    expect(iModelId).to.equal("da1ffed8-7b30-4ac0-9d32-0029036db477");
  });

  it("Wrong IModel Name, When user insert wrong iModel name.", async () => {
    await IModelProvider.setupHost("QA", briefcaseDir, url);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword, 102);
    const iModelId: any = await IModelProvider.getIModelId(token, "9cf0d519-0436-446b-83b4-182752c9a4eb", "val");

    expect(iModelId, "undefined");
  });

  it("Export XML Schemas, Get local iModel connection and export the schemas present in it.", async () => {
    const iModelSchemaDir = await IModelProvider.exportSchemasFromIModel("9cf0d519-0436-446b-83b4-182752c9a4eb", "testiModel", briefcaseDir, oidcUserName, oidcPassword, "QA", url);
    let result = false;
    if (iModelSchemaDir) {
      fs.readdirSync(iModelSchemaDir).forEach((file) => {
        if (file.toLowerCase().endsWith(".ecschema.xml")) {
          result = true;
        } else { result = false; }
      });
    }
    expect(result).to.equal(true);
  });

  it("Get IModel Id Env DEV, Get an iModel id by its name", async () => {
    await IModelProvider.setupHost("DEV", briefcaseDir, url);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword, 103);
    const iModelId: any = await IModelProvider.getIModelId(token, "28e761f7-2692-44bd-be31-5cbac5115a98", "testiModel");

    expect(iModelId).to.equal("61d33066-d20d-41a0-9245-f6fc66032d8a");
  });

  it.skip("Get IModel Id Env PROD, Get an iModel id by its name", async () => {
    await IModelProvider.setupHost("PROD", briefcaseDir, url);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword, 0);
    const iModelId: any = await IModelProvider.getIModelId(token, "c5a41e90-669b-47a6-8a3f-8b7287234a58", "test");

    expect(iModelId).to.equal("c4d869e8-c14a-4abd-8e60-30ed5d2016ff");
  });
});
