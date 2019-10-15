/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { HubConnect, HostConfig } from "./iModelinfo";
import * as commander from "commander";
import * as chalk from "chalk";

const program = new commander.Command("signoff tool");
program.option("-u, --Username <required>", "Username for connecting with HUB.");
program.option("-p, --Password <required>", "password for connecting with HUB.");
program.option("-c, --ProjectId <required>", "Id of project on HUB.");
program.option("-i, --iModelName <required>", "Name of iModel (case sensitive) within project on HUB.");
program.option("-e, --Env <required>", "DEV or QA");
program.option("-o, --output <required>", "Directory where exported schemas will come.");

program.parse(process.argv);

if (process.argv.length === 0) {
    program.help();
}

if (!program.Username || !program.Password || !program.ProjectId || !program.iModelName || !program.output || !program.Env) {
  console.log(chalk.default.red("Invalid input. For help use the '-h' option."));
  process.exit(1);
}

async function Main() {
    const imodelHost = new HostConfig();
    imodelHost.setupHost(program.Env.toUpperCase());

    const hubConnection = new HubConnect();
    await hubConnection.connect(program.Username, program.Password);
    const iModelid: any = await hubConnection.getIModelId(program.ProjectId, program.iModelName);
    console.log("iModel Id: " + iModelid);
    if (!iModelid) {
        console.log("iModel either not exist or not found!");
        process.exit(1);
    }
    const imodel = await hubConnection.openIModel(program.ProjectId, iModelid);
    /*
    // path where bim file will be downloaded
    let localFile = imodel.briefcase.pathname;
    console.log("Path of downloaded iModel: " + localFile);
    imodel = IModelDb.openStandalone(localFile); // open a stand alone imodel
    */
    const schemaNames = imodel.executeQuery("SELECT name FROM meta.ECSchemaDef"); // get schema names

    // Getting all Schemas information present within an iModel
    for ( let item = 0; item < schemaNames.length; item++ ) {
        const name = schemaNames[item]["name"];
        const schemaInfo = imodel.briefcase.nativeDb.getSchema(name);
        console.log("Schema Name: " + name);
        console.log(schemaInfo);
        console.log("\n");
    }
    // imodel.briefcase.nativeDb.exportSchemas(program.output); // export schema files
}

Main().then()
.catch((error) => {
    console.error(error);
    process.exit(1);
});
