/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect, use } from "chai";
import * as sinon from "sinon";
import * as chaiAsPromised from "chai-as-promised";
import * as path from "path";
import * as fs from "fs";
import * as EC from "@itwin/ecschema-metadata";
import { ECSchemaXmlContext, IModelHost } from "@itwin/core-backend";
import { SchemaXmlFileLocater } from "../SchemaXmlFileLocater";
import { SchemaFileLocater } from "@itwin/ecschema-locaters";

use(chaiAsPromised);

describe("SchemaXmlFileLocater.test", () => {
  const assetsDir = path.normalize(__dirname + "/assets/");
  const refDir = path.join(assetsDir, "references");

  beforeEach(async () => {
    await IModelHost.startup();
  });

  afterEach(async () => {
    await IModelHost.shutdown();
    sinon.restore();
  });

  it("Schema XML has no version, getSchemaKey throws.", async () => {
    const nativeLocater = new SchemaXmlFileLocater();
    const schemaPath = path.join(assetsDir, "SchemaNoVersion.ecschema.xml");
    const schemaString = fs.readFileSync(schemaPath, "utf8");

    expect(() => nativeLocater.getSchemaKey(schemaString)).to.throw(EC.ECObjectsError, "Could not find the ECSchema 'schemaName' or 'version' tag in the given file.");
  });

  it("Schema XML has EC v2 version, getSchemaKey returns valid SchemaKey.", async () => {
    const schemaXml = `<ECSchema schemaName="SchemaA" version="1.1" xmlns="http://www.bentley.com/schemas/Bentley.ECXML.2.0"> </ECSchema>`;
    const nativeLocater = new SchemaXmlFileLocater();
    const key = nativeLocater.getSchemaKey(schemaXml);
    expect(key).to.deep.equal(new EC.SchemaKey("SchemaA", new EC.ECVersion(1, 0, 1)));
  });

  it("Schema XML has EC v2 nameSpacePrefix, alias set properly on deserialized schema.", async () => {
    const nativeLocater = new SchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPath(assetsDir);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("ECv2Schema", 1, 0, 1);
    const schema = nativeLocater.loadSchema(schemaKey, EC.SchemaMatchType.Exact, context);
    expect(schema?.alias).to.equal("v2");
  });

  it("No file exists, getSchemaSync returns undefined.", async () => {
    const nativeLocater = new SchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPath(assetsDir);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    sinon.stub(SchemaFileLocater.prototype, "fileExistsSync").returns(false);

    expect(nativeLocater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, context)).to.be.undefined;
  });

  it("getSchemaSync returns expected schema.", async () => {
    const nativeLocater = new SchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPaths([assetsDir, refDir]);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    const schema = nativeLocater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, context);
    expect(schema?.schemaKey).to.eql(schemaKey);
  });

  it("getSchema returns expected schema.", async () => {
    const nativeLocater = new SchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPaths([assetsDir, refDir]);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    const schema = await nativeLocater.getSchema(schemaKey, EC.SchemaMatchType.Exact, context);
    expect(schema?.schemaKey).to.eql(schemaKey);
  });

  it("Read schema file returns undefined, getSchemaSync returns undefined.", async () => {
    const nativeLocater = new SchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPath(assetsDir);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    sinon.stub(SchemaFileLocater.prototype, "readUtf8FileToStringSync").returns(undefined);

    expect(nativeLocater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, context)).to.be.undefined;
  });

  it("ECSchemaXmlContext.readSchemaFromXmlFile throws non-reference error, getSchemaSync re-throws.", async () => {
    const nativeLocater = new SchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPaths([assetsDir, refDir]);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    sinon.stub(ECSchemaXmlContext.prototype, "readSchemaFromXmlFile").throws(new Error("TestError"));

    expect(() => nativeLocater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, context)).to.throw(Error, "TestError");
  });

  it("EC 3.1 Schema does not require Formats/Unit schema, formats schema not locatable, getSchema succeeds.", async () => {
    const nativeLocater = new SchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPaths([assetsDir]);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("ECv31Schema", 1, 1, 1);
    const schema = nativeLocater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, context);
    expect(schema).to.not.be.undefined;
  });

  describe("fromECv2String", () => {
    it("should succeed with properly formed version string", () => {
      const testVersion = SchemaXmlFileLocater.fromECv2String("1.3");
      expect(testVersion.read).equals(1);
      expect(testVersion.write).equals(0);
      expect(testVersion.minor).equals(3);
    });

    it("should fail with a non-number as the read version in the string", () => {
      const testVersion = SchemaXmlFileLocater.fromECv2String("NotNumber.44");
      expect(testVersion).does.not.haveOwnProperty("read");
      expect(testVersion.write).equals(0);
      expect(testVersion.minor).equals(44);
    });

    it("should fail with a non-number as the minor version in the string", () => {
      const testVersion = SchemaXmlFileLocater.fromECv2String("10.NotNumber");
      expect(testVersion).does.not.haveOwnProperty("minor");
      expect(testVersion.read).equals(10);
      expect(testVersion.write).equals(0);
    });

    it("should throw for an incomplete version string", () => {
      expect(() => SchemaXmlFileLocater.fromECv2String("")).to.throw(EC.ECObjectsError, "The read version is missing from version string, ");
      expect(() => SchemaXmlFileLocater.fromECv2String("10")).to.throw(EC.ECObjectsError, "The minor version is missing from version string, 10");
    });
  });
});
