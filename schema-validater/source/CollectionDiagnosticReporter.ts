/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { FormatDiagnosticReporter } from "./FormatDiagnosticReporter";

/**
 * An IDiagnosticReporter implementation that adds formatted IDiagnostic messages
 * to a collection.
 */
export class CollectionDiagnosticReporter extends FormatDiagnosticReporter {
  private _diagnostics: string[] = [];

  /** Gets the collection of diagnostic message. */
  public get diagnostics(): string[] {
    return this._diagnostics;
  }
  /**
   * Adds the given IDiagnostic formatted string to a collection.
   * @param messageText The diagnostic to report.
   */
  protected reportFormattedDiagnostic(messageText: string) {
    this._diagnostics.push(messageText);
  }
}
