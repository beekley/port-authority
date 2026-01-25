import { MerchantDef } from "./types";

// TODO: weigh the probabilities of these.
export const merchantDefs: MerchantDef[] = [
  // Biomass importer
  {
    name: "Biomass Importer",
    initialWealth: 30,
    cargo: [["biomass", 20]],
    minSalePrices: [["biomass", 1]],
    maxBuyPrices: [],
  },
  // Plastic exporter
  {
    name: "Plastic Exporter",
    initialWealth: 50,
    cargo: [],
    minSalePrices: [],
    maxBuyPrices: [["plastic", 15]],
  },
  // Food trader
  {
    name: "Food Trader",
    initialWealth: 20,
    cargo: [["food", 15]],
    minSalePrices: [["food", 3]],
    maxBuyPrices: [["food", 1]],
  },
];
