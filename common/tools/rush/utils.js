/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
function logBuildWarning(msg) {
  if (process.env.TF_BUILD)
    console.log("##vso[task.logissue type=warning;]%s", msg);
  else
    console.error("WARNING: %s", msg);
}

function logBuildError(msg) {
  if (process.env.TF_BUILD)
    console.log("##vso[task.logissue type=error;]%s", msg);
  else
    console.error("ERROR: %s", msg);
}

function failBuild() {
  if (process.env.TF_BUILD) {
    console.log("##vso[task.complete result=Failed;]DONE")
    process.exit(0);
  } else {
    process.exit(1);
  }
}

function throwAfterTimeout(timeout, message) {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(message), timeout);
  });
}

/**
 * Checks if the module is present in ignore list
 * @param moduleName Name of module
 * @param severity Severity of module
 * @param excludeList List of modules present in audit_ignoreList.json
 * @returns Boolean based upon the decision
 */
function excludeModule(moduleName, severity, excludeList) {
  if (!excludeList)
    return false;

  const matches = excludeList.filter((s) => s.module_name === moduleName);
  if (matches.length === 0)
    return false;

  if (matches.some((s) => s.severity === severity))
    return true;

  return false;
}

module.exports = {
  logBuildWarning,
  logBuildError,
  failBuild,
  throwAfterTimeout,
  excludeModule
}