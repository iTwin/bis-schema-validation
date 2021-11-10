# native-schema-locater

Copyright © Bentley Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

This package contains a SchemaXmlFileLocater class which is a specialized schema XML file locater that determines if the EC schema is older than or equal to an EC31 schema. If so, the schema is deserialized using the native addon which supports these older schemas. If not, the typescript API available in the ecschema-metadata package is used for schema deserialization.  In addition, the SchemaDeserializer class allows the deserialization of a given schema XML file, using the SchemaXmlFileLocater to resolve schema references.

## Installation

```sh
npm install @bentley/native-schema-locater
```
