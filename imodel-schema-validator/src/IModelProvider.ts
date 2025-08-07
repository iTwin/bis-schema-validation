/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { BriefcaseDb, BriefcaseManager, IModelHost, IModelHostConfiguration, RequestNewBriefcaseArg } from "@itwin/core-backend";
import { GetIModelListParams, IModelsClient, toArray } from "@itwin/imodels-client-authoring";
import { AccessTokenAdapter, BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { getTestAccessToken, TestUserCredentials } from "@itwin/oidc-signin-tool";
import { IModelVersionProps } from "@itwin/core-common";
import { AccessToken } from "@itwin/core-bentley";
import * as rimraf from "rimraf";
import * as path from "path";
import * as fs from "fs";

/**
 * The IModelProvider establish connection with HUB to get information about iModel's
 */
export class IModelProvider {
  private static _regionCode: number = 0;
  private static _client: IModelsClient;
  private static _url: string = "";

  /**
   * Set url for the authority
   */
  public static set url(url: string) {
    this._url = url;
  }

  /**
   * Setup host to connect with HUB
   * @param env: The environment for which you want to setup the host.
   * @param briefcaseDir: The directory where .bim file will be downloaded.
   */
  public static async setupHost(env: string, briefcaseDir: string) {
    const iModelHostConfiguration = new IModelHostConfiguration();
    iModelHostConfiguration.cacheDir = briefcaseDir;

    if (env === "DEV") {
      this._regionCode = 103;
      process.env.IMJS_URL_PREFIX = "dev-";
    } else if (env === "QA") {
      this._regionCode = 102;
      process.env.IMJS_URL_PREFIX = "qa-";
    } else {
      this._regionCode = 0;
      process.env.IMJS_URL_PREFIX = "";
    }

    this._client = new IModelsClient({ api: { baseUrl: `https://${process.env.IMJS_URL_PREFIX}api.bentley.com/imodels` } });
    iModelHostConfiguration.hubAccess = new BackendIModelsAccess(this._client);
    await IModelHost.startup(iModelHostConfiguration);
  }

  /**
   * Get accessToken using the oidc-signin-tool.
   * @param userName: It's OIDC login username.
   * @param secret: It's OIDC login password.
   */
  public static async getTokenFromSigninTool(username: string, secret: string): Promise<AccessToken> {
    let postfix = "";
    if (this._regionCode === 0)
      postfix = "-prod";

    const oidcConfig = {
      clientId: "imodel-schema-validator-spa" + postfix,
      redirectUri: "http://localhost:3000/signin-callback",
      scope: "imodels:read",
      authority: this._regionCode === 103 || this._regionCode === 102 ? "https://qa-" + this._url : "https://" + this._url,
    };

    const userCredentials: TestUserCredentials = {
      email: username,
      password: secret,
    };

    let token;
    try {
      token = await getTestAccessToken(oidcConfig, userCredentials);
    } catch (err) {
      const error = "oidc-signin-tool failed to generate token and failed with error: " + err;
      throw Error(error);
    }
    return token;
  }

  /**
   * Get the id of an iModel.
   * @param projectId: The Id of a project on iModelHub.
   * @param iModelName:  The name of an iModel within the project.
   */
  public static async getIModelId(accessToken: AccessToken, iTwinId: string, iModelName: string): Promise<string | undefined> {
    const iModelListParams: GetIModelListParams = {
      authorization: AccessTokenAdapter.toAuthorizationCallback(async () => accessToken),
      urlParams: {
        iTwinId,
        name: iModelName,
      },
    };

    const iModelsIterator = this._client.iModels.getMinimalList(iModelListParams);
    const iModels = await toArray(iModelsIterator);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let num = 0; num < iModels.length; num++) {
      if (iModels[num].displayName === iModelName) {
        return iModels[num].id;
      }
    }
    return;
  }

  /**
   * Gets an iModel from Hub and exports it's schemas to the input schemaDir
   * @param projectId: The Id of a project on iModelHub.
   * @param iModelName:  The name of an iModel within the project.
   * @param userName: Username for OIDC Auth.
   * @param password: Password for OIDC Auth.
   */
  public static async exportIModelSchemas(projectId: string, iModelName: string, schemaDir: string, userName: string, password: string) {
    const accessToken = await this.getTokenFromSigninTool(userName, password);
    const imodelId = await this.getIModelId(accessToken, projectId, iModelName);
    const iModelFilePath = path.join(schemaDir, iModelName, iModelName + ".bim");

    if (!imodelId) {
      throw new Error("iModel either does not exist or cannot be found!");
    }

    const iModelVersionProps: IModelVersionProps = {
      latest: true,
    };

    const props: RequestNewBriefcaseArg = {
      accessToken,
      iTwinId: projectId,
      iModelId: imodelId,
      briefcaseId: 0,
      asOf: iModelVersionProps,
      fileName: iModelFilePath,
    };

    await BriefcaseManager.downloadBriefcase(props);

    console.log("Briefcase Downloaded...");

    const iModel = await BriefcaseDb.open({ fileName: iModelFilePath });
    const exportDir: string = path.join(schemaDir, iModelName, "exported");

    try {

      if (!iModel.isOpen) {
        const error = "iModel not open: " + iModelName;
        throw new Error(error);
      }

      if (fs.existsSync(exportDir)) {
        rimraf.sync(exportDir);
      }

      fs.mkdirSync(exportDir, { recursive: true });

      iModel.exportSchemas(exportDir);
    } finally {
      iModel.close();
      await BriefcaseManager.deleteBriefcaseFiles(iModelFilePath);
    }
  }

  /**
   * Downloads the iModel from the Hub, exports it's schemas and closes iModel.  Returns the directory where schemas were exported
   * @param projectId: The Id of a project on iModelHub.
   * @param iModelName: The name of an iModel within the project.
   * @param workingDir: The working directory used.
   * @param userName: Username for OIDC Auth.
   * @param password: Password for OIDC Auth.
   */
  public static async exportSchemasFromIModel(projectId: string, iModelName: string, workingDir: string, userName: string, password: string, env: string, url: string): Promise<string> {
    await IModelProvider.setupHost(env.toUpperCase(), workingDir);
    this.url = url;
    const iModelSchemaDir: string = path.join(workingDir, iModelName, "exported");
    await IModelProvider.exportIModelSchemas(projectId, iModelName, workingDir, userName, password);
    await IModelHost.shutdown();

    return iModelSchemaDir;
  }
}
