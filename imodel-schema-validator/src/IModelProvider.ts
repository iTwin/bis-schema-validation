/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { IModelDb, IModelHost, IModelHostConfiguration, OpenParams, BackendRequestContext, AuthorizedBackendRequestContext } from "@bentley/imodeljs-backend";
import { assert, ClientRequestContext } from "@bentley/bentleyjs-core";
import { IModelHubClient, ImsActiveSecureTokenClient, AuthorizationToken, AccessToken, ImsUserCredentials, ImsDelegationSecureTokenClient, Config } from "@bentley/imodeljs-clients";
import { OidcConfiguration, getToken } from "@bentley/oidc-signin-tool";
import { IModelVersion } from "@bentley/imodeljs-common";
import * as rimraf from "rimraf";
import * as fs from "fs";
import * as path from "path";

/**
 * The IModelProvider establish connection with HUB to get information about iModel's
 */
export class IModelProvider {
  private static _regionCode: number = 102;

  /**
   * Setup host to connect with HUB
   * @param env: The environment for which you want to setup the host.
   * @param briefcaseDir: The directory where .bim file will be downloaded.
   */
  public static setupHost(env: string, briefcaseDir: string) {
    const iModelHostConfiguration = new IModelHostConfiguration();
    iModelHostConfiguration.briefcaseCacheDir = briefcaseDir;
    if (env === "DEV") {
      this._regionCode = 103;
      Config.App.set("imjs_buddi_resolve_url_using_region", this._regionCode);
    } else if (env === "PROD") {
      this._regionCode = 0;
      Config.App.set("imjs_buddi_resolve_url_using_region", this._regionCode);
    } else {
      Config.App.set("imjs_buddi_resolve_url_using_region", this._regionCode);
    }
    Config.App.set("imjs_default_relying_party_uri", "''");
    IModelHost.startup(iModelHostConfiguration);
  }

  /**
   * Authorize a user to connect with iModelHub.
   * @param requestContext: It is the ImsUserCredentials.
   * @param userCredentials: It is the ClientRequestContext.
   */
  private static async authorizeUser(requestContext: ClientRequestContext, userCredentials: ImsUserCredentials): Promise<AccessToken> {
    const authToken: AuthorizationToken = await (new ImsActiveSecureTokenClient()).getToken(requestContext, userCredentials);
    assert(!!authToken);
    const accessToken: AccessToken = await (new ImsDelegationSecureTokenClient()).getToken(requestContext, authToken!);
    assert(!!accessToken);

    return accessToken;
  }

  /**
   * Connects to iModelHub using IMS credentials.
   * @param userName: It's IMS username.
   * @param password: It's IMS user password.
   */
  public static async imsConnect(username: string, pword: string = "") {
    const user: ImsUserCredentials = {
      email: username,
      password: pword,
    };
    const accessToken = await this.authorizeUser(new BackendRequestContext(), user);
    return new AuthorizedBackendRequestContext(accessToken);
  }

  /**
   * Get accessToken using the oidc-signin-tool.
   * @param userName: It's OIDC login username.
   * @param password: It's OIDC login password.
   * @param regionCode: The code according to the environment
   */
  private static async getTokenFromSigninTool(username: string, password: string, regionCode: number): Promise<AccessToken> {
    const config: OidcConfiguration = {
      clientId: "imodel-schema-validator-spa",
      redirectUri: "http://localhost:3000/signin-callback",
    };

    let token;
    try {
      token = await getToken(username, password, "openid imodelhub", config, regionCode);
    } catch (err) {
      const error = "oidc-signin-tool failed to generate token and failed with error: " + err;
      throw Error(error);
    }
    return token;
  }

  /**
   * Connects to iModelHub using accessToken provided by oidc-signin-tool.
   * @param userName: The OIDC login username.
   * @param password: The OIDC login user password.
   * @param regionCode: The code according to the environment
   */
  public static async oidcConnect(username: string, password: string, regionCode: number) {
    const accessToken = await this.getTokenFromSigninTool(username, password, regionCode);
    if (!accessToken["_jwt"]) {
      const error = "jwt token value was empty string, returned from oidc-signin-tool";
      throw Error(error);
    }
    return new AuthorizedBackendRequestContext(accessToken);
  }

  /**
   * Get the id of an iModel.
   * @param projectId: The Id of a project on iModelHub.
   * @param iModelName:  The name of an iModel within the project.
   */
  public static async getIModelId(requestContext: AuthorizedBackendRequestContext, projectId: string, iModelName: string): Promise<string | undefined> {
    const client = new IModelHubClient();
    const iModels = await client.iModels.get(requestContext, projectId);
    for (let num = 0; num < iModels.length; num++) {
      if (iModels[num].name === iModelName) {
        return iModels[0].wsgId.toString();
      }
    }
    return;
  }

  /**
   * Gets an iModel from Hub and exports it's schemas to the input schemaDir
   * @param projectId: The Id of a project on iModelHub.
   * @param iModelName:  The name of an iModel within the project.
   * @param userName: The IMS user name.
   * @param password: The IMS user's password.
   */
  public static async exportIModelSchemas(imsAuth: boolean, projectId: string, iModelName: string, schemaDir: string, userName: string, password: string) {
    let requestContext;
    if (!imsAuth) {
      requestContext = await this.oidcConnect(userName, password, this._regionCode);
    } else {
      requestContext = await this.imsConnect(userName, password);
    }
    const iModelId = await this.getIModelId(requestContext, projectId, iModelName); // iModel Id based upon iModel name and Project Id
    if (!iModelId) {
      throw new Error("iModel either not exist or not found!");
    }

    const iModel: IModelDb = await IModelDb.open(requestContext, projectId, iModelId, OpenParams.fixedVersion(), IModelVersion.latest());

    if (!iModel.isOpen) {
      const error = "iModel not open: " + iModelName;
      throw new Error(error);
    }

    if (fs.existsSync(schemaDir)) {
      rimraf.sync(schemaDir);
    }

    fs.mkdirSync(schemaDir, { recursive: true });
    iModel.briefcase.nativeDb.exportSchemas(schemaDir);
    await iModel.close(requestContext);
  }

  /**
   * Downloads the iModel from the Hub, exports it's schemas and closes iModel.  Returns the directory where schemas were exported
   * @param projectId: The Id of a project on iModelHub.
   * @param iModelName: The name of an iModel within the project.
   * @param workingDir: The working directory used.
   * @param userName: The IMS user name.
   * @param password: The IMS user's password.
   */
  public static async exportSchemasFromIModel(imsAuth: boolean, projectId: string, iModelName: string, workingDir: string, userName: string, password: string, env: string): Promise<string> {
    IModelProvider.setupHost(env.toUpperCase(), workingDir);
    const iModelSchemaDir: string = path.join(workingDir, "exported");
    await IModelProvider.exportIModelSchemas(imsAuth, projectId, iModelName, iModelSchemaDir, userName, password);
    IModelHost.shutdown();

    return iModelSchemaDir;
  }
}
