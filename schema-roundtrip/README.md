# schema-roundtrip

The Schema Roundtrip tool is a command-line tool that deserializes an EC Schema XML file and then re-serializes the schema back to XML, optionally comparing the output schema file to the original schema
using the @bentley/schema-comparer tool. Any differences discovered during the comparison are output to file.

## Quick Overview

```sh
npm install -g @bentley/schema-roundtrip

schema-roundtrip -i c:\dir1\Schema.ecschema.xml -o c:\Desired\Output\Path\ -r c:\\dir1 -r c:\\dir2 -c
```

## Getting Started

### Installation

Install globally:

```sh
npm install -g @bentley/schema-roundtrip
```

### Comparing ECXml Schema Files

Required Parameters:

**-i, --input {path}**: The path to an XML EC Schema files (Ex. '-i c:\dir1\Schema.ecschema.xml').

Optional Parameters:

**-o, --output {path}**: Directory to put the re-serialized schema as well as the comparison output file in the format 'Schema.compare.log'.

**-r, --ref {path}**: Comma-separated list of paths to search when locating schema 1 references (Ex. '-r1 c:\\dir1, c:\\dir2').

**-c, --compare {flag}**: Indicates if the resultant serialized schema should be compared to the input schema.

For help use the '**-h**' option.

To roundtrip an ECSchema file, run:

```sh
schema-roundtrip -i c:\dir1\Schema.ecschema.xml -o c:\Desired\Output\Path\ -r c:\\dir1 -r c:\\dir2 -c
```

## Updating to new version

Since the package is installed globally, updating has a different syntax than normal. To update the package globally, run:

```sh
npm update -g @bentley/schema-roundtrip
```
