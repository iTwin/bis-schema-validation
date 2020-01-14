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
  const env = "QA";
  const tempDir: any = process.env.TMP;
  const briefcaseDir: string = path.join(tempDir, "SchemaValidation", "Briefcases", "validation");

  beforeEach(async () => {
    if (fs.existsSync(briefcaseDir)) {
      rimraf.sync(briefcaseDir);
    }
  });

  afterEach(async () => {
    IModelHost.shutdown();
  });

  it.skip("Get IModel Id, Get an iModel id by its name", async () => {
    IModelProvider.setupHost(env, briefcaseDir);
    const requestContext = await IModelProvider.oidcConnect(oidcUserName, oidcPassword, 102);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "9cf0d519-0436-446b-83b4-182752c9a4eb", "validation");

    expect(iModelId).to.equal("367ac967-9894-4434-842a-9d3557b3ddbd");
  });

  it.skip("Wrong IModel Name, When user insert wrong iModel name.", async () => {
    IModelProvider.setupHost(env, briefcaseDir);
    const requestContext = await IModelProvider.oidcConnect(oidcUserName, oidcPassword, 102);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "9cf0d519-0436-446b-83b4-182752c9a4eb", "val");

    expect(iModelId, "undefined");
  });

  it.skip("Export XML Schemas, Get local iModel connection and export the schemas present in it.", async () => {
    const iModelSchemaDir = await IModelProvider.exportSchemasFromIModel("9cf0d519-0436-446b-83b4-182752c9a4eb", "validation", briefcaseDir, oidcUserName, oidcPassword, env);
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
});
