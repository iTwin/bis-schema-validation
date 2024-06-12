/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { Schema, SchemaItemType } from "@itwin/ecschema-metadata";
import {
  ChangeType, ClassChanges, CustomAttributeContainerChanges, EntityClassChanges, EntityMixinChanges, EnumerationChanges, EnumeratorChanges,
  FormatChanges, FormatUnitChanges, ISchemaChange, ISchemaCompareReporter, KindOfQuantityChanges, PresentationUnitChanges,
  PropertyChanges, RelationshipClassChanges, RelationshipConstraintChanges, SchemaChanges, SchemaItemChanges,
} from "@itwin/ecschema-editing";

const SCHEMA_DEPTH = 0;
const SCHEMA_ITEM_GROUP_DEPTH = 1;
const SCHEMA_ITEM_DEPTH = 2;
const PROPERTY_GROUP_DEPTH = 3;
const PROPERTY_DEPTH = 4;
const CONSTRAINT_DEPTH = 3;
const ENUMERATORS_GROUP_DEPTH = 3;
const ENUMERATOR_DEPTH = 4;

enum ChangeTypeString {
  DELTA = "!",
  ADDED = "+",
  REMOVED = "-",
}

/**
 * An ISchemaChangeReporter implementation that formats diagnostics into a readable string
 * and then calls the abstract method reportFormattedChange for further processing.
 */
export abstract class SchemaCompareReporter implements ISchemaCompareReporter {
  private _baselineSchema: Schema;
  private _changesSchema!: Schema;
  private _schemaKeyMismatch: boolean;

  /**
   * Initializes a new SchemaCompareReporter instance.
   * @param baselineSchema The first schema to traverse and compared to the second schema.
   * @param schemaToCompare The schema that will be compared to the baseline schema.
   */
  constructor(baselineSchema: Schema, schemaToCompare: Schema) {
    this._baselineSchema = baselineSchema;
    this._schemaKeyMismatch = !baselineSchema.schemaKey.matches(schemaToCompare.schemaKey);
  }

  /**
   * Reports the given ISchemaChange.
   * @param diagnostic The ISchemaChange to report.
   */
  public report(schemaChanges: SchemaChanges): void {
    this.reportSchemaChanges(schemaChanges);
  }

  /**
   * Allows the implementation to handle the formatted string representation of an ISchemaChange entry.
   * @param message
   */
  protected abstract reportFormattedChange(message: string, change?: ISchemaChange): void;

  private reportSchemaChanges(changes: SchemaChanges) {
    if (changes.allDiagnostics.length === 0)
      return;

    this._changesSchema = changes.schema;

    this.reportHeader(SCHEMA_DEPTH, `Schema(${changes.schema.name})`);

    for (const change of changes.propertyValueChanges) {
      this.reportChange(SCHEMA_DEPTH + 1, change);
    }

    if (changes.missingSchemaReferences.length > 0 || changes.schemaReferenceDeltas.length > 0) {
      this.reportHeader(SCHEMA_DEPTH + 1, "SchemaReferences");
      for (const change of changes.missingSchemaReferences) {
        this.reportChange(SCHEMA_DEPTH + 2, change);
      }
      for (const change of changes.schemaReferenceDeltas) {
        this.reportChange(SCHEMA_DEPTH + 2, change);
      }
    }

    this.reportCAContainerChanges(SCHEMA_DEPTH + 1, changes.customAttributeChanges);
    this.reportClassChanges(changes.classChanges);
    this.reportEnumerationChanges(changes.enumerationChanges);
    this.reportKindOfQuantityChanges(changes.kindOfQuantityChanges);
    this.reportFormatChanges(changes.formatChanges);
    this.reportSchemaItemChanges(changes.schemaItemChanges);

    this.reportEntityClassChanges(changes.entityClassChanges);
    this.reportRelationshipClassChanges(changes.relationshipClassChanges);
  }

