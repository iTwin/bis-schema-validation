import { expect } from "chai";
import { HubConnect, HostConfig } from "../src/iModelinfo";

describe("iModelinfo Tests", async () => {
    const username: any = process.env.MappedUserName;
    const password: any = process.env.MappedPassword;

    before( async () => {
        const imodelHost = new HostConfig();
        imodelHost.setupHost("QA");
      });

    it("iModel Id, Get an iModel id by its name", async () => {
        const obj = new HubConnect();
        await obj.connect(username, password);
        const iModelid: any = await obj.getIModelId("adc5bc7f-1b9a-4158-a0e9-accf120078b0", "Building");

        expect(iModelid).to.equal("aeea6462-e3cc-460e-bb65-0165206f0af0");
    }).timeout(100000);

    it("Wrong iModel name, When user insert wrong iModel name.", async () => {
        const obj = new HubConnect();
        await obj.connect(username, password);
        const iModelid: any = await obj.getIModelId("adc5bc7f-1b9a-4158-a0e9-accf120078b0", "Build");

        expect(iModelid, "undefined");
    }).timeout(100000);
  });
