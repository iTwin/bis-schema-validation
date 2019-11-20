import * as httpntlm from "httpntlm";
import * as path from "path";
import * as fs from "fs";

/**
 * It provides the launchcodes and its related information
 */
export class LaunchCodesProvider {

  /**
   * Generates path where launch codes file will be present
   */
  public getLaunchcodesFilePath(): string {

    const tmpDir: any = process.env.TMP;
    const date: any = new Date();
    const launchcodesFilePath: string = path.join (tmpDir, "BIM_" + date.getHours() + "_launch_codes.json");

    return launchcodesFilePath;
  }

  /**
   * Checks whether a recently downloaded launchcodes file is present or not
   * Returns json object containing launchcodes information
   */
  public getLaunchcodeDict(mustHave: boolean): any {
    const launchcodesFilePath = this.getLaunchcodesFilePath();
    let launchcodes;

    if ( fs.existsSync(launchcodesFilePath) === false) {
        if ( mustHave === true) {
            const error = "No recently downloaded launchcodes found in  " + launchcodesFilePath + " please get those first (see --getLaunchCodes)";
            throw new Error(error);
        } else {
            return launchcodes;
        }
    }

    launchcodes = fs.readFileSync(launchcodesFilePath, "utf-8");
    launchcodes = JSON.parse(launchcodes);

    return launchcodes;
  }
  /**
   * Gets the launch codes information from wiki page
   * @param username: The domain username.
   * @param password: The domain password.
   */
  public async getCheksumInfofromWiki(username: string, password: string) {
    return new Promise( (resolve: any, reject: any) => {
        httpntlm.get({
            url: "http:///bin/view.pl/Main/BisChecksum",
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
   * @param jsonFile: The launchcodes file path.
   * @param input: The data got from wiki page
   */
  public writeChecksumtoJson(jsonFile: string, input: string) {

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
}