  private reportEntityClassChanges(map: Map<string, EntityClassChanges>) {
    if (map.size === 0)
      return;

    this.reportHeader(SCHEMA_ITEM_GROUP_DEPTH, "Classes");
    for (const [entityClass, changes] of map) {
      this.reportClassChange(entityClass, changes);
      this.reportEntityMixinChanges(changes.entityMixinChanges);
    }
  }

  private reportRelationshipClassChanges(map: Map<string, RelationshipClassChanges>) {
    if (map.size === 0)
      return;

    this.reportHeader(SCHEMA_ITEM_GROUP_DEPTH, "Classes");
    for (const [relationshipClass, changes] of map) {
      this.reportClassChange(relationshipClass, changes);
      this.reportSourceConstraintChanges(changes.sourceConstraintChanges);
      this.reportTargetConstraintChanges(changes.targetConstraintChanges);
    }
  }

  private reportClassChanges(map: Map<string, ClassChanges>) {
    if (map.size === 0)
      return;

    this.reportHeader(SCHEMA_ITEM_GROUP_DEPTH, "Classes");
    for (const [anyClass, classChange] of map) {
      this.reportClassChange(anyClass, classChange);
    }
  }

  private reportClassChange(className: string, changes: ClassChanges) {
    let markAsRemoved: boolean | undefined;

    if (changes.schemaItemMissing) {
      markAsRemoved = true;
      this.reportChange(SCHEMA_ITEM_DEPTH, changes.schemaItemMissing);
    } else
      this.reportHeader(SCHEMA_ITEM_DEPTH, `Class(${className})`);

    for (const change of changes.propertyValueChanges) {
      this.reportChange(SCHEMA_ITEM_DEPTH + 1, change, markAsRemoved);
    }
    if (changes.baseClassDelta) {
      this.reportChange(SCHEMA_ITEM_DEPTH + 1, changes.baseClassDelta, markAsRemoved);
    }
    this.reportPropertyChanges(changes.propertyChanges, markAsRemoved);
    // this.reportEntityMixinChanges(changes.entityMixinChanges, markAsRemoved);
    // this.reportSourceConstraintChanges(changes.sourceConstraintChanges, markAsRemoved);
    // this.reportTargetConstraintChanges(changes.targetConstraintChanges, markAsRemoved);
    this.reportCAContainerChanges(SCHEMA_ITEM_DEPTH + 1, changes.customAttributeChanges, markAsRemoved);
  }

  private reportPropertyChanges(map: Map<string, PropertyChanges>, markAsRemoved?: boolean) {
    if (map.size === 0)
      return;

    this.reportHeader(PROPERTY_GROUP_DEPTH, "Properties", markAsRemoved);
    for (const [property, changes] of map) {
      this.reportPropertyChange(property, changes, markAsRemoved);
    }
  }

  private reportPropertyChange(propertyName: string, changes: PropertyChanges, markAsRemoved?: boolean) {
    let missing = markAsRemoved;

    if (changes.propertyMissing) {
      this.reportChange(PROPERTY_DEPTH, changes.propertyMissing, markAsRemoved);
      missing = true;
    } else
      this.reportHeader(PROPERTY_DEPTH, `Property(${propertyName})`, markAsRemoved);

    for (const change of changes.propertyValueChanges) {
      this.reportChange(PROPERTY_DEPTH + 1, change, missing);
    }

    this.reportCAContainerChanges(PROPERTY_DEPTH + 1, changes.customAttributeChanges, missing);
  }

  private reportEntityMixinChanges(map: Map<string, EntityMixinChanges>, markAsRemoved?: boolean) {
    if (map.size === 0)
      return;

    this.reportHeader(SCHEMA_ITEM_DEPTH + 1, "Mixins", markAsRemoved);
    for (const [, changes] of map) {
      for (const change of changes.entityMixinChange) {
        this.reportChange(SCHEMA_ITEM_DEPTH + 2, change, markAsRemoved);
      }
    }
  }

  private reportSourceConstraintChanges(map: Map<string, RelationshipConstraintChanges>, markAsRemoved?: boolean) {
    if (map.size === 0)
      return;

    this.reportHeader(CONSTRAINT_DEPTH, "Source", markAsRemoved);
    for (const [, changes] of map) {
      this.reportRelationshipConstraintChanges(changes, markAsRemoved);
    }
  }

