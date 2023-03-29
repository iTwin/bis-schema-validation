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
import { verifyIModelSchema, getResults } from "../iModelSchemaValidator";
import { SchemaXmlFileLocater, StubSchemaXmlFileLocater } from "@itwin/ecschema-locaters";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { SchemaContext, SchemaKey, SchemaMatchType, Schema } from "@itwin/ecschema-metadata";
import * as fs1 from "fs-extra";

describe.only("IModelProvider Tests", async () => {
  const oidcUserName: any = process.env.oidcUserName;
  const oidcPassword: any = process.env.oidcPassword;
  const tempDir: any = process.env.TMP;
  const briefcaseDir: string = path.join(tempDir, "SchemaValidation", "Briefcases", "validation");
  const url: any = process.env.authorityUrl;
  const projectIdQa: any = process.env.ProjectId_QA;
  const projectIdDev: any = process.env.ProjectId_DEV;
  const projectIdProd: any = process.env.ProjectId_PROD;

  beforeEach(async () => {
    // if (fs.existsSync(briefcaseDir)) {
    //   rimraf.sync(briefcaseDir);
    // }
  });

  afterEach(async () => {
    await IModelHost.shutdown();
  });

  it("Get IModel Id Env QA, Get an iModel id by its name", async () => {
    IModelProvider.url = url;
    await IModelProvider.setupHost("QA", briefcaseDir);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword);
    const iModelId: any = await IModelProvider.getIModelId(token, projectIdQa, "testiModel");

    expect(iModelId).to.equal("da1ffed8-7b30-4ac0-9d32-0029036db477");
  });

  it("Wrong IModel Name Env QA, When user insert wrong iModel name.", async () => {
    IModelProvider.url = url;
    await IModelProvider.setupHost("QA", briefcaseDir);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword);
    const iModelId: any = await IModelProvider.getIModelId(token, projectIdQa, "val");

    expect(iModelId, "undefined");
  });

  it("Export XML Schemas Env QA, Get local iModel connection and export the schemas present in it.", async () => {
    const iModelSchemaDir = await IModelProvider.exportSchemasFromIModel(projectIdQa, "testiModel", briefcaseDir, oidcUserName, oidcPassword, "QA", url);
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
    IModelProvider.url = url;
    await IModelProvider.setupHost("DEV", briefcaseDir);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword);
    const iModelId: any = await IModelProvider.getIModelId(token, projectIdDev, "testiModel");

    expect(iModelId).to.equal("61d33066-d20d-41a0-9245-f6fc66032d8a");
  });

  it("Wrong IModel Name Env DEV, When user insert wrong iModel name", async () => {
    IModelProvider.url = url;
    await IModelProvider.setupHost("DEV", briefcaseDir);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword);
    const iModelId: any = await IModelProvider.getIModelId(token, projectIdDev, "testiModel");

    expect(iModelId, "undefined");
  });

  it("Get IModel Id Env PROD, Get an iModel id by its name", async () => {
    IModelProvider.url = url;
    await IModelProvider.setupHost("PROD", briefcaseDir);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword);
    const iModelId: any = await IModelProvider.getIModelId(token, projectIdProd, "test");

    expect(iModelId).to.equal("c4d869e8-c14a-4abd-8e60-30ed5d2016ff");
  });

  it("Wrong IModel Name Env PROD, When user insert wrong iModel name", async () => {
    IModelProvider.url = url;
    await IModelProvider.setupHost("PROD", briefcaseDir);
    const token = await IModelProvider.getTokenFromSigninTool(oidcUserName, oidcPassword);
    const iModelId: any = await IModelProvider.getIModelId(token, projectIdProd, "test");

    expect(iModelId, "undefined");
  });

  async function writeSchemaXmlFile(schema: Schema, outputPath: string) {
    let xmlDoc = new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?>`, "application/xml");
    const baseFile = getSchemaPath(schema, outputPath);

    xmlDoc = await schema.toXml(xmlDoc);
    const serializer = new XMLSerializer();
    const xml = serializer.serializeToString(xmlDoc);

    try {
      await fs1.writeFile(baseFile, xml);
    } catch (err: any) {
      const msg = `An error occurred writing to file '${baseFile}': ${err.message}`;
      throw new Error(msg);
    }
  }

  function getSchemaPath(schema: Schema, outputPath: string): string {
    const realDir = path.normalize(outputPath);
    const test = fs1.pathExistsSync(realDir);
    if (!test) {
      const msg = `The output directory '${realDir}' does not exist.`;
      throw new Error(msg);
    }

    return path.resolve(realDir, `${schema.name}.ecschema.xml`);
  }

  it.only("run", async () => {
    const iModelSchemaDir = "D:\\SignoffTool\\test\\schemas";
    const validationResult = await verifyIModelSchema(iModelSchemaDir, "Functional.01.00.04.ecschema.xml", false, "D:\\SignoffTool\\bis-schemas", "D:\\SignoffTool\\out");
    getResults([validationResult], "D:\\SignoffTool\\bis-schemas", "D:\\SignoffTool\\out");

    // const doc = new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?>`);
    // const locater = new StubSchemaXmlFileLocater();
    // locater.addSchemaSearchPaths([iModelSchemaDir]);
    // const loadedSchema = locater.loadSchema(iModelSchemaDir + "\\Functional.01.00.04.ecschema.xml");
    // const schema = loadedSchema.toJSON();
    // const schema = loadedSchema.toXml(doc);

    // const serializer = new XMLSerializer();
    // const xml = serializer.serializeToString(doc);
    //console.log(schema);


    // const locater: SchemaXmlFileLocater = new SchemaXmlFileLocater();
    // locater.addSchemaSearchPaths([iModelSchemaDir]);
    // const context: SchemaContext = new SchemaContext();
    // context.addLocater(locater);


    // const schemaKey = new SchemaKey("Functional", 1, 0, 4);
    // //const schema = await locater.getSchema(schemaKey, SchemaMatchType.Exact, context);
    // const schema = await context.getSchema(schemaKey, SchemaMatchType.Exact);
    // writeSchemaXmlFile(schema!, "D:\\SignoffTool\\output\\out");
  });
});
