/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { Logger, LogLevel } from "@bentley/bentleyjs-core";
import { FileSchemaKey } from "@bentley/ecschema-locaters";
import { SchemaGraphUtil } from "@bentley/ecschema-metadata";
import { SnapshotDb, IModelHost, BackendRequestContext } from "@bentley/imodeljs-backend";
import { StubSchemaXmlFileLocater } from "@bentley/ecschema-locaters/lib/StubSchemaXmlFileLocater";
import { validateSchema, verifyIModelSchema, IModelValidationResult, iModelValidationResultTypes, displayResults } from "../src/iModelSchemaValidator";
import {
  getSchemaInfo, removeSchemasFromList, prepareOutputFile, generateSchemaXMLName, getVerifiedSchemaName, getVersionString,
  excludeSchema, generateReleasedSchemasList, generateWIPSchemasList, generateSchemaDirectoryList, fixSchemaValidatorIssue,
} from "./utilities/utils";

describe("Import and validate schemas in bis-schemas repository", async () => {
  const bisSchemaRepo: any = process.env.BisSchemaRepo;
  const signOffExecutable: any = process.env.SignoffToolPath;
  const skipSchema: any = process.env.skipSchemaFile; // To run the validation locally and to skip any problematic schema
  const tempDir: any = process.env.TMP;
  const imodelDir: string = path.join(tempDir, "SchemaValidation", "Briefcases", "validation");
  const imodelName: string = "testimodel";
  const exportDir: string = path.join(imodelDir, imodelName, "exported");
  const outputDir: string = path.join(imodelDir, imodelName, "logs");
  let ignoreList: any[];

  beforeEach(async () => {
    const ignoreFile: string = path.join(bisSchemaRepo, "ignoreSchemaList.json");
    ignoreList = JSON.parse(fs.readFileSync(ignoreFile).toString());
  });

  it("Import latest released version of all schemas in bis-schemas repository into an iModel and perform all validations.", async () => {

    Logger.initializeToConsole();
    Logger.setLevelDefault(LogLevel.Error);

    const results: IModelValidationResult[] = [];
    const releasedSchemas = await generateReleasedSchemasList(bisSchemaRepo);
    const releaseFolders = await generateSchemaDirectoryList(bisSchemaRepo);

    for (const releasedSchema of releasedSchemas) {
      IModelHost.startup();
      console.log("\nValidating Released Schema: " + releasedSchema);
      const key = getSchemaInfo(releasedSchema);
      const schemaName = getVerifiedSchemaName(key.name, releasedSchema);
      const schemaVersion = getVersionString(key.readVersion, key.writeVersion, key.minorVersion);

      if (excludeSchema(schemaName, schemaVersion, ignoreList)) {
        IModelHost.shutdown();
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
      IModelHost.shutdown();
      const result = await verifyIModelSchema(exportDir, path.basename(releasedSchema), false, bisSchemaRepo, signOffExecutable, outputDir);
      results.push(result);
    }
    displayResults(results, bisSchemaRepo);
  });

  it("Import WIP version of all schemas from bis-schemas repository into an iModel and perform BIS-rules validation.", async () => {

    Logger.initializeToConsole();
    Logger.setLevelDefault(LogLevel.Error);

    const results: IModelValidationResult[] = [];
    let wipSchemas = await generateWIPSchemasList(bisSchemaRepo);
    let schemaDirs = await generateSchemaDirectoryList(bisSchemaRepo);

    // Currently not validating Fasteners and Asset schemas until decide the solution
    if (!skipSchema)
      wipSchemas = removeSchemasFromList(wipSchemas, ["Fasteners.ecschema.xml", "Asset.ecschema.xml"]);
    else
      wipSchemas = removeSchemasFromList(wipSchemas, [skipSchema]);

    schemaDirs = schemaDirs.concat(wipSchemas.map((schemaPath) => path.dirname(schemaPath)));
    for (const wipSchema of wipSchemas) {
      IModelHost.startup();
      console.log("\nValidating WIP Schema: " + wipSchema);
      const key = getSchemaInfo(wipSchema);
      const schemaName = getVerifiedSchemaName(key.name, wipSchema);
      const schemaVersion = getVersionString(key.readVersion, key.writeVersion, key.minorVersion);

      if (excludeSchema(schemaName, schemaVersion, ignoreList)) {
        IModelHost.shutdown();
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
        throw new Error( `Failed to import schema ${wipSchema} because ${error.toString()}`);
      }

      imodel.saveChanges();
      imodel.nativeDb.exportSchemas(exportDir);
      imodel.close();
      IModelHost.shutdown();

      const schemaXMLFile = generateSchemaXMLName(schemaName, schemaVersion);
      const validationResult: IModelValidationResult = { name: schemaName, version: "" };
      await validateSchema(path.join(exportDir, schemaXMLFile), schemaDirs, validationResult, outputDir);
      schemaDirs = fixSchemaValidatorIssue(exportDir, schemaDirs);
      if (validationResult.validator === iModelValidationResultTypes.Failed || validationResult.validator === iModelValidationResultTypes.Error) {
        results.push(validationResult);
      }
    }
    expect(results.length).to.equal(0);
  });
});
