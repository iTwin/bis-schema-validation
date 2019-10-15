/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { Config} from "@bentley/imodeljs-clients";
export class Configurations {
    private static _env: string;
    private static _regionCode: any;
    private static _url: string;

    public setEnv( env: string) {
        Configurations._env = env;
        if (Configurations._env === "DEV" ) {
            console.log("Environment is set to DEV.");
        } else {
            Configurations._env = "QA";
            console.log("Environment is set to " + Configurations._env);
        }
    }

    public setUrl() {
        if (Configurations._env === "DEV" ) {
            Configurations._url = "https://dev-wsg20-eus.cloudapp.net";
            Config.App.set("imjs_default_relying_party_uri", Configurations._url);
        } else {
            Configurations._url = "''";
            Config.App.set("imjs_default_relying_party_uri", Configurations._url);
        }
        console.log("URL is set to " + Configurations._url);
    }

    public setRegionCode() {
        if (Configurations._env === "DEV" ) {
            Configurations._regionCode = 103;
            Config.App.set("imjs_buddi_resolve_url_using_region", Configurations._regionCode);
        } else {
            Configurations._regionCode = 102;
            Config.App.set("imjs_buddi_resolve_url_using_region", Configurations._regionCode);
        }
        console.log("RegionCode is set to " + Configurations._regionCode);
    }

}
