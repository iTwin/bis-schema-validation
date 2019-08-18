# bis-rules

bis-rules is a library that contains the BIS rule set which is an implementation of an IRuleSet defined in @bentley/ecschema-metadata.  This rule set
can be consumed by the schema validation framework in @bentley/ecschema-metadata to assist EC Schema developers in finding BIS rule violations in their
schema.

## Getting Started

### Installation

Typically, this package would be installed as a dependency (not globally) to another project that performs EC Schema validation:

```sh
npm install @bentley/schema-validator
```

### Usage

The BisRuleSet can then be imported into your source like so:

```ts
import { BisRuleSet } from "@bentley/bis-rules";
```

## Known Issues
