# app-schema-validator

Copyright © Bentley Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

The purpose of this NPM CLI tool is to validate the schemas present within an applications installer. It locate the schemas present in the extracted installer and perform the validations against them.

## Getting Started

### Prerequisites

- [Node](https://nodejs.org/en/): an installation of the latest security patch of Node 20. The Node installation also includes the **npm** package manager.

### Installation

Install globally:

```sh
npm install -g @bentley/app-schema-validator
```

### Validating an application schemas

Following are the arguments required:

- **-i, --installerDir**: Path to the extracted installer.

- **-b, --baseSchemaRefDir**: Root directory of all released schemas (root of BisSchemas repo).

- **-o, --output**: The path where output files will be generated.

For help use the '**-h**' option.

#### Sample Command:

```sh
app-schema-validator -i D:\\\\dir1\\\\extracted\\app -b D:\\\\dir1\\\\bis-schemas -o D:\\\\dir1\\\\output
```

### Updating to newer version

Since the package is installed globally, updating has a different syntax than normal. To update the package globally, run:

```sh
npm update -g @bentley/app-schema-validator
```
