
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { LaunchCodesProvider } from "../src/LaunchCodesProvider";
import {expect} from "chai";
import * as fs from "fs";

describe ("LaunchCodesProvider Tests", async () => {
    const username: any = process.env.Mapped_domUserName;
    const password: any = process.env.Mapped_domPassword;

    it ("LaunchCodes, Get launch codes from wiki page", async () => {
        const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
        const data: any =  await launchCodesProvider.getCheksumInfofromWiki(username, password);
        const launchcodesFilePath: any = launchCodesProvider.getLaunchcodesFilePath();
        launchCodesProvider.writeChecksumtoJson(launchcodesFilePath, data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        let result: boolean = false;
        if (fs.existsSync(launchcodesFilePath)) {
            result = true;
        }
        expect(result).to.equal(true);
    });

    it ("LaunchCodes, Get launch codes from wiki page failed", async () => {
        const launchCodesProvider: LaunchCodesProvider = new LaunchCodesProvider();
        const data: any =  await launchCodesProvider.getCheksumInfofromWiki(username, "test");
        const result: boolean = data.toString().includes("Unauthorized");
        expect(result).to.equal(true);
    });
});
