# schema-validator

Copyright © Bentley Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

The BIS Schema Validator is a command-line tool that takes an EC3.x ECSchema and performs the BIS validation rules and outputs the results to a file.

## Quick Overview

```sh
npm install -g @bentley/schema-validator

schema-validator -i C:\Path\To\Schema\Domain.ecschema.xml -o C:\Desired\Output\Path\ -r C:\Reference\Path1 -r C:\Reference\Path2
```

## Getting Started

### Installation

Install globally:

```sh
npm install -g @bentley/schema-validator
```

### Validating and ECXml or ECJson Schema File

Required Parameters:

**-i, --input {path}**: The path to an XML or JSON EC Schema file OR a directory holding the same (all `*.ecschema.xml` and `*.ecschema.json` files found will be validated).

**-o, --output {path}**: Directory to put the validation output file in the format 'MySchema.ecschema.xml.result.txt'.

Optional Parameters:

**-r, --ref {path}**: Optional path to search when locating schema references. Example: `-r c:\\dir1 -r c:\\dir2`;

**-a, --all**: Validate the entire schema graph.

For help use the '**-h**' option.

To validate an ECSchema, run:

```sh
schema-validator -i C:\Path\To\Schema\Domain.ecschema.xml -o C:\Desired\Output\Path\ -r C:\Reference\Path1 -r C:\Reference\Path2
```

## Updating to new version

Since the package is installed globally, updating has a different syntax than normal. To update the package globally, run:

```sh
npm update -g @bentley/schema-validator
```

## Troubleshooting

- Are you have issues validating your ECSchema?
  - Check to make sure your ECSchema version is at least EC3.1
