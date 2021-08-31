# imodel-schema-validator
The purpose of this NPM CLI tool is to validate the schemas present within an iModel. It downloads the briefcase of the given iModel and export all the schemas within it, then it performs validations against the exported schemas.

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/)
- [Node](https://nodejs.org/en/): an installation of the latest security patch of Node 14. The Node installation also includes the **npm** package manager.
- [TypeScript](https://www.typescriptlang.org/): this is listed as a devDependency, so if you're building it from source, you will get it with `rush install`.
- [Visual Studio Code](https://code.visualstudio.com/): an optional dependency, but the repository structure is optimized for its use

### Installation

Install globally:

```sh
npm install -g @bentley/imodel-schema-validator
```

### Required Arguments

Following are the arguments required by this tool:

    **--verifyIModelSchemas**: This argument confirms that the user first want to get the launchcodes.

    **-u, --userName**: The username for connecting with HUB using OIDC Auth.

    **-p, --password**: The password for connecting with HUB using OIDC Auth.

    **-r, --projectId**: The id of a project on connect portal.

    **-i, --iModelName**: The name of an imodel present in the project mentioned in projectid.

    **-e, --environment**: The environment where imodel is present. This tool supports three enviroments: DEV, QA and PROD.

    **-b, --baseSchemaRefDir**: Root directory of all released schemas (root of BisSchemas repo).

    **-o, --output**: The path where output files will be generated.

    **-c, --checkReleaseDynamicSchema**: Check all dynamic schemas within provided iModel. Default value is false.

### Sample Command:
imodel-schema-validator --verifyIModelSchemas -u "testuser" -p "password" -r rewqkjhg-pocd-abcd-5874-254136987412 -i sample -e QA -b D:\\\\dir1\\\\BisSchemas -o D:\\\\dir2

## Updating to newer version

Since the package is installed globally, updating has a different syntax than normal. To update the package globally, run:

```sh
npm update -g @bentley/imodel-schema-validator
```

## How to build and test locally
1. Clone bis-schema-validation repository (first time) or pull updates to the repository (subsequent times) with git pull.

2. Open command prompt and navigate to the imodel-schema-validator directory e.g cd /d D:\bis-schema-validation\imodel-schema-validator

3. Install rush
    ```sh
    npm install -g @microsoft/rush
    ```
4. Install dependencies:
    ```sh
    rush install
    ```
5. Build the project
    ```sh
    rush build
    ```
6. Run Tests
    - Set following four environment variables before running the tests:
        - oidcUserName: The username for connecting with HUB.
        - oidcPassword: The password for connecting with HUB.
        - BisSchemaRepo: Root path of the bis-schemas repository.
    - Run following command:
    ```sh
    npm run test
    ```