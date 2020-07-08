/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import * as extra from "fs-extra";
import { Reporter } from "../src/Reporter";
import { overflowTableBasedCharts } from "../src/iModelQualityChecker";
import { SchemaMetaData, MetadataExtraction, Statistics } from "../src/MetaDataExtraction";

describe("Reporter class tests", async () => {
  const output = path.normalize(__dirname + "/../lib/test/output/");
  extra.ensureDirSync(output);
  const metadata: SchemaMetaData[] = [
    {
      schemaName: "testSchema1", className: "testClass1", classPropCount: 30, baseClassesFromBisPropCount: 20,
      baseClassesNotFromBisPropCount: 10, overflowTable: "testSchema1_Overflow", overflowColumnCount: 8, MetaData: [],
    },
    {
      schemaName: "testSchema2", className: "testClass2", classPropCount: 100, baseClassesFromBisPropCount: 50,
      baseClassesNotFromBisPropCount: 0, overflowTable: "testSchema1_Overflow", overflowColumnCount: 68, MetaData: [],
    },
    {
      schemaName: "testSchema3", className: "testClass3", classPropCount: 25, baseClassesFromBisPropCount: 38,
      baseClassesNotFromBisPropCount: 48, overflowTable: "testSchema1_Overflow", overflowColumnCount: 41, MetaData: [],
    }];

  it("Write the performance data and statistics to the json file. (success)", () => {

    const statistics = MetadataExtraction.getStatistics(metadata);
    if (statistics) {
      const status = Reporter.writeDataToJson(metadata, statistics, output);
      const filePath = path.join(output, "testSchema1_Overflow.json");
      let result = false;
      if (fs.existsSync(filePath))
        result = true;
      expect(status).to.equals(true);
      expect(result).to.equals(true);

      let data = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(data);

      expect(data["testSchema1_Overflow"][0].schemaName).to.equals("testSchema2");
      expect(data["testSchema1_Overflow"][0].className).to.equals("testClass2");
      expect(data["testSchema1_Overflow"][0].classPropCount).to.equals(100);
      expect(data["testSchema1_Overflow"][0].overflowColumnCount).to.equals(68);
      expect(data["maxOverflowTableProperties"]).to.equals(68);
      expect(data["minOverflowTableProperties"]).to.equals(8);
      expect(data["avgOverflowTableProperties"]).to.equals(39.00);
    }
  });

  it("Write the performance data and statistics to the json file. (failure)", () => {
    const data: SchemaMetaData[] = [];
    const stats: Statistics = { maxPropCount: 0, minPropCount: 0, avgPropCount: 0, maxClassName: "", minClassName: "" };
    const status = Reporter.writeDataToJson(data, stats, output);
    expect(status).to.equals(false);
  });

  it("Write schema logs to a text file when we have classes in a schema.", () => {
    const logs: any = [];
    const totalCount = metadata[0].baseClassesFromBisPropCount + metadata[0].baseClassesNotFromBisPropCount + metadata[0].classPropCount;
    const classInfo: string = "->  class: " + metadata[0].className + "  properties: " + totalCount + " (own: " + metadata[0].classPropCount + " baseNotBis: " + metadata[0].baseClassesNotFromBisPropCount + " baseFromBis: " + metadata[0].baseClassesFromBisPropCount + ")";
    logs.push({ classInfo: classInfo, mapping: metadata[0].MetaData });
    Reporter.writeSchemaOutput("testSchema2", logs, output);
    setTimeout(() => { console.log(); }, 10000);
    const filePath = path.join(output, "testSchema2.txt");
    let result = false;
    if (fs.existsSync(filePath))
      result = true;
    expect(result).to.equals(true);
  });

  it("Create a canvasjs chart when overflow table and its data exist.", async () => {
    let status = false;
    const outDir = path.normalize(__dirname + "/../../imodel-quality-checker/lib/test/output/");
    const overflowTable = "testSchema1_Overflow";
    overflowTableBasedCharts(["testSchema1_Overflow"], metadata, 200, outDir);
    const htmlFile = path.join(outDir, overflowTable + " All classes_Chart.html");
    if (fs.existsSync(htmlFile)) {
      status = true;
    }
    expect(status).to.equals(true);
  });

  it("Chart should not be created when overflow table does not exist.", async () => {
    let status = false;
    const overflowTable = "";
    const outDir = path.normalize(__dirname + "/../../imodel-quality-checker/lib/test/output/");
    overflowTableBasedCharts([], metadata, 200, outDir);
    const htmlFile = path.join(outDir, overflowTable + " All classes_Chart.html");
    if (fs.existsSync(htmlFile)) {
      status = true;
    }
    expect(status).to.equals(false);
  });

});
