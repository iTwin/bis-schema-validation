/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { IModelDb, IModelHost, IModelHostConfiguration, OpenParams, BackendRequestContext, AuthorizedBackendRequestContext } from "@bentley/imodeljs-backend";
import { assert, ClientRequestContext } from "@bentley/bentleyjs-core";
import { IModelHubClient, ImsActiveSecureTokenClient, AuthorizationToken, AccessToken, AuthorizedClientRequestContext, ImsUserCredentials, ImsDelegationSecureTokenClient, Config } from "@bentley/imodeljs-clients";
import { IModelVersion } from "@bentley/imodeljs-common";

/**
 * The HostConfig setup host with custom properties
 */
export class HostConfig {
  /**
   * Setup host to connect with HUB
   * @param env: The environment for which you want to setup the host.
   * @param briefcaseDir: The directory where .bim file will be downloaded.
   */
    public setupHost(env: string, briefcaseDir: string) {
        const imodelHostConfiguration = new IModelHostConfiguration();
        imodelHostConfiguration.briefcaseCacheDir = briefcaseDir;
        if (env === "DEV" ) {
            Config.App.set("imjs_buddi_resolve_url_using_region", 103);
        } else if (env === "PROD" ) {
            Config.App.set("imjs_buddi_resolve_url_using_region", 0);
        } else {
            Config.App.set("imjs_buddi_resolve_url_using_region", 102);
        }
        Config.App.set("imjs_default_relying_party_uri", "''");
        IModelHost.startup(imodelHostConfiguration);
    }
}

/**
 * The IModelProvider establish connection with HUB to get information about iModel's
 */
export class IModelProvider {
    private static _requestContext: AuthorizedClientRequestContext;
    private static _accesstoken: AccessToken;
    public constructor() {
    }

   /**
    * Authorize a user to connect with iModelHub.
    * @param requestContext: It is the ImsUserCredentials.
    * @param userCredentials: It is the ClientRequestContext.
    */
    private async authorizeUser (requestContext: ClientRequestContext, userCredentials: ImsUserCredentials): Promise<AccessToken> {
        const authToken: AuthorizationToken = await (new ImsActiveSecureTokenClient()).getToken(requestContext, userCredentials);
        assert(!!authToken);
        const accessToken: AccessToken = await (new ImsDelegationSecureTokenClient()).getToken(requestContext, authToken!);
        assert(!!accessToken);

        return accessToken;
    }

   /**
    * Connects to iModelHub.
    * @param userName: The IMS user name.
    * @param password: The IMS user's password.
    */
    public async connect (username: string, pword: string = "") {
        const user: ImsUserCredentials = {
            email: username,
            password: pword,
        };
        IModelProvider._accesstoken = await this.authorizeUser(new BackendRequestContext(), user);
        IModelProvider._requestContext = new AuthorizedBackendRequestContext(IModelProvider._accesstoken);
    }

    /**
     * Download and open an iModel.
     * @param projectId: The Id of a project on iModelHub.
     * @param imodelId:  The Id of an iModel within the project.
     */
    public async openIModel (projectId: string, imodelId: string): Promise<IModelDb> {
        const imodel: IModelDb = await IModelDb.open(IModelProvider._requestContext, projectId, imodelId, OpenParams.fixedVersion(), IModelVersion.latest());
        return imodel;
    }

    /**
     * Close an iModel.
     * @param imodel: imodel object that needs to be closed.
     */
    public async closeIModel (imodel: IModelDb) {
            await imodel.close(IModelProvider._requestContext);
    }

    /**
     * Get the id of an iModel.
     * @param projectId: The Id of a project on iModelHub.
     * @param iModelName:  The name of an iModel within the project.
     */
    public async getIModelId (projectId: string, iModelName: string): Promise<string | undefined> {
        const client = new IModelHubClient();
        const imodels = await client.iModels.get(IModelProvider._requestContext, projectId);
        for ( let num = 0; num < imodels.length; num++ ) {
            if (imodels[num].name === iModelName) {
                return imodels[0].wsgId.toString();
            }
        }
        return;
      }
}
