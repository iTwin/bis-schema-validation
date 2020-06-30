
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { getSha1Hash } from "../src/Sha1HashHelper";
import { expect } from "chai";
import * as path from "path";

describe("LaunchCodesProvider Tests", async () => {

  it("Sha1 Generation, Generate Sha1 Hash for a schema having no references", async () => {
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    const sha1 = getSha1Hash(schemaAFile, [], true);
    expect(sha1).to.equal("b89960fea54b3eb3ee30456f76d5754ce45cb2fd");
  });

  it("Sha1 Generation, Generate Sha1 Hash for a schema having reference schemas", async () => {
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaB.ecschema.xml");
    const references = path.normalize(__dirname + "/assets/references/");
    const sha1 = getSha1Hash(schemaBFile, [references], true);
    expect(sha1).to.equal("03f81b66952c5e027014cdd78412458cb71730e9");
  });

  it("Sha1 Generation Failure, Tool fails to generate the Sha1 Hash", async () => {
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaB.ecschema.xml");
    let sha1;
    try {
      sha1 = getSha1Hash(schemaBFile, [], true);
    } catch (error) { }
    expect(sha1).to.equal(undefined);
  });

  it("Sha1 Generation, Generate Sha1 Hash for a schema have references of not exact match", async () => {
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaF.ecschema.xml");
    const references = path.normalize(__dirname + "/assets/references/");
    const sha1 = getSha1Hash(schemaBFile, [references], false);
    expect(sha1).to.equal("2614515f6da0b01b330893631d1ce7287b2d606b");
  });
});