  private reportTargetConstraintChanges(map: Map<string, RelationshipConstraintChanges>, markAsRemoved?: boolean) {
    if (map.size === 0)
      return;

    this.reportHeader(CONSTRAINT_DEPTH, "Target", markAsRemoved);
    for (const [, changes] of map) {
      this.reportRelationshipConstraintChanges(changes, markAsRemoved);
    }
  }

  private reportRelationshipConstraintChanges(changes: RelationshipConstraintChanges, markAsRemoved?: boolean) {
    for (const change of changes.propertyValueChanges) {
      this.reportChange(CONSTRAINT_DEPTH + 1, change, markAsRemoved);
    }

    if (changes.constraintClassChanges.length > 0) {
      this.reportHeader(CONSTRAINT_DEPTH + 1, "ConstraintClasses", markAsRemoved);
      for (const change of changes.constraintClassChanges) {
        this.reportChange(CONSTRAINT_DEPTH + 2, change, markAsRemoved);
      }
    }

    this.reportCAContainerChanges(CONSTRAINT_DEPTH + 1, changes.customAttributeChanges, markAsRemoved);
  }

  private reportCAContainerChanges(depth: number, map: Map<string, CustomAttributeContainerChanges>, markAsRemoved?: boolean) {
    if (map.size === 0)
      return;

    this.reportHeader(depth, "CustomAttributes", markAsRemoved);
    for (const [, changes] of map) {
      for (const change of changes.customAttributeChanges) {
        this.reportChange(depth + 1, change, markAsRemoved);
      }
    }
  }

  private reportSchemaItemChanges(map: Map<string, SchemaItemChanges>) {
    if (map.size === 0)
      return;

    this.reportSchemaItemChangesByType(map, SchemaItemType.PropertyCategory);
    this.reportSchemaItemChangesByType(map, SchemaItemType.Unit);
    this.reportSchemaItemChangesByType(map, SchemaItemType.InvertedUnit);
    this.reportSchemaItemChangesByType(map, SchemaItemType.UnitSystem);
    this.reportSchemaItemChangesByType(map, SchemaItemType.Phenomenon);
    this.reportSchemaItemChangesByType(map, SchemaItemType.Constant);
  }

  private reportSchemaItemChangesByType(map: Map<string, SchemaItemChanges>, type: SchemaItemType) {
    const typedMap = this.filterMapBySchemaItemType(map, type);
    if (typedMap.size === 0)
      return;

    this.reportHeader(SCHEMA_ITEM_GROUP_DEPTH, this.getSchemaItemGroupText(type));
    for (const [, schemaItemChange] of typedMap) {
      this.reportSchemaItemChange(schemaItemChange);
    }
  }

  private reportSchemaItemChange(changes: SchemaItemChanges) {
    let markAsRemoved: boolean | undefined;

    if (changes.schemaItemMissing) {
      markAsRemoved = true;
      this.reportChange(SCHEMA_ITEM_DEPTH, changes.schemaItemMissing);
    } else
      this.reportHeader(SCHEMA_ITEM_DEPTH, this.getSchemaItemHeader(changes));

    for (const change of changes.propertyValueChanges) {
      this.reportChange(SCHEMA_ITEM_DEPTH + 1, change, markAsRemoved);
    }

    // this.reportCAContainerChanges(SCHEMA_ITEM_DEPTH + 1, changes.customAttributeChanges, markAsRemoved);
  }

  private reportEnumerationChanges(map: Map<string, EnumerationChanges>) {
    if (map.size === 0)
      return;

    this.reportHeader(SCHEMA_ITEM_GROUP_DEPTH, "Enumerations");
    for (const [enumeration, changes] of map) {
      this.reportEnumerationChange(enumeration, changes);
    }
  }

