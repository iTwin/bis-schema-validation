/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { ECSchemaOpsNativeLibrary } from "@bentley/ecschema-ops";

/**
 * Generate the SHA1 Hash using ecschema-ops package
 * @param schemaXmlPath: Path where schema xml file is located.
 * @param referencePaths: Schema reference paths.
 */
export function getSha1Hash(schemaXmlPath: string, referencePaths: string [], isExactMatch: boolean = false): string {
  const ecSchemaOpsNative = ECSchemaOpsNativeLibrary.load();
  const schemaOps = new ecSchemaOpsNative.ECSchemaOps();
  try {
    if (isExactMatch)
      return schemaOps.computeChecksumWithExactRefMatch(schemaXmlPath, referencePaths);
    else
      return schemaOps.computeChecksum(schemaXmlPath, referencePaths);
  } catch (err) {
    throw Error("Error while generating SHA1 Hash: " + err.message);
  } finally {
    const name = require.resolve(ECSchemaOpsNativeLibrary.libraryName);
    delete require.cache[name];
  }

}
