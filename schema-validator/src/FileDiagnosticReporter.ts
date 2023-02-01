/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs-extra";
import * as path from "path";
import { ValidationDiagnosticReporter } from "./ValidationDiagnosticReporter";

/**
 * An IDiagnosticReporter implementation that writes diagnostics messages
 * during schema validation to a file with the name '{schema}.validation.txt'.
 */
export class FileDiagnosticReporter extends ValidationDiagnosticReporter {
  private _schemaName: string;
  private _outPath: string;
  private _stream?: fs.WriteStream;

  constructor(schemaName: string, outPath: string) {
    super();
    this._schemaName = schemaName;
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
  protected reportFormattedDiagnostic(messageText: string) {
    if (!this._stream)
      return;

    this.writeLine(messageText);
  }

  private initializesStream(schemaName: string, outPath: string) {
    const realDir = path.normalize(outPath) + path.sep;
    if (!fs.pathExistsSync(realDir))
      throw new Error(`The out directory ${realDir} does not exist.`);

    const baseFile = realDir + schemaName + ".validation.log";
    this._stream = fs.createWriteStream(baseFile);
  }

  private writeLine(text: string) {
    if (!this._stream)
      return;

    this._stream.write(text + "\r\n", (err) => {
      if (err)
        throw err;
    });
  }
}
