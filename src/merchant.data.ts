import { MerchantDef } from "./types";

// TODO: weigh the probabilities of these.
export const merchantDefs: MerchantDef[] = [
  // Biomass importer
  {
    initialWealth: 100,
    cargo: [["biomass", 100]],
    minSalePrices: [["biomass", 1]],
    maxBuyPrices: [],
  },
  // Plastic exporter
  {
    initialWealth: 50,
    cargo: [],
    minSalePrices: [],
    maxBuyPrices: [["plastic", 15]],
  },
];