  private reportEnumerationChange(enumName: string, changes: EnumerationChanges) {
    let markAsRemoved: boolean | undefined;

    if (changes.schemaItemMissing) {
      markAsRemoved = true;
      this.reportChange(SCHEMA_ITEM_DEPTH, changes.schemaItemMissing);
    } else
      this.reportHeader(SCHEMA_ITEM_DEPTH, `Enumeration(${enumName})`);

    for (const change of changes.propertyValueChanges) {
      this.reportChange(SCHEMA_ITEM_DEPTH + 1, change, markAsRemoved);
    }

    this.reportEnumeratorChanges(changes.enumeratorChanges, markAsRemoved);
    // this.reportCAContainerChanges(SCHEMA_ITEM_DEPTH + 1, changes.customAttributeChanges, markAsRemoved);
  }

  private reportEnumeratorChanges(map: Map<string, EnumeratorChanges>, markAsRemoved?: boolean) {
    if (map.size === 0)
      return;

    this.reportHeader(ENUMERATORS_GROUP_DEPTH, "Enumerators", markAsRemoved);
    for (const [enumerator, changes] of map) {
      this.reportEnumeratorChange(enumerator, changes, markAsRemoved);
    }
  }

  private reportEnumeratorChange(enumeratorName: string, changes: EnumeratorChanges, markAsRemoved?: boolean) {
    if (changes.enumeratorMissing)
      this.reportChange(ENUMERATOR_DEPTH, changes.enumeratorMissing, markAsRemoved);
    else
      this.reportHeader(ENUMERATOR_DEPTH, `Enumerator(${enumeratorName})`, markAsRemoved);

    for (const delta of changes.enumeratorDeltas) {
      this.reportChange(ENUMERATOR_DEPTH + 1, delta, markAsRemoved);
    }
  }

  private reportKindOfQuantityChanges(map: Map<string, KindOfQuantityChanges>) {
    if (map.size === 0)
      return;

    this.reportHeader(1, "KindOfQuantities");
    for (const [koq, changes] of map) {
      this.reportKindOfQuantityChange(koq, changes);
    }
  }

  private reportKindOfQuantityChange(koqName: string, changes: KindOfQuantityChanges) {
    let markAsRemoved: boolean | undefined;

    if (changes.schemaItemMissing) {
      markAsRemoved = true;
      this.reportChange(SCHEMA_ITEM_DEPTH, changes.schemaItemMissing);
    } else
      this.reportHeader(SCHEMA_ITEM_DEPTH, `KindOfQuantity(${koqName})`);

    for (const change of changes.propertyValueChanges) {
      this.reportChange(SCHEMA_ITEM_DEPTH + 1, change, markAsRemoved);
    }

    this.reportPresentationUnitChanges(changes.presentationUnitChanges, markAsRemoved);
    // this.reportCAContainerChanges(SCHEMA_ITEM_DEPTH + 1, changes.customAttributeChanges, markAsRemoved);
  }

  private reportPresentationUnitChanges(map: Map<string, PresentationUnitChanges>, markAsRemoved?: boolean) {
    if (map.size === 0)
      return;

    this.reportHeader(SCHEMA_ITEM_DEPTH + 1, "PresentationUnits", markAsRemoved);
    for (const [, changes] of map) {
      for (const change of changes.presentationUnitChange) {
        this.reportChange(SCHEMA_ITEM_DEPTH + 2, change, markAsRemoved);
      }
    }
  }

  private reportFormatChanges(map: Map<string, FormatChanges>) {
    if (map.size === 0)
      return;

    this.reportHeader(SCHEMA_ITEM_GROUP_DEPTH, "Formats");
    for (const [format, changes] of map) {
      this.reportFormatChange(format, changes);
    }
  }

  private reportFormatChange(formatName: string, changes: FormatChanges) {
    let markAsRemoved: boolean | undefined;

    if (changes.schemaItemMissing) {
      markAsRemoved = true;
      this.reportChange(SCHEMA_ITEM_DEPTH, changes.schemaItemMissing);
    } else
      this.reportHeader(SCHEMA_ITEM_DEPTH, `Format(${formatName})`);

    for (const change of changes.propertyValueChanges) {
      this.reportChange(SCHEMA_ITEM_DEPTH + 1, change);
    }

    this.reportFormatUnitChanges(changes.formatUnitChanges, markAsRemoved);
    // this.reportCAContainerChanges(SCHEMA_ITEM_DEPTH + 1, changes.customAttributeChanges, markAsRemoved);
  }

