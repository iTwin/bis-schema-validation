import { expect, use } from "chai";
import * as sinon from "sinon";
import * as chaiAsPromised from "chai-as-promised";
import * as path from "path";
import * as fs from "fs";
import * as utils from "./utilities/utils";
import * as EC from "@bentley/ecschema-metadata";
import { ECSchemaXmlContext, IModelHost } from "@bentley/imodeljs-backend";
import { NativeSchemaXmlFileLocater } from "../src/NativeSchemaXmlFileLocater";
import { SchemaFileLocater } from "@bentley/ecschema-locaters";

use(chaiAsPromised);

describe("NativeSchemaXmlFileLocater.test", () => {
  const assetDeserializationDir = path.join(utils.getAssetsDir(), "xml-deserialization");

  beforeEach(() => {
    IModelHost.startup();
  });

  afterEach(() => {
    IModelHost.shutdown();
    sinon.restore();
  });

  it("Schema XML has no version, throws.", async () => {
    const nativeLocater = new NativeSchemaXmlFileLocater();
    const schemaPath = path.join(assetDeserializationDir, "SchemaNoVersion.ecschema.xml");
    const schemaString = fs.readFileSync(schemaPath, "utf8");

    expect(() => nativeLocater.getSchemaKey(schemaString)).to.throw(EC.ECObjectsError, "Could not find the ECSchema 'schemaName' or 'version' tag in the given file.");
  });

  it("Schema XML has EC v2 version, getSchemaKey returns valid SchemaKey.", async () => {
    const schemaXml = `<ECSchema schemaName="SchemaA" version="1.1" xmlns="http://www.bentley.com/schemas/Bentley.ECXML.2.0"> </ECSchema>`;
    const nativeLocater = new NativeSchemaXmlFileLocater();
    const key = nativeLocater.getSchemaKey(schemaXml);
    expect(key).to.deep.equal(new EC.SchemaKey("SchemaA", new EC.ECVersion(1, 0, 1)));
  });

  it("No file exists, getSchemaSync returns undefined.", async () => {
    const nativeLocater = new NativeSchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPath(assetDeserializationDir);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    sinon.stub(SchemaFileLocater.prototype, "fileExistsSync").returns(false);

    expect(nativeLocater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, context)).to.be.undefined;
  });

  it("Read schema file returns undefined, getSchemaSync returns undefined.", async () => {
    const nativeLocater = new NativeSchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPath(assetDeserializationDir);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    sinon.stub(SchemaFileLocater.prototype, "readUtf8FileToStringSync").returns(undefined);

    expect(nativeLocater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, context)).to.be.undefined;
  });

  it("ECSchemaXmlContext.readSchemaFromXmlFile throws non-reference error, getSchemaSync re-throws.", async () => {
    const nativeLocater = new NativeSchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPath(assetDeserializationDir);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    sinon.stub(ECSchemaXmlContext.prototype, "readSchemaFromXmlFile").throws(new Error("TestError"));

    expect(() => nativeLocater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, context)).to.throw(Error, "TestError");
  });

  describe("fromECv2String", () => {
    it("should succeed with properly formed version string", () => {
      const testVersion = NativeSchemaXmlFileLocater.fromECv2String("1.3");
      expect(testVersion.read).equals(1);
      expect(testVersion.write).equals(0);
      expect(testVersion.minor).equals(3);
    });

    it("should fail with a non-number as the read version in the string", () => {
      const testVersion = NativeSchemaXmlFileLocater.fromECv2String("NotNumber.44");
      expect(testVersion).does.not.haveOwnProperty("read");
      expect(testVersion.write).equals(0);
      expect(testVersion.minor).equals(44);
    });

    it("should fail with a non-number as the minor version in the string", () => {
      const testVersion = NativeSchemaXmlFileLocater.fromECv2String("10.NotNumber");
      expect(testVersion).does.not.haveOwnProperty("minor");
      expect(testVersion.read).equals(10);
      expect(testVersion.write).equals(0);
    });

    it("should throw for an incomplete version string", () => {
      expect(() => NativeSchemaXmlFileLocater.fromECv2String("")).to.throw(EC.ECObjectsError, "The read version is missing from version string, ");
      expect(() => NativeSchemaXmlFileLocater.fromECv2String("10")).to.throw(EC.ECObjectsError, "The minor version is missing from version string, 10");
    });
  });
});
