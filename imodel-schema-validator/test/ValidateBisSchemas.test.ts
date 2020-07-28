/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import * as rimraf from "rimraf";
import { Reporter } from "../src/Reporter";
import { Logger, LogLevel } from "@bentley/bentleyjs-core";
import { FileSchemaKey } from "@bentley/ecschema-locaters";
import { SchemaGraphUtil } from "@bentley/ecschema-metadata";
import { SnapshotDb, IModelHost, BackendRequestContext } from "@bentley/imodeljs-backend";
import { StubSchemaXmlFileLocater } from "@bentley/ecschema-locaters/lib/StubSchemaXmlFileLocater";
import { validateSchema, verifyIModelSchema, IModelValidationResult, iModelValidationResultTypes } from "../src/iModelSchemaValidator";
import {
  getSchemaInfo, prepareOutputFile, generateSchemaXMLName, getVerifiedSchemaName, getVersionString,
  excludeSchema, generateReleasedSchemasList, generateWIPSchemasList, generateSchemaDirectoryList, fixSchemaValidatorIssue,
} from "./utilities/utils";

describe("Import and validate schemas in bis-schemas repository", async () => {
  const bisSchemaRepo: any = process.env.BisSchemaRepo;
  const tempDir: any = process.env.TMP;
  const imodelDir: string = path.join(tempDir, "SchemaValidation", "Briefcases", "validation");
  const imodelName: string = "testimodel";
  const exportDir: string = path.join(imodelDir, imodelName, "exported");
  const outputDir: string = path.join(imodelDir, imodelName, "logs");
  let ignoreList: any[];

  before(async () => {
    const dir = path.join(imodelDir, imodelName);
    if (fs.existsSync(dir)) {
      rimraf.sync(dir);
    }
  });

  beforeEach(async () => {
    const ignoreFile: string = path.join(bisSchemaRepo, "ignoreSchemaList.json");
    ignoreList = JSON.parse(fs.readFileSync(ignoreFile).toString());
  });

  it("Import latest released version of all schemas in bis-schemas repository into an iModel and perform all validations.", async () => {

    Logger.initializeToConsole();
    Logger.setLevelDefault(LogLevel.Error);

    const outputLogs = path.join(outputDir, "released");
    const results: IModelValidationResult[] = [];
    const releasedSchemas = await generateReleasedSchemasList(bisSchemaRepo);
    const releaseFolders = await generateSchemaDirectoryList(bisSchemaRepo);

    for (const releasedSchema of releasedSchemas) {
      await IModelHost.startup();
      console.log("\nValidating Released Schema: " + releasedSchema);
      const key = getSchemaInfo(releasedSchema);
      const schemaName = getVerifiedSchemaName(key.name, releasedSchema);
      const schemaVersion = getVersionString(key.readVersion, key.writeVersion, key.minorVersion);

      if (excludeSchema(schemaName, schemaVersion, ignoreList)) {
        await IModelHost.shutdown();
        continue;
      }

      const locater = new StubSchemaXmlFileLocater();
      locater.addSchemaSearchPaths(releaseFolders);
      const loadedSchema = locater.loadSchema(releasedSchema);
      const orderedSchemas = SchemaGraphUtil.buildDependencyOrderedSchemaList(loadedSchema);
      const schemaPaths = orderedSchemas.map((s) => (s.schemaKey as FileSchemaKey).fileName);
      const requestContext = new BackendRequestContext();
      const iModelPath = prepareOutputFile(imodelDir, imodelName);
      const imodel = SnapshotDb.createEmpty(iModelPath, { rootSubject: { name: "test-imodel" } });
      await imodel.importSchemas(requestContext, schemaPaths);
      imodel.saveChanges();
      imodel.nativeDb.exportSchemas(exportDir);
      imodel.close();
      await IModelHost.shutdown();
      const result = await verifyIModelSchema(exportDir, path.basename(releasedSchema), false, bisSchemaRepo, outputLogs);
      results.push(result);
    }
    Reporter.logAllValidationsResults(results, bisSchemaRepo, outputLogs);
    Reporter.displayAllValidationsResults(results, bisSchemaRepo);
  });

  it("Import WIP version of all schemas from bis-schemas repository into an iModel and perform BIS-rules validation.", async () => {

    Logger.initializeToConsole();
    Logger.setLevelDefault(LogLevel.Error);

    const outputLogs = path.join(outputDir, "wip");
    const results: IModelValidationResult[] = [];
    const wipSchemas = await generateWIPSchemasList(bisSchemaRepo);
    let schemaDirs = await generateSchemaDirectoryList(bisSchemaRepo);

    schemaDirs = schemaDirs.concat(wipSchemas.map((schemaPath) => path.dirname(schemaPath)));
    for (const wipSchema of wipSchemas) {
      await IModelHost.startup();
      console.log("\nValidating WIP Schema: " + wipSchema);
      const key = getSchemaInfo(wipSchema);
      const schemaName = getVerifiedSchemaName(key.name, wipSchema);
      const schemaVersion = getVersionString(key.readVersion, key.writeVersion, key.minorVersion);

      if (excludeSchema(schemaName, schemaVersion, ignoreList)) {
        await IModelHost.shutdown();
        continue;
      }

      const locater = new StubSchemaXmlFileLocater();
      locater.addSchemaSearchPaths(schemaDirs);
      const loadedSchema = locater.loadSchema(wipSchema);
      const orderedSchemas = SchemaGraphUtil.buildDependencyOrderedSchemaList(loadedSchema);
      const schemaPaths = orderedSchemas.map((s) => (s.schemaKey as FileSchemaKey).fileName);
      const requestContext = new BackendRequestContext();
      const iModelPath = prepareOutputFile(imodelDir, imodelName);
      const imodel = SnapshotDb.createEmpty(iModelPath, { rootSubject: { name: "test-imodel" } });
      try {
        await imodel.importSchemas(requestContext, schemaPaths);
      } catch (error) {
        throw new Error(`Failed to import schema ${wipSchema} because ${error.toString()}`);
      }

      imodel.saveChanges();
      imodel.nativeDb.exportSchemas(exportDir);
      imodel.close();
      await IModelHost.shutdown();

      const schemaXMLFile = generateSchemaXMLName(schemaName, schemaVersion);
      const validationResult: IModelValidationResult = { name: schemaName, version: "" };
      await validateSchema(schemaName, "wip", path.join(exportDir, schemaXMLFile), schemaDirs, validationResult, outputLogs);
      schemaDirs = fixSchemaValidatorIssue(exportDir, schemaDirs);
      if (validationResult.validator === iModelValidationResultTypes.Failed || validationResult.validator === iModelValidationResultTypes.Error) {
        results.push(validationResult);
      }
    }
    expect(results.length).to.equal(0);
  });
});