  private reportFormatUnitChanges(map: Map<string, FormatUnitChanges>, markAsRemoved?: boolean) {
    if (map.size === 0)
      return;

    this.reportHeader(SCHEMA_ITEM_DEPTH + 1, "Units", markAsRemoved);
    for (const [unit, changes] of map) {
      for (const change of changes.formatUnitChanges) {
        this.reportChange(SCHEMA_ITEM_DEPTH + 2, change, markAsRemoved);
      }
      for (const change of changes.unitLabelOverrideDeltas) {
        this.reportHeader(SCHEMA_ITEM_DEPTH + 2, `Unit(${unit})`, markAsRemoved);
        this.reportChange(SCHEMA_ITEM_DEPTH + 3, change, markAsRemoved);
      }
    }
  }

  private getTabDepth(depth: number): string {
    let tabs = "";
    for (let i = 0; i < depth; i++) {
      tabs += "\t";
    }
    return tabs;
  }

  private filterMapBySchemaItemType(map: Map<string, SchemaItemChanges>, type: SchemaItemType): Map<string, SchemaItemChanges> {
    const result = new Map();
    for (const [k, v] of map) {
      if (v.schemaItemType === type) {
        result.set(k, v);
      }
    }
    return result;
  }

  private getSchemaItemHeader(change: SchemaItemChanges): string {
    switch (change.schemaItemType) {
      case SchemaItemType.PropertyCategory: return `PropertyCategory(${change.ecTypeName})`;
      case SchemaItemType.Unit: return `Unit(${change.ecTypeName})`;
      case SchemaItemType.InvertedUnit: return `InvertedUnit(${change.ecTypeName})`;
      case SchemaItemType.Constant: return `Constant(${change.ecTypeName})`;
      case SchemaItemType.Phenomenon: return `Phenomenon(${change.ecTypeName})`;
      default:
        return "";
    }
  }

  private getSchemaItemGroupText(value: SchemaItemType): string {
    switch (value) {
      case SchemaItemType.PropertyCategory: return "PropertyCategories";
      case SchemaItemType.Unit: return "Units";
      case SchemaItemType.UnitSystem: return "UnitSystems";
      case SchemaItemType.InvertedUnit: return "InvertedUnits";
      case SchemaItemType.Constant: return "Constants";
      case SchemaItemType.Phenomenon: return "Phenomenons";
      default:
        return "";
    }
  }

  private getChangeType(change: ISchemaChange, markAsRemoved?: boolean): ChangeTypeString {
    if (this._schemaKeyMismatch || markAsRemoved || change.changeType !== ChangeType.Delta) {
      return change.diagnostic.schema === this._baselineSchema ? ChangeTypeString.REMOVED : ChangeTypeString.ADDED;
    }

    return ChangeTypeString.DELTA;
  }

  private getHeaderChangeType(markAsRemoved?: boolean) {
    if (this._schemaKeyMismatch || markAsRemoved)
      return this._changesSchema === this._baselineSchema ? ChangeTypeString.REMOVED : ChangeTypeString.ADDED;

    return ChangeTypeString.DELTA;
  }

  private reportHeader(depth: number, text: string, markAsRemoved?: boolean) {
    const changeType = this.getHeaderChangeType(markAsRemoved);
    this.reportLine(changeType, depth, text);
  }

  private reportChange(depth: number, change: ISchemaChange, markAsRemoved?: boolean) {
    const changeType = this.getChangeType(change, markAsRemoved);
    this.reportLine(changeType, depth, change.toString(), change);
  }

  private reportLine(changeType: string, depth: number, text: string, change?: ISchemaChange) {
    const message = `${changeType}${this.getTabDepth(depth)}${text}`;
    this.reportFormattedChange(message, change);
  }
}
