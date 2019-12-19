
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { isDynamicSchema, referenceOnlyDifference } from "../src/iModelSchemaValidator";
import { SchemaComparison, CompareOptions} from "@bentley/schema-comparer";
import { expect } from "chai";
import * as path from "path";
import * as fs from "fs";

describe ("iModelSchemaValidator Tests", async () => {

  it ("Dynamic Schema, A schema is a dynamic schema.", async () => {
    const schemaFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaE.ecschema.xml");
    expect(isDynamicSchema(schemaFile)).to.equal(true);
  });

  it ("Dynamic Schema, A schema is not dynamic schema.", async () => {
    const schemaFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    expect(isDynamicSchema(schemaFile)).to.equal(false);
  });

  it ("Schema Comparison, Difference is not reference only", async () => {
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaA.ecschema.xml");
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaB.ecschema.xml");
    const references = path.normalize(__dirname + "/assets/references/");
    const outputDir = path.normalize(__dirname + "/../lib/test/");
    let referenceOnly = true;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      const compareOptions: CompareOptions = new CompareOptions(schemaAFile, schemaBFile, [references], outputDir);
      const comparisonResults = await SchemaComparison.compare(compareOptions);
      referenceOnly = referenceOnlyDifference(comparisonResults);
    } else {
      const compareOptions: CompareOptions = new CompareOptions(schemaAFile, schemaBFile, [references], outputDir);
      const comparisonResults = await SchemaComparison.compare(compareOptions);
      referenceOnly = referenceOnlyDifference(comparisonResults);
    }
    expect(referenceOnly).to.equal(false);
  });

  it ("Schema Comparison, Difference is reference only", async () => {
    const schemaAFile = path.resolve(path.normalize(__dirname + "/assets/"), "SchemaD.ecschema.xml");
    const schemaBFile = path.resolve(path.normalize(__dirname + "/assets/subAssets/"), "SchemaD.ecschema.xml");
    const references = path.normalize(__dirname + "/assets/references/");
    const outputDir = path.normalize(__dirname + "/../lib/test/");
    let referenceOnly = false;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      const compareOptions: CompareOptions = new CompareOptions(schemaAFile, schemaBFile, [references], outputDir);
      const comparisonResults = await SchemaComparison.compare(compareOptions);
      referenceOnly = referenceOnlyDifference(comparisonResults);
    } else {
      const compareOptions: CompareOptions = new CompareOptions(schemaAFile, schemaBFile, [references], outputDir);
      const comparisonResults = await SchemaComparison.compare(compareOptions);
      referenceOnly = referenceOnlyDifference(comparisonResults);
    }
    expect(referenceOnly).to.equal(true);
  });
});
