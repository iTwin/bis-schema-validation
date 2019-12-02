import { expect, use } from "chai";
import * as sinon from "sinon";
import * as chaiAsPromised from "chai-as-promised";
import * as path from "path";
import * as fs from "fs";
import * as utils from "./utilities/utils";
import * as EC from "@bentley/ecschema-metadata";
import { ECSchemaXmlContext, IModelHost } from "@bentley/imodeljs-backend";
import { NativeSchemaXmlFileLocater } from "../src/NativeSchemaXmlFileLocater";

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

  it("Schema XML has no version, getSchemaKey throws.", async () => {
    const nativeLocater = new NativeSchemaXmlFileLocater();
    const schemaPath = path.join(assetDeserializationDir, "SchemaNoVersion.ecschema.xml");
    const schemaString = fs.readFileSync(schemaPath, "utf8");

    expect(() => nativeLocater.getSchemaKey(schemaString)).to.throw(EC.ECObjectsError, "Could not find the ECSchema 'schemaName' or 'version' tag in the given file.");
  });

  it("No file exists, getSchemaSync returns undefined.", async () => {
    const nativeLocater = new NativeSchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPath(assetDeserializationDir);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    sinon.stub(EC.SchemaFileLocater.prototype, "fileExistsSync").returns(false);

    expect(nativeLocater.getSchemaSync(schemaKey, EC.SchemaMatchType.Exact, context)).to.be.undefined;
  });

  it("Read schema file returns undefined, getSchemaSync returns undefined.", async () => {
    const nativeLocater = new NativeSchemaXmlFileLocater();
    nativeLocater.addSchemaSearchPath(assetDeserializationDir);
    const context = new EC.SchemaContext();
    const schemaKey = new EC.SchemaKey("SchemaA", 1, 1, 1);
    sinon.stub(EC.SchemaFileLocater.prototype, "readUtf8FileToStringSync").returns(undefined);

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
});
