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
  const imsUserName: any = process.env.imsUserName;
  const imsPassword: any = process.env.imsPassword;
  const oidcUserName: any = process.env.oidcUserName;
  const oidcPassword: any = process.env.oidcPassword;
  const env: any = process.env.environment;
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

  it("Get iModel Id (IMS Auth), Get an iModel id by its name", async () => {
    IModelProvider.setupHost(env, briefcaseDir);
    const requestContext = await IModelProvider.imsConnect(imsUserName, imsPassword);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "9cf0d519-0436-446b-83b4-182752c9a4eb", "validation");

    expect(iModelId).to.equal("367ac967-9894-4434-842a-9d3557b3ddbd");
  });

  it("Wrong iModel name (IMS Auth), When user insert wrong iModel name.", async () => {
    IModelProvider.setupHost(env, briefcaseDir);
    const requestContext = await IModelProvider.imsConnect(imsUserName, imsPassword);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "9cf0d519-0436-446b-83b4-182752c9a4eb", "val");

    expect(iModelId, "undefined");
  });

  it("Export XML Schemas (IMS Auth), Get local iModel connection and export the schemas present in it.", async () => {
    const iModelSchemaDir = await IModelProvider.exportSchemasFromIModel(true, "9cf0d519-0436-446b-83b4-182752c9a4eb", "validation", briefcaseDir, imsUserName, imsPassword, env);
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

  it.skip("Get iModel Id (OIDC Auth), Get an iModel id by its name", async () => {
    IModelProvider.setupHost(env, briefcaseDir);
    const requestContext = await IModelProvider.oidcConnect(oidcUserName, oidcPassword, 102);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "9cf0d519-0436-446b-83b4-182752c9a4eb", "validation");

    expect(iModelId).to.equal("367ac967-9894-4434-842a-9d3557b3ddbd");
  });

  it.skip("Wrong iModel name (OIDC Auth), When user insert wrong iModel name.", async () => {
    IModelProvider.setupHost(env, briefcaseDir);
    const requestContext = await IModelProvider.oidcConnect(oidcUserName, oidcPassword, 102);
    const iModelId: any = await IModelProvider.getIModelId(requestContext, "9cf0d519-0436-446b-83b4-182752c9a4eb", "val");

    expect(iModelId, "undefined");
  });

  it.skip("Export XML Schemas (OIDC Auth), Get local iModel connection and export the schemas present in it.", async () => {
    const iModelSchemaDir = await IModelProvider.exportSchemasFromIModel(false, "9cf0d519-0436-446b-83b4-182752c9a4eb", "validation", briefcaseDir, oidcUserName, oidcPassword, env);
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
