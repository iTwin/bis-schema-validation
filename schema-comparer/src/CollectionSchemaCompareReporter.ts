/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { SchemaCompareReporter } from "./SchemaCompareReporter";

/**
 * A ComparisonDiagnosticReporter implementation that adds formatted schema change messages
 * to a collection.
 */
export class CollectionSchemaCompareReporter extends SchemaCompareReporter {
  private _results: string[] = [];

  /** Gets the collection of schema change messages. */
  public get changeMessages(): string[] {
    return this._results;
  }
  /**
   * Adds the given formatted string to a collection.
   * @param messageText The schema change to report.
   */
  protected reportFormattedChange(messageText: string) {
    this._results.push(messageText);
  }
}
