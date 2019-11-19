import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as path from "path";
import * as fs from "fs";
import * as utils from "./utilities/utils";
import * as EC from "@bentley/ecschema-metadata";
import { NativeSchemaXmlFileLocater } from "../src/NativeSchemaXmlFileLocater";

use(chaiAsPromised);

describe("NativeSchemaXmlFileLocater.test", () => {
  const assetDeserializationDir = path.join(utils.getAssetsDir(), "xml-deserialization");

  it("Schema XML has no version, throws.", async () => {
    const nativeLocater = new NativeSchemaXmlFileLocater();
    const schemaPath = path.join(assetDeserializationDir, "SchemaNoVersion.ecschema.xml");
    const schemaString = fs.readFileSync(schemaPath, "utf8");

    expect(() => nativeLocater.getSchemaKey(schemaString)).to.throw(EC.ECObjectsError, "Could not find the ECSchema 'schemaName' or 'version' tag in the given file.");
  });
});
