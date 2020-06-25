/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";
import { IModelHost, SnapshotDb, BackendRequestContext, IModelJsFs } from "@bentley/imodeljs-backend";

/**
 * Prepare output file where imodel will be created
 * @param iModelDir Path to the directory
 * @param imodelName Name of imodel
 * @param fileName Name of bim file
 * @returns Path of bim file
 */
function prepareOutputFile(iModelDir: string, imodelName): string {
  const outputDir = path.join(iModelDir, imodelName);
  const schemaDir = path.join(outputDir, "schema");

  if (fs.existsSync(outputDir)) {
    rimraf.sync(outputDir);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(schemaDir);
  const outputFile = path.join(outputDir, imodelName + ".bim");
  return outputFile;
}

/**
 * Create a test schema based upon the property counts needed.
 * @param propCount Number of properties needed.
 * @param schemaDir The directory where schema will go.
 * @returns The path where schema is created.
 */
function createSchema(propCount: number, schemaDir: string): string {
  const schemaPath = path.join(schemaDir, "TestPropsSchema-" + propCount + ".01.00.00.ecschema.xml");
  if (!IModelJsFs.existsSync(schemaPath)) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
  <ECSchema schemaName="TestPropsSchema" alias="tps" version="01.00" xmlns="http://www.bentley.com/schemas/Bentley.ECXML.3.1">
      <ECSchemaReference name="BisCore" version="01.00" alias="bis"/>
      <ECEntityClass typeName="PropElement">
          <BaseClass>bis:SpatialLocationElement</BaseClass>`;
    for (let i = 0; i < propCount; ++i) {
      const propName: string = "PrimProp" + i.toString();
      xml = xml + `<ECProperty propertyName="` + propName + `" typeName="string"/>`;
    }
    xml = xml + `</ECEntityClass>
      </ECSchema>`;
    IModelJsFs.writeFileSync(schemaPath, xml);
  }
  return schemaPath;
}

/**
 * Create a test iModel
 */
export async function createTestImodel(): Promise<string> {
  const imodelDir = path.normalize(__dirname + "/../../lib/test/imodel/");
  const iModelPath = prepareOutputFile(imodelDir, "props_20");
  const schemaDir = path.join(path.dirname(iModelPath), "schema");
  const schemaFile = createSchema(50, schemaDir);
  await IModelHost.startup();
  const requestContext = new BackendRequestContext();
  const imodel = SnapshotDb.createEmpty(iModelPath, { rootSubject: { name: "test-imodel" } });
  imodel.importSchemas(requestContext, [schemaFile]);
  imodel.saveChanges();
  imodel.close();
  await IModelHost.shutdown();
  return iModelPath;
}
