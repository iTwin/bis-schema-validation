# Introduction

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this Repository

This repository provides validation tools for [bis-schemas](https://github.com/iTwin/bis-schemas). It is built using [Rush](http://rushjs.io/).

See [rush.json](./rush.json) for the complete list of packages.

Each package has its own **node_modules** directory that contains symbolic links to *common* dependencies managed by Rush.

## Prerequisites

- [Git](https://git-scm.com/)
- [Node](https://nodejs.org/en/): an installation of the latest security patch of Node 14. The Node installation also includes the **npm** package manager.
- [Rush](https://github.com/Microsoft/web-build-tools/wiki/Rush): to install `npm install -g @microsoft/rush`
- [TypeScript](https://www.typescriptlang.org/): this is listed as a devDependency, so if you're building it from source, you will get it with `rush install`.
- [Visual Studio Code](https://code.visualstudio.com/): an optional dependency, but the repository structure is optimized for its use

## Build Instructions

1. Clone the repository (first time) with `git clone` or pull updates to the repository (subsequent times) with `git pull`
2. Install dependencies: `rush install`
3. Clean: `rush clean`
4. Build source: `rush build`
5. Run tests: `rush cover`

The above commands iterate and perform their action against each package in the monorepo.

> Note: It is a good idea to `rush install` after each `git pull` as dependencies may have changed.