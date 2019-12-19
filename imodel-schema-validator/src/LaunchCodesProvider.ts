import * as httpntlm from "httpntlm";
import * as path from "path";
import * as fs from "fs";

/**
 * It provides the launch codes and its related information
 */
export class LaunchCodesProvider {

  /**
   * Generates path where launch codes file will be present
   */
  public getLaunchCodesFilePath(): string {

    const tmpDir: any = process.env.TMP;
    const date: any = new Date();
    const launchCodesFilePath: string = path.join (tmpDir, "BIM_" + date.getHours() + "_launch_codes.json");

    return launchCodesFilePath;
  }

  /**
   * Checks whether a recently downloaded launch codes file is present or not
   * Returns json object containing launch codes information
   */
  public getLaunchCodeDict(mustHave: boolean): any {
    const launchCodesFilePath = this.getLaunchCodesFilePath();
    let launchCodes;

    if ( fs.existsSync(launchCodesFilePath) === false) {
      if ( mustHave === true) {
        const error = "No recently downloaded launch codes found in  " + launchCodesFilePath + " please get those first (see --getLaunchCodes)";
        throw new Error(error);
      } else {
        return launchCodes;
      }
    }

    launchCodes = fs.readFileSync(launchCodesFilePath, "utf-8");
    launchCodes = JSON.parse(launchCodes);

    return launchCodes;
  }

  /**
   * Gets the launch codes information from wiki page
   * @param username: The domain username.
   * @param password: The domain password.
   */
  public async getCheckSumInfoFromWiki(username: string, password: string) {
    return new Promise( (resolve: any, reject: any) => {
      httpntlm.get({
        url: "http://bsw-wiki.bentley.com/bin/view.pl/Main/BisChecksum",
        username: username,
        password: password,
        workstation: "",
        domain: "",
      }, (err: any, res: any) => {
        if (err) {
          reject(err);
        }
        resolve(res.body);
      });
    });
  }

  /**
   * Format checksum information in json format and store it
   * @param jsonFile: The launch codes file path.
   * @param input: The data got from wiki page
   */
  public writeCheckSumToJson(jsonFile: string, input: string) {

    let checker: number = 0;
    let count: number = 0;
    let checksums: any = [];
    const data: any = { };
    data.checksumInfo = [];
    const lines = input.split(/\r?\n/);

    // find checksum information from a input file
    for (let line = 0; line < lines.length; line++) {
      if ((lines[line]).toString().toLowerCase().includes("foswikitablecol")) {

        if ((lines[line]).toString().toLowerCase().includes("formats")) {
          checker = 1;
        }

        if (checker === 1) {
          if ((lines[line]).toString().toLowerCase().includes("foswikitablecol" + count)) {
            const values = (lines[line]).toString().split('">');
            let value = values[1].toString().replace("</td>", "").trim();

            if (value.toLowerCase().includes("<a href=")) {
              value = value.split('<a href="')[1];
            }

            if (value.toLowerCase() === "&nbsp;") {
              value = value.replace("&nbsp;", "");
            }

            checksums.push(value);
            if (count === 11) {
              const schemaChecksum = {
                SchemaName: checksums[0],
                C14MD5Checksum: checksums[1],
                Dynamic: checksums[2],
                Author: checksums[3],
                ok: checksums[4],
                Verify: checksums[5],
                ok1: checksums[6],
                Date: checksums[7],
                Comment: checksums[8],
                Location: checksums[9],
                HGid: checksums[10],
                SHA1Checksum: checksums[11],
              };

              data.checksumInfo.push(schemaChecksum);
              checksums = [];
              count = 0;

            } else {
              count = count + 1;
            }
          }
        }
      }
    }
    fs.writeFile (jsonFile, JSON.stringify(data),  (err) => {
      if (err) throw err;
    },
    );
  }

  /**
   * Find approval and verification status of schema in launchCodes
   * @param schemaName: Name of the schema.
   * @param index: The index where checksum value was matched.
   * @param launchCodes: Json object containing the launchCodes.
   */
  public checkApprovalAndVerification(schemaName: string, index: number | undefined, launchCodes: any): boolean {
    if (index !== undefined && launchCodes.checksumInfo[index]["SchemaName"].toLowerCase() === schemaName.toLowerCase()) {
      if (launchCodes.checksumInfo[index]["ok"].toLowerCase() === "yes" && launchCodes.checksumInfo[index]["ok1"].toLowerCase() === "yes") {
        return true;
      }
    }
    return false;
  }

  /**
   * Compares the SHA1 Hash of schema with the Hash value in launchCodes
   * @param schemaName: Name of the schema.
   * @param sha1: Its the Sha1 Hash.
   * @param launchCodes: Json object containing the launchCodes.
   */
  public compareCheckSums(schemaName: string, sha1: string | undefined, launchCodes: any) {
    let result = false;
    let schemaIndex: number | undefined;
    for (let index = 0; index < launchCodes.checksumInfo.length; index++) {
      if (launchCodes.checksumInfo[index]["SchemaName"].toLowerCase() === schemaName.toLowerCase()) {
        if (launchCodes.checksumInfo[index]["SHA1Checksum"] === sha1) {
          result = true;
          schemaIndex = index;
          return {result, schemaIndex};
        }
      }
    }
    return {result, schemaIndex};
  }
}
