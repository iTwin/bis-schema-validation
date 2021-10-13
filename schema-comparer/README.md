# schema-comparer

The Schema Comparer is a command-line tool, as well as a public API, that allows the comparison of two EC3.x ECSchema files and reports back all the differences discovered during the comparison.

## Quick Overview

```sh
npm install -g @bentley/schema-comparer

schema-comparer -i c:\dir1\SchemaA.ecschema.xml -i c:\dir2\SchemaB.ecschema.xml -o c:\Desired\Output\Path\ -ref1 c:\\dir1, c:\\dir2 -ref2 c:\\dir3, c:\\dir4
```

## Getting Started

### Installation

Install globally:

```sh
npm install -g @bentley/schema-comparer
```

### Comparing ECXml Schema Files

Required Parameters:

**-i, --input {path}**: The paths to an XML EC Schema files (Ex. '-i c:\dir1\SchemaA.ecschema.xml -i c:\dir2\SchemaB.ecschema.xml').

Optional Parameters:

**-o, --output {path}**: Directory to put the comparison output file in the format 'SchemaA.compare.log'.

**--ref1 {path}**: Comma-separated list of paths to search when locating schema 1 references (Ex. '-r1 c:\\dir1, c:\\dir2').

**--ref2 {path}**: Comma-separated list of paths to search when locating schema 2 references (Ex. '-r1 c:\\dir1, c:\\dir2').

For help use the '**-h**' option.

To compare two ECSchema files, run:

```sh
schema-comparer -i c:\dir1\SchemaA.ecschema.xml -i c:\dir2\SchemaB.ecschema.xml -o c:\Desired\Output\Path\ -ref1 c:\\dir1, c:\\dir2 -ref2 c:\\dir3, c:\\dir4
```

## Updating to new version

Since the package is installed globally, updating has a different syntax than normal. To update the package globally, run:

```sh
npm update -g @bentley/schema-comparer
```

## Troubleshooting

- Are you have issues comparing your ECSchema?
  - Check to make sure your ECSchema version is at least EC3.1
