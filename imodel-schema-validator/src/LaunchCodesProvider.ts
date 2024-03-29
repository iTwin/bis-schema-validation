/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as fs from "fs";

/**
 * It provides the launch codes and its related information
 */
export class LaunchCodesProvider {

  /**
   * Returns json object containing schema inventory
   */
  public getSchemaInventory(schemaInventoryPath: string): any {

    schemaInventoryPath = path.join(schemaInventoryPath, "SchemaInventory.json");
    if (!fs.existsSync(schemaInventoryPath)) {
      const error = "SchemaInventory.json not found at: " + schemaInventoryPath;
      throw new Error(error);
    }

    let launchCodes = fs.readFileSync(schemaInventoryPath, "utf-8");
    launchCodes = JSON.parse(launchCodes);

    return launchCodes;
  }

  /**
   * Find approval status of schema in launchCodes
   * @param schemaName: Name of the schema.
   * @param index: The index where checksum value was matched.
   * @param inventorySchema: It is the name of schema group from schema inventory.
   * @param launchCodes: Json object containing the launchCodes.
   */
  public checkApprovalAndVerification(schemaName: string, index: number | undefined, inventorySchema: string, launchCodes: any): boolean {
    if (index !== undefined && launchCodes[inventorySchema][index].released && launchCodes[inventorySchema][index].name.toLowerCase() === schemaName.toLowerCase()) {
      if (launchCodes[inventorySchema][index].approved.toLowerCase() === "yes") {
        return true;
      }
    }
    return false;
  }

  /**
   * Find schema index and name based upon its version in schema inventory json
   * @param schemaName: Name of the schema.
   * @param version: It is the version of schema in format e.g 1.0.2.
   * @param launchCodes: Json object containing the launchCodes.
   */
  public findSchemaInfo(schemaName: string, version: string, launchCodes: any) {
    let schemaIndex: number | undefined;
    let inventorySchema: string = "";

    // eslint-disable-next-line guard-for-in
    for (inventorySchema in launchCodes) {
      for (let index = 0; index < launchCodes[inventorySchema].length; index++) {
        if (launchCodes[inventorySchema][index].released && launchCodes[inventorySchema][index].name.toLowerCase() === schemaName.toLowerCase() && launchCodes[inventorySchema][index].version.toLowerCase() === version) {
          schemaIndex = index;
          return { schemaIndex, inventorySchema };
        }
      }
    }
    return { schemaIndex, inventorySchema };
  }
}
