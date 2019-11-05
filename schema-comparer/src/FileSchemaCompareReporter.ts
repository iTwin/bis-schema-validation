/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs-extra";
import * as path from "path";
import { SchemaCompareReporter } from "./SchemaCompareReporter";
import { Schema } from "@bentley/ecschema-metadata";

/**
 * An SchemaChangeReporter implementation that writes schema change messages
 * during schema comparison to a file with the name '{schema}.compare.txt'.
 */
export class FileSchemaCompareReporter extends SchemaCompareReporter {
  private _schemaName: string;
  private _outPath: string;
  private _stream?: fs.WriteStream;

  constructor(baseLineSchema: Schema, schemaToCompare: Schema, outPath: string) {
    super(baseLineSchema, schemaToCompare);
    this._schemaName = baseLineSchema.name;
    this._outPath = outPath;
  }

  /**
   * Initializes the file stream in preparation for logging diagnostics.
   */
  public start(headerText: string) {
    this.initializesStream(this._schemaName, this._outPath);
    this.writeLine(headerText);
  }

  /**
   * Ends the write stream.
   * @param cb Optional callback when stream has been flushed.
   */
  public end(footerText?: string, cb?: () => void) {
    if (!this._stream)
      return;

    if (footerText)
      this.writeLine(footerText);

    this._stream.end(cb);
  }

  /**
   * Adds the given IDiagnostic to a collection.
   * @param diagnostic The diagnostic to report.
   */
  protected reportFormattedChange(messageText: string) {
    this.writeLine(messageText);
  }

  private initializesStream(schemaName: string, outPath: string) {
    const realDir = path.normalize(outPath) + path.sep;
    if (!fs.pathExistsSync(realDir))
        throw new Error(`The out directory ${realDir} does not exist.`);

    const baseFile = realDir + schemaName + ".compare.log";
    this._stream = fs.createWriteStream(baseFile);
  }

  private writeLine(text: string) {
    if (!this._stream)
      return;

    this._stream.write(text + "\r\n", (err) => {
      if (err) throw err;
    });
  }
}
