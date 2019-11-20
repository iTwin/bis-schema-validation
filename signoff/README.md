# imodel-schema-validation
The main purpose of this tool is to validate an iModel schemas.

## How to build, test and run a task locally
1. First clone the tooling-scripts repository
2. Navigate to the required task directory
3. Install the dependencies
    ```sh
    npm install
    ```
4. Run Tests
    - Set following four environment variables before running the tests:
        - MappedUserName: It is your ims username.
        - MappedPassword: It is your ims password.
        - Mapped_domUserName: It is your domain username.
        - Mapped_domPassword: It is your domain password.
    - Run following command:
    ```sh
    npm run test
    ```
