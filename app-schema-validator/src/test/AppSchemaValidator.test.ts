
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as path from "path";
import * as fs from "fs";
import { generateAppSchemaDirectoryList, verifyAppSchemas } from "../AppSchemaValidator";

describe("AppSchemaValidator Tests", async () => {
  const bisSchemaRepo: any = process.env.BisSchemaRepo;
  const outputDir = path.resolve(path.normalize(__dirname + "/output"));

  before(async () => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  it("Apply validations, App is using all released schemas", async () => {

    const installerDir = path.resolve(path.normalize(__dirname + "/assets/app1"));
    const results = await verifyAppSchemas(installerDir, bisSchemaRepo, outputDir);

    expect(results.length).to.equals(2);

    expect(results[0].name).to.equals("AecUnits");
    expect(results[0].version).to.equals("01.00.01");
    expect(results[0].validator).to.equals(0);
    expect(results[0].comparer).to.equals(0);

    expect(results[1].name).to.equals("LinearReferencing");
    expect(results[1].version).to.equals("02.00.02");
    expect(results[1].validator).to.equals(0);
    expect(results[1].comparer).to.equals(0);
  });

  it("Apply validations, App contains released and wip schemas", async () => {

    const installerDir = path.resolve(path.normalize(__dirname + "/assets/app2"));
    const results = await verifyAppSchemas(installerDir, bisSchemaRepo, outputDir);

    expect(results.length).to.equals(2);

    // Released version of AecUnits schema
    expect(results[0].name).to.equals("AecUnits");
    expect(results[0].version).to.equals("01.00.01");
    expect(results[0].validator).to.equals(0);
    expect(results[0].comparer).to.equals(0);

    // WIP version of LinearReferencing schema
    expect(results[1].name).to.equals("LinearReferencing");
    expect(results[1].version).to.equals("02.00.04");
    expect(results[1].validator).to.equals(0);
    expect(results[1].comparer).to.equals(5);
  });

  it("Apply validations, App contains some schemas that need to be ignored", async () => {

    // app contains iip_mdb_customAttributes.01.00 ec2 schema
    // app contains SchemaA from licensing module
    const installerDir = path.resolve(path.normalize(__dirname + "/assets/app3"));
    const results = await verifyAppSchemas(installerDir, bisSchemaRepo, outputDir);

    expect(results.length).to.equals(2);

    expect(results[0].name).to.equals("AecUnits");
    expect(results[0].version).to.equals("01.00.01");
    expect(results[0].validator).to.equals(0);
    expect(results[0].comparer).to.equals(0);

    expect(results[1].name).to.equals("LinearReferencing");
    expect(results[1].version).to.equals("02.00.02");
    expect(results[1].validator).to.equals(0);
    expect(results[1].comparer).to.equals(0);
  });

  it("App Schemas Directories, when don't have licensing module", async () => {
    const installerDir = path.resolve(path.normalize(__dirname + "/assets/app1"));
    const schemaDir1 = path.resolve(path.normalize(__dirname + "/assets/app1/dist/resources/schemas"));
    const schemaDir2 = path.resolve(path.normalize(__dirname + "/assets/app1/dist/resources/other"));
    const appSchemaDirs = await generateAppSchemaDirectoryList(installerDir);

    expect(appSchemaDirs.length).to.equals(2);
    expect(appSchemaDirs[0]).to.equals(schemaDir1);
    expect(appSchemaDirs[1]).to.equals(schemaDir2);
  });

  it("App Schemas Directories, when app has licensing module exclude it", async () => {
    // app3 contains the licensing module directory containing SchemaA
    const installerDir = path.resolve(path.normalize(__dirname + "/assets/app3"));
    const schemaDir1 = path.resolve(path.normalize(__dirname + "/assets/app3/dist/resources/schemas"));
    const schemaDir2 = path.resolve(path.normalize(__dirname + "/assets/app3/dist/resources/other"));
    const appSchemaDirs = await generateAppSchemaDirectoryList(installerDir);

    expect(appSchemaDirs.length).to.equals(2);
    expect(appSchemaDirs[0]).to.equals(schemaDir1);
    expect(appSchemaDirs[1]).to.equals(schemaDir2);
  });

});
