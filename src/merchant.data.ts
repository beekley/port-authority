import { MerchantDef } from "./types";

// TODO: weigh the probabilities of these.
export const merchantDefs: MerchantDef[] = [
  // Biomass importer
  {
    initialWealth: 30,
    cargo: [["biomass", 20]],
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
