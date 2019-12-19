
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { getSha1Hash } from "../src/Sha1HashHelper";
import { expect } from "chai";
import * as path from "path";

describe ("LaunchCodesProvider Tests", async () => {

  const signOffExecutable: any = process.env.SignoffToolPath;

  it ("Sha1 Generation, Generate Sha1 Hash for a schema having no references", async () => {
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    const sha1 = getSha1Hash(signOffExecutable, schemaAFile, "");
    expect(sha1).to.equal("b89960fea54b3eb3ee30456f76d5754ce45cb2fd");
  });

  it ("Sha1 Generation, Generate Sha1 Hash for a schema having reference schemas", async () => {
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaB.ecschema.xml");
    const references = path.normalize(__dirname + "/assets/references/");
    const sha1 = getSha1Hash(signOffExecutable, schemaBFile, references);
    expect(sha1).to.equal("03f81b66952c5e027014cdd78412458cb71730e9");
  });

  it ("Sha1 Generation Failure, Tool fails to generate the Sha1 Hash", async () => {
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaB.ecschema.xml");
    let sha1;
    try {
      sha1 = getSha1Hash(signOffExecutable, schemaBFile, "");
    } catch (error) {}
    expect(sha1).to.equal("");
  });
});
