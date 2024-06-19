/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as sinon from "sinon";
import { SchemaCompareReporter } from "../SchemaCompareReporter";
import {
  AnyEnumerator, Constant, EntityClass, Enumeration, Format, InvertedUnit, KindOfQuantity, Mixin,
  Phenomenon, PrimitiveProperty, PropertyCategory, RelationshipClass, RelationshipConstraint, RelationshipEnd, Schema,
  SchemaContext, Unit, UnitSystem,
} from "@itwin/ecschema-metadata";
import { ISchemaChange, SchemaChanges, SchemaCompareDiagnostics } from "@itwin/ecschema-editing";

class TestSchemaCompareReporter extends SchemaCompareReporter {
  public reportFormattedChange(_message: string, _change?: ISchemaChange): void {
    // tslint:disable-next-line:no-console
    // console.log(message);
  }
}

describe("SchemaCompareReporter Tests", () => {
  let schemaA: Schema;
  let schemaB: Schema;
  let reporterSpy: sinon.SinonSpy<[string, ISchemaChange?]>;

  beforeEach(async () => {
    schemaA = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    schemaB = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    reporterSpy = sinon.spy(TestSchemaCompareReporter.prototype, "reportFormattedChange");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("SchemaChanges", () => {
    it("Different Schemas, with property value change, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const diag = new SchemaCompareDiagnostics.SchemaDelta(schemaA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("-Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("-\tLabel: LabelA -> LabelB", changes.propertyValueChanges[0])).to.be.true;
    });

    it("Different Schemas, with schema item added, correct message reported", async () => {
      const testClass = new EntityClass(schemaB, "TestClass");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(testClass, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
      const change = changes.entityClassChanges.get(testClass.name)!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tClass(TestClass)", change)).to.be.true;
    });

    it("Property value change, correct message reported", async () => {
      const diag = new SchemaCompareDiagnostics.SchemaDelta(schemaA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      const change = changes.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\tLabel: LabelA -> LabelB", change)).to.be.true;
    });

    it("CustomAttribute instance removed, correct message reported", async () => {
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(schemaA, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tCustomAttributes", undefined)).to.be.true;
      const change = changes.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
      expect(reporterSpy.calledWithExactly("-\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
    });

    it("CustomAttribute instance added, correct message reported", async () => {
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(schemaB, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tCustomAttributes", undefined)).to.be.true;
      const change = changes.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
      expect(reporterSpy.calledWithExactly("+\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
    });

    it("CustomAttribute removed, different schemas, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(schemaA, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("-Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("-\tCustomAttributes", undefined)).to.be.true;
      const change = changes.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
      expect(reporterSpy.calledWithExactly("-\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
    });

    it("Schema reference removed, correct message reported", async () => {
      const refSchema = new Schema(new SchemaContext(), "ReferenceSchema", "ref", 1, 0, 0);
      const diag = new SchemaCompareDiagnostics.SchemaReferenceMissing(schemaA, [refSchema]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tSchemaReferences", undefined)).to.be.true;
      const change = changes.missingSchemaReferences[0];
      expect(reporterSpy.calledWithExactly("-\t\tSchema(ReferenceSchema)", change)).to.be.true;
    });

    it("Schema reference added, correct message reported", async () => {
      const refSchema = new Schema(new SchemaContext(), "ReferenceSchema", "ref", 1, 0, 0);
      const diag = new SchemaCompareDiagnostics.SchemaReferenceMissing(schemaB, [refSchema]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tSchemaReferences", undefined)).to.be.true;
      const change = changes.missingSchemaReferences[0];
      expect(reporterSpy.calledWithExactly("+\t\tSchema(ReferenceSchema)", change)).to.be.true;
    });

    it("Schema reference version difference, correct message reported", async () => {
      const refSchema = new Schema(new SchemaContext(), "ReferenceSchema", "ref", 2, 0, 0);
      const diag = new SchemaCompareDiagnostics.SchemaReferenceDelta(schemaB, [refSchema, "01.00.00", "02.00.00"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tSchemaReferences", undefined)).to.be.true;
      const change = changes.schemaReferenceDeltas[0];
      expect(reporterSpy.calledWithExactly("!\t\tSchema(ReferenceSchema): 01.00.00 -> 02.00.00", change)).to.be.true;
    });
  });

  describe("ClassChanges", () => {
    it("Class removed, different Schemas, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const classA = new EntityClass(schemaA, "TestClass");
      const diag = new SchemaCompareDiagnostics.ClassDelta(classA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("-Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("-\tClasses", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tClass(TestClass)", undefined)).to.be.true;
      const change = changes.entityClassChanges.get("TestClass")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("-\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });

    it("Class added, different Schemas, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const classA = new EntityClass(schemaB, "TestClass");
      const diag = new SchemaCompareDiagnostics.ClassDelta(classA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaB);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("+Schema(TestSchemaB)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("+\tClasses", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tClass(TestClass)", undefined)).to.be.true;
      const change = changes.entityClassChanges.get("TestClass")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("+\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });

    it("Base Class different, correct message reported", async () => {
      const classA = new EntityClass(schemaA, "TestClass");
      const baseClassA = new EntityClass(schemaA, "BaseClassA");
      const baseClassB = new EntityClass(schemaB, "BaseClassB");
      const diag = new SchemaCompareDiagnostics.BaseClassDelta(classA, [baseClassA, baseClassB]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
      const change = changes.entityClassChanges.get("TestClass")!.baseClassDelta!;
      expect(reporterSpy.calledWithExactly("!\t\t\tBaseClass: TestSchema.BaseClassA -> TestSchema.BaseClassB", change)).to.be.true;
    });

    it("Property value change, correct message reported", async () => {
      const classA = new EntityClass(schemaA, "TestClass");
      const diag = new SchemaCompareDiagnostics.ClassDelta(classA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
      const change = changes.entityClassChanges.get("TestClass")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });

    it("CustomAttribute instance removed, correct message reported", async () => {
      const classA = new EntityClass(schemaA, "TestClass");
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(classA, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tCustomAttributes", undefined)).to.be.true;
      const change = changes.entityClassChanges.get("TestClass")!.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
      expect(reporterSpy.calledWithExactly("-\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
    });

    it("CustomAttribute instance added, correct message reported", async () => {
      const classA = new EntityClass(schemaB, "TestClass");
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(classA, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tCustomAttributes", undefined)).to.be.true;
      const change = changes.entityClassChanges.get("TestClass")!.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
      expect(reporterSpy.calledWithExactly("+\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
    });

    it("EntityClass Mixin removed, correct message reported", async () => {
      const classA = new EntityClass(schemaA, "TestClass");
      const testMixin = new Mixin(schemaA, "TestMixin");
      const diag = new SchemaCompareDiagnostics.EntityMixinMissing(classA, [testMixin]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tMixins", undefined)).to.be.true;
      const change = changes.entityClassChanges.get("TestClass")!.entityMixinChanges.get("TestSchema.TestMixin")!.entityMixinChange[0];
      expect(reporterSpy.calledWithExactly("-\t\t\t\tMixin: TestSchema.TestMixin", change)).to.be.true;
    });

    it("EntityClass Mixin added, correct message reported", async () => {
      const classA = new EntityClass(schemaB, "TestClass");
      const testMixin = new Mixin(schemaB, "TestMixin");
      const diag = new SchemaCompareDiagnostics.EntityMixinMissing(classA, [testMixin]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tMixins", undefined)).to.be.true;
      const change = changes.entityClassChanges.get("TestClass")!.entityMixinChanges.get("TestSchema.TestMixin")!.entityMixinChange[0];
      expect(reporterSpy.calledWithExactly("+\t\t\t\tMixin: TestSchema.TestMixin", change)).to.be.true;
    });

    describe("RelationshipConstraint changes", () => {
      it("Relationship source constraint property value change, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintDelta(constraint, ["polymorphic", true, false]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.sourceConstraintChanges.get("TestClass:Source")!.propertyValueChanges[0];
        expect(reporterSpy.calledWithExactly("!\t\t\t\tPolymorphic: true -> false", change)).to.be.true;
      });

      it("Relationship source constraint class removed, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraintClass = new EntityClass(schemaA, "TestConstraintClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintClassMissing(constraint, [constraintClass]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tConstraintClasses", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.sourceConstraintChanges.get("TestClass:Source")!.constraintClassChanges[0];
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\tConstraintClass: TestSchema.TestConstraintClass", change)).to.be.true;
      });

      it("Relationship source constraint class added, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaB, "TestClass");
        const constraintClass = new EntityClass(schemaA, "TestConstraintClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintClassMissing(constraint, [constraintClass]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tConstraintClasses", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.sourceConstraintChanges.get("TestClass:Source")!.constraintClassChanges[0];
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tConstraintClass: TestSchema.TestConstraintClass", change)).to.be.true;
      });

      it("Relationship source constraint CustomAttributeInstance removed, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(constraint, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tCustomAttributes", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.sourceConstraintChanges.get("TestClass:Source")!.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
      });

      it("Relationship source constraint CustomAttributeInstance added, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaB, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(constraint, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tCustomAttributes", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.sourceConstraintChanges.get("TestClass:Source")!.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
      });

      it("Relationship target constraint property value change, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintDelta(constraint, ["polymorphic", true, false]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.targetConstraintChanges.get("TestClass:Target")!.propertyValueChanges[0];
        expect(reporterSpy.calledWithExactly("!\t\t\t\tPolymorphic: true -> false", change)).to.be.true;
      });

      it("Relationship target constraint class removed, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraintClass = new EntityClass(schemaA, "TestConstraintClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintClassMissing(constraint, [constraintClass]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tConstraintClasses", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.targetConstraintChanges.get("TestClass:Target")!.constraintClassChanges[0];
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\tConstraintClass: TestSchema.TestConstraintClass", change)).to.be.true;
      });

      it("Relationship target constraint class added, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaB, "TestClass");
        const constraintClass = new EntityClass(schemaB, "TestConstraintClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintClassMissing(constraint, [constraintClass]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tConstraintClasses", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.targetConstraintChanges.get("TestClass:Target")!.constraintClassChanges[0];
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tConstraintClass: TestSchema.TestConstraintClass", change)).to.be.true;
      });

      it("Relationship target constraint CustomAttributeInstance removed, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(constraint, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tCustomAttributes", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.targetConstraintChanges.get("TestClass:Target")!.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
      });

      it("Relationship target constraint CustomAttributeInstance added, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaB, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(constraint, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tCustomAttributes", undefined)).to.be.true;
        const change = changes.relationshipClassChanges.get("TestClass")!.targetConstraintChanges.get("TestClass:Target")!.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
      });
    });

    describe("PropertyChanges", () => {
      it("Property removed, correct message reported", async () => {
        const classA = new EntityClass(schemaA, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const diag = new SchemaCompareDiagnostics.PropertyMissing(property);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties", undefined)).to.be.true;
        const change = changes.entityClassChanges.get("TestClass")!.propertyChanges.get("TestProperty")!.propertyMissing;
        expect(reporterSpy.calledWithExactly("-\t\t\t\tProperty(TestProperty)", change)).to.be.true;
      });

      it("Property added, correct message reported", async () => {
        const classA = new EntityClass(schemaB, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const diag = new SchemaCompareDiagnostics.PropertyMissing(property);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties", undefined)).to.be.true;
        const change = changes.entityClassChanges.get("TestClass")!.propertyChanges.get("TestProperty")!.propertyMissing;
        expect(reporterSpy.calledWithExactly("+\t\t\t\tProperty(TestProperty)", change)).to.be.true;
      });

      it("Property value change, correct message reported", async () => {
        const classA = new EntityClass(schemaA, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const diag = new SchemaCompareDiagnostics.PropertyDelta(property, ["label", "LabelA", "LabelB"]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tProperty(TestProperty)", undefined)).to.be.true;
        const change = changes.entityClassChanges.get("TestClass")!.propertyChanges.get("TestProperty")!.propertyValueChanges[0];
        expect(reporterSpy.calledWithExactly("!\t\t\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
      });

      it("CustomAttribute instance removed, correct message reported", async () => {
        const classA = new EntityClass(schemaA, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(property, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tProperty(TestProperty)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\t\tCustomAttributes", undefined)).to.be.true;
        const change = changes.entityClassChanges.get("TestClass")!.propertyChanges.get("TestProperty")!.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
      });

      it("CustomAttribute instance added, correct message reported", async () => {
        const classA = new EntityClass(schemaB, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(property, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tProperty(TestProperty)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\t\tCustomAttributes", undefined)).to.be.true;
        const change = changes.entityClassChanges.get("TestClass")!.propertyChanges.get("TestProperty")!.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
      });

      it("CustomAttribute instance added, different schemas, correct message reported", async () => {
        schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
        const classA = new EntityClass(schemaB, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(property, [ca]);
        const changes = new SchemaChanges(schemaB);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("+Schema(TestSchemaB)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("+\tClasses", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\tClass(TestClass)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\tProperties", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\tProperty(TestProperty)", undefined)).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tCustomAttributes", undefined)).to.be.true;
        const change = changes.entityClassChanges.get("TestClass")!.propertyChanges.get("TestProperty")!.customAttributeChanges.get("TestSchema.TestCustomAttribute")!.customAttributeChanges[0];
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute", change)).to.be.true;
      });
    });
  });

  describe("EnumerationChanges", () => {
    it("Enumeration property change, different Schemas, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumerationDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("-Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("-\tEnumerations", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tEnumeration(TestItem)", undefined)).to.be.true;
      const change = changes.enumerationChanges.get("TestItem")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("-\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });

    it("Enumeration removed, correct message reported", async () => {
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations", undefined)).to.be.true;
      const change = changes.enumerationChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("-\t\tEnumeration(TestItem)", change)).to.be.true;
    });

    it("Enumeration added, correct message reported", async () => {
      const schemaItem = new Enumeration(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations", undefined)).to.be.true;
      const change = changes.enumerationChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tEnumeration(TestItem)", change)).to.be.true;
    });

    it("Enumeration property value change, correct message reported", async () => {
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumerationDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tEnumeration(TestItem)", undefined)).to.be.true;
      const change = changes.enumerationChanges.get("TestItem")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });

    it("Enumerator removed, correct message reported", async () => {
      const enumerator: AnyEnumerator = {
        name: "A",
        value: 1,
        label: "LabelA",
      };
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumeratorMissing(schemaItem, [enumerator]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tEnumeration(TestItem)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tEnumerators", undefined)).to.be.true;
      const change = changes.enumerationChanges.get("TestItem")!.enumeratorChanges.get("A")!.enumeratorMissing;
      expect(reporterSpy.calledWithExactly("-\t\t\t\tEnumerator(A)", change)).to.be.true;
    });

    it("Enumerator added, correct message reported", async () => {
      const enumerator: AnyEnumerator = {
        name: "A",
        value: 1,
        label: "LabelA",
      };
      const schemaItem = new Enumeration(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumeratorMissing(schemaItem, [enumerator]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tEnumeration(TestItem)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tEnumerators", undefined)).to.be.true;
      const change = changes.enumerationChanges.get("TestItem")!.enumeratorChanges.get("A")!.enumeratorMissing;
      expect(reporterSpy.calledWithExactly("+\t\t\t\tEnumerator(A)", change)).to.be.true;
    });

    it("Enumerator property value change, correct message reported", async () => {
      const enumerator: AnyEnumerator = {
        name: "A",
        value: 1,
        label: "LabelA",
      };
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumeratorDelta(schemaItem, [enumerator, "label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tEnumeration(TestItem)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tEnumerators", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\t\tEnumerator(A)", undefined)).to.be.true;
      const change = changes.enumerationChanges.get("TestItem")!.enumeratorChanges.get("A")!.enumeratorDeltas[0];
      expect(reporterSpy.calledWithExactly("!\t\t\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });
  });

  describe("KindOfQuantityChanges", () => {
    it("KindOfQuantity removed, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities", undefined)).to.be.true;
      const change = changes.kindOfQuantityChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("-\t\tKindOfQuantity(TestItem)", change)).to.be.true;
    });

    it("KindOfQuantity added, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities", undefined)).to.be.true;
      const change = changes.kindOfQuantityChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tKindOfQuantity(TestItem)", change)).to.be.true;
    });

    it("KindOfQuantity property value change, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.KoqDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tKindOfQuantity(TestItem)", undefined)).to.be.true;
      const change = changes.kindOfQuantityChanges.get("TestItem")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });

    it("KindOfQuantity presentation unit removed, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaA, "TestItem");
      const format = new Format(schemaA, "TestFormat");
      const diag = new SchemaCompareDiagnostics.PresentationUnitMissing(schemaItem, [format]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tKindOfQuantity(TestItem)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tPresentationUnits", undefined)).to.be.true;
      const change = changes.kindOfQuantityChanges.get("TestItem")!.presentationUnitChanges.get("TestSchema.TestFormat")!.presentationUnitChange[0];
      expect(reporterSpy.calledWithExactly("-\t\t\t\tUnit: TestSchema.TestFormat", change)).to.be.true;
    });

    it("KindOfQuantity presentation unit added, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaB, "TestItem");
      const format = new Format(schemaB, "TestFormat");
      const diag = new SchemaCompareDiagnostics.PresentationUnitMissing(schemaItem, [format]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tKindOfQuantity(TestItem)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tPresentationUnits", undefined)).to.be.true;
      const change = changes.kindOfQuantityChanges.get("TestItem")!.presentationUnitChanges.get("TestSchema.TestFormat")!.presentationUnitChange[0];
      expect(reporterSpy.calledWithExactly("+\t\t\t\tUnit: TestSchema.TestFormat", change)).to.be.true;
    });
  });

  describe("FormatChanges", () => {
    it("Format removed, correct message reported", async () => {
      const schemaItem = new Format(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats", undefined)).to.be.true;
      const change = changes.formatChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("-\t\tFormat(TestItem)", change)).to.be.true;
    });

    it("Format added, correct message reported", async () => {
      const schemaItem = new Format(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats", undefined)).to.be.true;
      const change = changes.formatChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tFormat(TestItem)", change)).to.be.true;
    });

    it("Format property value change, correct message reported", async () => {
      const schemaItem = new Format(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.FormatDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tFormat(TestItem)", undefined)).to.be.true;
      const change = changes.formatChanges.get("TestItem")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });

    it("Format unit removed, correct message reported", async () => {
      const schemaItem = new Format(schemaA, "TestItem");
      const unit = new Unit(schemaA, "TestUnit");
      const diag = new SchemaCompareDiagnostics.FormatUnitMissing(schemaItem, [unit]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tFormat(TestItem)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tUnits", undefined)).to.be.true;
      const change = changes.formatChanges.get("TestItem")!.formatUnitChanges.get("TestSchema.TestUnit")!.formatUnitChanges[0];
      expect(reporterSpy.calledWithExactly("-\t\t\t\tUnit: TestSchema.TestUnit", change)).to.be.true;
    });

    it("Format unit added, correct message reported", async () => {
      const schemaItem = new Format(schemaB, "TestItem");
      const unit = new Unit(schemaB, "TestUnit");
      const diag = new SchemaCompareDiagnostics.FormatUnitMissing(schemaItem, [unit]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tFormat(TestItem)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tUnits", undefined)).to.be.true;
      const change = changes.formatChanges.get("TestItem")!.formatUnitChanges.get("TestSchema.TestUnit")!.formatUnitChanges[0];
      expect(reporterSpy.calledWithExactly("+\t\t\t\tUnit: TestSchema.TestUnit", change)).to.be.true;
    });

    it("Format unit label override property value change, correct message reported", async () => {
      const schemaItem = new Format(schemaA, "TestItem");
      const unit = new Unit(schemaA, "TestUnit");
      const diag = new SchemaCompareDiagnostics.UnitLabelOverrideDelta(schemaItem, [unit, "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tFormat(TestItem)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tUnits", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\t\tUnit(TestSchema.TestUnit)", undefined)).to.be.true;
      const change = changes.formatChanges.get("TestItem")!.formatUnitChanges.get("TestSchema.TestUnit")!.unitLabelOverrideDeltas[0];
      expect(reporterSpy.calledWithExactly("!\t\t\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });
  });

  describe("PropertyCategoryChanges", () => {
    it("PropertyCategory removed, correct message reported", async () => {
      const schemaItem = new PropertyCategory(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPropertyCategories", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("-\t\tPropertyCategory(TestItem)", change)).to.be.true;
    });

    it("PropertyCategory added, correct message reported", async () => {
      const schemaItem = new PropertyCategory(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPropertyCategories", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tPropertyCategory(TestItem)", change)).to.be.true;
    });

    it("PropertyCategory property value change, correct message reported", async () => {
      const schemaItem = new PropertyCategory(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.PropertyCategoryDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPropertyCategories", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tPropertyCategory(TestItem)", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB", change)).to.be.true;
    });
  });

  describe("UnitChanges", () => {
    it("Unit removed, correct message reported", async () => {
      const schemaItem = new Unit(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnits", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("-\t\tUnit(TestItem)", change)).to.be.true;
    });

    it("Unit added, correct message reported", async () => {
      const schemaItem = new Unit(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnits", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tUnit(TestItem)", change)).to.be.true;
    });

    it("Unit property value change, correct message reported", async () => {
      const schemaItem = new Unit(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.UnitDelta(schemaItem, ["unitSystem", "TestSchema.UnitSystemA", "TestSchema.UnitSystemB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnits", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tUnit(TestItem)", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\t\t\tUnitSystem: TestSchema.UnitSystemA -> TestSchema.UnitSystemB", change)).to.be.true;
    });
  });

  describe("UnitSystemChanges", () => {
    it("UnitSystem removed, correct message reported", async () => {
      const schemaItem = new UnitSystem(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnitSystems", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("-\t\tUnitSystem(TestItem)", change)).to.be.true;
    });

    it("UnitSystem added, correct message reported", async () => {
      const schemaItem = new UnitSystem(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnitSystems", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tUnitSystem(TestItem)", change)).to.be.true;
    });
  });

  describe("InvertedUnitChanges", () => {
    it("InvertedUnit removed, correct message reported", async () => {
      const schemaItem = new InvertedUnit(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tInvertedUnits", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("-\t\tInvertedUnit(TestItem)", change)).to.be.true;
    });

    it("InvertedUnit added, correct message reported", async () => {
      const schemaItem = new InvertedUnit(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tInvertedUnits", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tInvertedUnit(TestItem)", change)).to.be.true;
    });

    it("InvertedUnit property value change, correct message reported", async () => {
      const schemaItem = new InvertedUnit(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.InvertedUnitDelta(schemaItem, ["InvertedUnitSystem", "TestSchema.InvertedUnitSystemA", "TestSchema.InvertedUnitSystemB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tInvertedUnits", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tInvertedUnit(TestItem)", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\t\t\tInvertedUnitSystem: TestSchema.InvertedUnitSystemA -> TestSchema.InvertedUnitSystemB", change)).to.be.true;
    });
  });

  describe("PhenomenonChanges", () => {
    it("Phenomenon removed, correct message reported", async () => {
      const schemaItem = new Phenomenon(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPhenomenons", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("-\t\tPhenomenon(TestItem)", change)).to.be.true;
    });

    it("Phenomenon added, correct message reported", async () => {
      const schemaItem = new Phenomenon(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPhenomenons", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tPhenomenon(TestItem)", change)).to.be.true;
    });

    it("Phenomenon property value change, correct message reported", async () => {
      const schemaItem = new Phenomenon(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.PhenomenonDelta(schemaItem, ["definition", "DefinitionA", "DefinitionB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPhenomenons", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tPhenomenon(TestItem)", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\t\t\tDefinition: DefinitionA -> DefinitionB", change)).to.be.true;
    });
  });

  describe("ConstantChanges", () => {
    it("Constant removed, correct message reported", async () => {
      const schemaItem = new Constant(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tConstants", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("-\t\tConstant(TestItem)", change)).to.be.true;
    });

    it("Constant added, correct message reported", async () => {
      const schemaItem = new Constant(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tConstants", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.schemaItemMissing;
      expect(reporterSpy.calledWithExactly("+\t\tConstant(TestItem)", change)).to.be.true;
    });

    it("Constant property value change, correct message reported", async () => {
      const schemaItem = new Constant(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.ConstantDelta(schemaItem, ["phenomenon", "TestSchema.PhenomenonA", "TestSchema.PhenomenonB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tConstants", undefined)).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tConstant(TestItem)", undefined)).to.be.true;
      const change = changes.schemaItemChanges.get("TestItem")!.propertyValueChanges[0];
      expect(reporterSpy.calledWithExactly("!\t\t\tPhenomenon: TestSchema.PhenomenonA -> TestSchema.PhenomenonB", change)).to.be.true;
    });
  });
});
