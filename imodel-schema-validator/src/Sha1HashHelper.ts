import { spawnSync } from "child_process";
import * as chalk from "chalk";

/**
 * Generate the SHA1 Hash using nuget package from older tool
 * @param exePath: The path where SchemaSignffTool.exe is placed.
 * @param schemaXmlPath: Path where schema xml file is located.
 * @param referencePaths: Schema reference paths.
 */
export function getSha1Hash(exePath: string, schemaXmlPath: string, referencePaths: string): string {
  let sha1: string = "";
  try {
    const cmd = exePath;
    const args1 = [ "--computeSha1", "--schemas=" + schemaXmlPath, "--schemasReferenceSearchPaths=" + referencePaths];
    const bbs = spawnSync(cmd, args1);
    const stdout = bbs.stdout.toString();
    if (stdout.includes("SHA1 hash: ")) {
      sha1 = stdout.split("SHA1 hash: ")[1].replace(/\s/g, "");
    } else {
      console.log(chalk.default.red("SHA1 Hash not generated. Check the error below: "));
      console.log(chalk.default.red(stdout));
    }
  } catch (err) {
    throw Error("Error while generating SHA1 Hash from NuGet package: " + err.message);
  }
  return sha1;
}
