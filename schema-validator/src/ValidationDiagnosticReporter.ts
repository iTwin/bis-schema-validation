/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { AnyDiagnostic, diagnosticCategoryToString, FormatDiagnosticReporter } from "@bentley/ecschema-editing";

/**
 * An IDiagnosticReporter implementation that formats diagnostics into a readable string
 * and then calls the abstract method reportedFormattedDiagnostic for further processing.
 */
export abstract class ValidationDiagnosticReporter extends FormatDiagnosticReporter {

  /** Template to use when creating the diagnostic message: 0-Category, 1-Code, 2-Message */
  public static diagnosticMessageTemplate = `{0} {1}: {2}`;

  /**
   * Adds the given IDiagnostic to a collection.
   * @param diagnostic The diagnostic to report.
   */
  public reportDiagnostic(diagnostic: AnyDiagnostic, messageText: string) {
    const text = this.formatDiagnostic(diagnostic, messageText);
    this.reportFormattedDiagnostic(text);
  }

  /**
   * Allows the implementation to handle the formatted string representation of an IDiagnostic.
   * @param message
   */
  protected abstract reportFormattedDiagnostic(message: string): void;

  private formatDiagnostic(diagnostic: AnyDiagnostic, messageText: string) {
    const category = diagnosticCategoryToString(diagnostic.category);
    const args = [category, diagnostic.code, messageText];

    return this.formatStringFromArgs(ValidationDiagnosticReporter.diagnosticMessageTemplate, args);
  }
}
