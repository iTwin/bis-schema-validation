/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { IModelDb, IModelHost, IModelHostConfiguration, OpenParams, BackendRequestContext, AuthorizedBackendRequestContext } from "@bentley/imodeljs-backend";
import { assert, ClientRequestContext } from "@bentley/bentleyjs-core";
import { IModelHubClient, ImsActiveSecureTokenClient, AuthorizationToken, AccessToken, AuthorizedClientRequestContext, ImsUserCredentials, ImsDelegationSecureTokenClient } from "@bentley/imodeljs-clients";
import { IModelVersion } from "@bentley/imodeljs-common";
import { Configurations } from "./config/configurations";

export class HostConfig {
    public setupHost(env: string) {
        const config = new IModelHostConfiguration();
        const customConfig = new Configurations();
        customConfig.setEnv(env);
        customConfig.setRegionCode();
        customConfig.setUrl();
        IModelHost.startup(config);
    }
}

export class HubConnect {
    public static requestContext: AuthorizedClientRequestContext;
    public static accesstoken: AccessToken;
    public constructor() {
    }

    public authorizeUser = async (requestContext: ClientRequestContext, userCredentials: ImsUserCredentials): Promise<AccessToken> => {
        const authToken: AuthorizationToken = await (new ImsActiveSecureTokenClient()).getToken(requestContext, userCredentials);
        assert(!!authToken);
        const accessToken: AccessToken = await (new ImsDelegationSecureTokenClient()).getToken(requestContext, authToken!);
        assert(!!accessToken);
        return accessToken;
    }

    /** Connect to Hub. */
    public connect = async (username: string, pword: string = "") => {
        const user: ImsUserCredentials = {
            email: username,
            password: pword,
        };
        HubConnect.accesstoken = await this.authorizeUser(new BackendRequestContext(), user);
        HubConnect.requestContext = new AuthorizedBackendRequestContext(HubConnect.accesstoken);
    }

    /** Download and open an iModel. */
    public openIModel = async (projectId: string, imodelId: string): Promise<IModelDb> => {
        const imodel: IModelDb = await IModelDb.open(HubConnect.requestContext, projectId, imodelId, OpenParams.fixedVersion(), IModelVersion.latest());
        return imodel;
    }

    /** Close an iModel. */
    public closeIModel = async (imodel: IModelDb) => {
            await imodel.close(HubConnect.requestContext);
    }

    /** Gets the id on an iModel. */
    public getIModelId = async (projectId: string, iModelName: string): Promise<string | undefined> => {
        const client = new IModelHubClient();
        const imodels = await client.iModels.get(HubConnect.requestContext, projectId);
        for ( let num = 0; num < imodels.length; num++ ) {
            if (imodels[num].name === iModelName) {
                return imodels[0].wsgId.toString();
            }
        }
        return;
      }
}
