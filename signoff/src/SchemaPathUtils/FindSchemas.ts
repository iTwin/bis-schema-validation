/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as readdirp from "readdirp";

/**
 * Returns a pair of lists: unreleasedDirs, releasedDir
 * unreleasedDirs contains all non-release directories
 * releasedDir contains all release directories
 */
export async function generateSchemaDirectoryLists(schemaDirectory: any) {
    const filter: any = {fileFilter: "*.ecschema.xml", directoryFilter: ["!node_modules", "!.vscode"]};
    const allSchemaDirs = (await readdirp.promise(schemaDirectory, filter)).map((schemaPath) => path.dirname(schemaPath.fullPath));
    const releasedDir = new Set(allSchemaDirs.filter((schemaDir) => /released/i.test(schemaDir)));
    const unreleasedDirs = new Set(allSchemaDirs.filter((schemaDir) => !/released/i.test(schemaDir)));

    return {unreleasedDirs, releasedDir};
}

/**
 * Returns a tuple containing all the non-release xml
 * Schemas that are contained in the a directory or any
 * Directories within that directory
 */

export async function findAllNonReleaseSchemaPaths(schemaDirRoot: any) {
    const filter: any = {fileFilter: "*.ecschema.xml", directoryFilter: ["!node_modules", "!.vscode"]};
    const allSchemaDirs = (await readdirp.promise(schemaDirRoot, filter)).map((schemaPath) => schemaPath.fullPath);
    const unreleasedFiles = new Set(allSchemaDirs.filter((schemaDir) => !/released/i.test(schemaDir)));
    return unreleasedFiles;
}
