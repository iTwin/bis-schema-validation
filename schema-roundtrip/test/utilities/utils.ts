/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs-extra";
import * as path from "path";

declare const __dirname: string;

export function getAssetsDir(): string {
  return path.normalize(__dirname + "/../assets/");
}

export function getReferencesDir(): string {
  return path.normalize(__dirname + "/../assets/references/");
}

export function getOutDir(): string {
  const outputDir = path.normalize(__dirname + "/../../lib/test/output/");
  fs.ensureDirSync(outputDir);
  return outputDir;
}
