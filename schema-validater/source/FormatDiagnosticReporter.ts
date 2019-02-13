/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { DiagnosticReporterBase, AnyDiagnostic, diagnosticCategoryToString, diagnosticTypeToString } from "@bentley/ecschema-metadata";

/**
 * An IDiagnosticReporter implementation that formats diagnostics into a readable string
 * and then calls the abstract method reportedFormattedDiagnostic for further processing.
 */
export abstract class FormatDiagnosticReporter extends DiagnosticReporterBase {

  /** Template to use when creating the diagnostic message: 0-Category, 1-Message, 2-CodeText, 3-Code, 4-Type */
  public static diagnosticMessageTemplate = `Rule Violation {0}: \n Message: "{1}" \n Diagnostic Information: Code: {0}, Category: {2}, Type: {3}`;

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
    const type = diagnosticTypeToString(diagnostic.diagnosticType);
    const args = [diagnostic.code, messageText, category, type];

    return this.formatStringFromArgs(FormatDiagnosticReporter.diagnosticMessageTemplate, args);
  }
}
