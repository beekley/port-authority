import { Price, Quantity, RecipeDef, ResourceDef, ResourceID } from "./types";

export const recipeDefs: RecipeDef[] = [
  // Turn biomass into food
  {
    displayName: "Make food",
    inputs: new Map([["biomass", 1]]),
    outputs: new Map([["food", 1]]),
  },
  // Turn biomass into fuel
  {
    displayName: "Make fuel",
    inputs: new Map([["biomass", 2]]),
    outputs: new Map([["fuel", 1]]),
  },
  // Turn fuel into plastic
  {
    displayName: "Make plastic",
    inputs: new Map([["fuel", 1]]),
    outputs: new Map([["plastic", 1]]),
  },
];

export const resourceDefs: Map<ResourceID, ResourceDef> = new Map([
  [
    "biomass",
    { id: "biomass", initialPrice: 1, initialQuantity: 20, unit: "kg" },
  ],
  ["food", { id: "food", initialPrice: 5, initialQuantity: 250, unit: "kg" }],
  ["fuel", { id: "fuel", initialPrice: 10, initialQuantity: 30, unit: "L" }],
  [
    "plastic",
    { id: "plastic", initialPrice: 10, initialQuantity: 0, unit: "kg" },
  ],
  ["steel", { id: "steel", initialPrice: 20, initialQuantity: 0, unit: "kg" }],
]);
