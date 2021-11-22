/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { ISchemaChange } from "@itwin/ecschema-editing";
import { SchemaCompareReporter } from "./SchemaCompareReporter";

export interface IFormattedSchemaChange {
  message: string;
  change?: ISchemaChange;
}

/**
 * A ComparisonDiagnosticReporter implementation that adds formatted schema change messages
 * to a collection.
 */
export class CollectionSchemaCompareReporter extends SchemaCompareReporter {
  private _results: IFormattedSchemaChange[] = [];

  /** Gets the collection of schema change messages. */
  public get changeMessages(): IFormattedSchemaChange[] {
    return this._results;
  }
  /**
   * Adds the given formatted string to a collection.
   * @param messageText The schema change to report.
   */
  protected reportFormattedChange(messageText: string, schemaChange?: ISchemaChange) {
    this._results.push({ message: messageText, change: schemaChange });
  }
}
