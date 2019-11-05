/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as utils from "./utilities/utils";
import * as path from "path";
import sinon = require("sinon");
import { assert, expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";

import * as EC from "@bentley/ecschema-metadata/lib/ecschema-metadata";
import { SchemaDeserializer } from "../src/SchemaDeserializer";
import { StubSchemaFileLocater } from "../src/StubSchemaFileLocater";

use(chaiAsPromised);

describe("SchemaDeserializer", () => {
  const assetsDir = utils.getAssetsDir();
  const refDir = utils.getReferencesDir();

  afterEach(async () => {
    sinon.restore();
  });

  describe("DeserializeXmlFile", () => {
    it("With references in separate folder, should successfully deserialize schema.", async () => {
      const deserializer = new SchemaDeserializer();
      const schemaPath = path.resolve(assetsDir, "SchemaA.ecschema.xml");

      const context = new EC.SchemaContext();
      const result = await deserializer.deserializeXmlFile(schemaPath, context, [refDir]);

      const schemaA = await context.getSchema(new EC.SchemaKey("SchemaA", 1, 1, 1), EC.SchemaMatchType.Exact);
      assert.isDefined(schemaA);
      assert.equal(result, schemaA);
      const schemaB = await schemaA!.getReference("SchemaB");
      const schemaC = await schemaA!.getReference("SchemaC");
      assert.isDefined(schemaB);
      assert.isDefined(schemaC);
      assert.deepEqual(schemaB!.schemaKey.name, "SchemaB");
      assert.deepEqual(schemaC!.schemaKey.name, "SchemaC");
    });

    it("No references, should successfully deserialize schema.", async () => {
      const deserializer = new SchemaDeserializer();
      const schemaPath = path.resolve(refDir, "SchemaD.ecschema.xml");

      const context = new EC.SchemaContext();
      const result = await deserializer.deserializeXmlFile(schemaPath, context);

      const schemaD = await context.getSchema(new EC.SchemaKey("SchemaD", 4, 4, 4), EC.SchemaMatchType.Exact);
      assert.isDefined(schemaD);
      assert.equal(result, schemaD);
    });

    it("Non-existent reference schema, throws.", async () => {
      const deserializer = new SchemaDeserializer();
      const schemaPath = path.resolve(assetsDir, "BadRefSchema.ecschema.xml");
      const context = new EC.SchemaContext();

      await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, "Unable to locate referenced schema: DoesNotExist.1.1.1");
    });

    it("Non-existent schema, throws.", async () => {
      const deserializer = new SchemaDeserializer();
      const schemaPath = path.resolve(assetsDir, "DoesNotExist.ecschema.xml");
      const context = new EC.SchemaContext();

      await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, `Unable to locate schema XML file at ${schemaPath}`);
    });

    it("Schema not found in context after de-serialization, throws.", async () => {
      const getSchema = sinon.stub(EC.SchemaContext.prototype, "getSchema");
      getSchema.onFirstCall().callThrough();
      getSchema.onSecondCall().resolves(undefined);
      const deserializer = new SchemaDeserializer();
      const schemaPath = path.resolve(refDir, "SchemaD.ecschema.xml");
      const context = new EC.SchemaContext();

      await expect(deserializer.deserializeXmlFile(schemaPath, context, [])).to.be.rejectedWith(EC.ECObjectsError, "Unable to locate schema SchemaD after de-serialization.");
    });

    it("Schema file has missing ECSchema tag, throws", async () => {
      const schemaPath = path.resolve(assetsDir, "SchemaA.ecschema.xml");
      sinon.stub(StubSchemaFileLocater.prototype, "readUtf8FileToString").withArgs(schemaPath).resolves("Bad Schema text");
      const deserializer = new SchemaDeserializer();
      const context = new EC.SchemaContext();

      await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, `Could not find '<ECSchema>' tag in the given file`);
    });

    it("Schema file has missing schema name, throws", async () => {
      const schemaPath = path.resolve(assetsDir, "SchemaA.ecschema.xml");
      sinon.stub(StubSchemaFileLocater.prototype, "readUtf8FileToString").withArgs(schemaPath).resolves(`<ECSchema version="01.01.01" />`);
      const deserializer = new SchemaDeserializer();
      const context = new EC.SchemaContext();

      await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, `Could not find the ECSchema 'schemaName' or 'version' tag in the given file`);
    });

    it("Schema file has missing schema version, throws", async () => {
      const schemaPath = path.resolve(assetsDir, "SchemaA.ecschema.xml");
      sinon.stub(StubSchemaFileLocater.prototype, "readUtf8FileToString").withArgs(schemaPath).resolves(`<ECSchema schemaName="SchemaA" />`);
      const deserializer = new SchemaDeserializer();
      const context = new EC.SchemaContext();

      await expect(deserializer.deserializeXmlFile(schemaPath, context, [refDir])).to.be.rejectedWith(EC.ECObjectsError, `Could not find the ECSchema 'schemaName' or 'version' tag in the given file`);
    });

    it("StubSchemaFileLocater getSchemaSync, throws", async () => {
      const locater = new StubSchemaFileLocater();
      expect(() => locater.getSchemaSync(new EC.SchemaKey("test"), EC.SchemaMatchType.Exact, new EC.SchemaContext())).to.throw(Error);
    });
  });
});
