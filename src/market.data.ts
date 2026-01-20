import { Price, RecipeDef, ResourceID } from "./types";

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

export const initialPrices: Map<ResourceID, Price> = new Map([
  ["biomass", 1],
  ["food", 5],
  ["fuel", 10],
  ["plastic", 10],
  ["steel", 20],
]);
