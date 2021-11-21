/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { BriefcaseDb, BriefcaseManager, IModelHost, IModelHostConfiguration } from "@itwin/core-backend";
import { AccessToken } from "@itwin/core-bentley";
import { IModelHubClient } from "@bentley/imodelhub-client";
import { TestBrowserAuthorizationClient, TestBrowserAuthorizationClientConfiguration, TestUserCredentials } from "@bentley/oidc-signin-tool";
import { BriefcaseProps, IModelVersionProps, RequestNewBriefcaseProps } from "@itwin/core-common";
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
  public static async setupHost(env: string, briefcaseDir: string, url: string) {
    const iModelHostConfiguration = new IModelHostConfiguration();
    iModelHostConfiguration.cacheDir = briefcaseDir;
    if (env === "DEV") {
      this._regionCode = 103;
      process.env["imjs_buddi_resolve_url_using_region"] = this._regionCode.toString();
    } else if (env === "PROD") {
      this._regionCode = 0;
      process.env["imjs_buddi_resolve_url_using_region"] = this._regionCode.toString();
    } else {
      process.env["imjs_buddi_resolve_url_using_region"] = this._regionCode.toString();
    }
    process.env["imjs_default_relying_party_uri"] = url;
    await IModelHost.startup(iModelHostConfiguration);
  }

  /**
   * Get accessToken using the oidc-signin-tool.
   * @param userName: It's OIDC login username.
   * @param secret: It's OIDC login password.
   * @param regionCode: The code according to the environment
   */
  private static async getTokenFromSigninTool(username: string, secret: string, regionCode: number): Promise<AccessToken> {
    let postfix = "";
    if (regionCode === 0) { postfix = "-prod"; }

    const oidcConfig: TestBrowserAuthorizationClientConfiguration = {
      clientId: "imodel-schema-validator-spa" + postfix,
      redirectUri: "http://localhost:3000/signin-callback",
      scope: "openid imodelhub",
    };

    const userCredentials: TestUserCredentials = {
      email: username,
      password: secret,
    };

    let token;
    try {
      const client = new TestBrowserAuthorizationClient(oidcConfig, userCredentials);
      client.deploymentRegion = regionCode;
      token = await client.getAccessToken();
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
    return accessToken;
  }

  /**
   * Get the id of an iModel.
   * @param projectId: The Id of a project on iModelHub.
   * @param iModelName:  The name of an iModel within the project.
   */
  public static async getIModelId(accessToken: AccessToken, projectId: string, iModelName: string): Promise<string | undefined> {
    const client = new IModelHubClient();
    const iModels = await client.iModels.get(accessToken, projectId);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let num = 0; num < iModels.length; num++) {
      if (iModels[num].name === iModelName) {
        return iModels[num].wsgId.toString();
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
    const accessToken = await this.oidcConnect(userName, password, this._regionCode);
    const imodelId = await this.getIModelId(accessToken, projectId, iModelName); // iModel Id based upon iModel name and Project Id

    if (!imodelId) {
      throw new Error("iModel either does not exist or cannot be found!");
    }

    const iModelVersionProps: IModelVersionProps = {
      latest: true,
    };

    const briefcaseProps: RequestNewBriefcaseProps = {
      iTwinId: projectId,
      iModelId: imodelId,
      asOf: iModelVersionProps,
    };

    const downloadedBriefcaseProps: BriefcaseProps = await BriefcaseManager.downloadBriefcase(briefcaseProps);
    console.log("Briefcase Downloaded...");

    const iModelFilePath = BriefcaseManager.getFileName(downloadedBriefcaseProps);
    console.log("iModelFilePath: " + iModelFilePath);

    const iModel = await BriefcaseDb.open({ fileName: iModelFilePath });

    try {

      if (!iModel.isOpen) {
        const error = "iModel not open: " + iModelName;
        throw new Error(error);
      }

      if (fs.existsSync(schemaDir)) {
        rimraf.sync(schemaDir);
      }

      fs.mkdirSync(schemaDir, { recursive: true });
      iModel.nativeDb.exportSchemas(schemaDir);
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
    await IModelProvider.setupHost(env.toUpperCase(), workingDir, url);
    const iModelSchemaDir: string = path.join(workingDir, "exported");
    await IModelProvider.exportIModelSchemas(projectId, iModelName, iModelSchemaDir, userName, password);
    await IModelHost.shutdown();

    return iModelSchemaDir;
  }
}
