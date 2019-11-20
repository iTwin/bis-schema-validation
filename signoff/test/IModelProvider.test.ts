/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import * as fs from "fs";
import { IModelProvider, HostConfig } from "../src/IModelProvider";
import { IModelDb } from "@bentley/imodeljs-backend";

describe("IModelProvider Tests", async () => {
    const username: any = process.env.MappedUserName;
    const password: any = process.env.MappedPassword;

    before( async () => {
        const imodelHost = new HostConfig();
        const temp: any = process.env.TMP;
        imodelHost.setupHost("QA", temp);
      });

    it("iModel Id, Get an iModel id by its name", async () => {
        const hubConnection = new IModelProvider();
        await hubConnection.connect(username, password);
        const iModelid: any = await hubConnection.getIModelId("9cf0d519-0436-446b-83b4-182752c9a4eb", "validation");

        expect(iModelid).to.equal("367ac967-9894-4434-842a-9d3557b3ddbd");
    });

    it("Wrong iModel name, When user insert wrong iModel name.", async () => {
        const hubConnection = new IModelProvider();
        await hubConnection.connect(username, password);
        const iModelid: any = await hubConnection.getIModelId("9cf0d519-0436-446b-83b4-182752c9a4eb", "val");

        expect(iModelid, "undefined");
    });

    it("Download iModel, Bim file is downloaded at a path.", async () => {
      const hubConnection = new IModelProvider();
      await hubConnection.connect(username, password);
      const iModelid: any = await hubConnection.getIModelId("9cf0d519-0436-446b-83b4-182752c9a4eb", "validation");
      const imodel: IModelDb = await hubConnection.openIModel("9cf0d519-0436-446b-83b4-182752c9a4eb", iModelid);
      const localFile = imodel.briefcase.pathname;
      const result = fs.existsSync(localFile);
      await hubConnection.closeIModel(imodel);

      expect(result).to.equal(true);

  });
  });
