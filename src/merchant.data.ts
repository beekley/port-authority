import { MerchantDef } from "./types";

// TODO: weigh the probabilities of these.
export const merchantDefs: MerchantDef[] = [
  // Biomass importer
  {
    name: "Biomass Importer",
    initialWealth: 30,
    cargo: [["biomass", 20]],
    wantsToBuy: [],
    profitMargin: 0.1,
  },
  // Plastic exporter
  {
    name: "Plastic Exporter",
    initialWealth: 50,
    cargo: [],
    wantsToBuy: ["plastic"],
    profitMargin: 0.2,
  },
  // Food trader
  {
    name: "Food Trader",
    initialWealth: 20,
    cargo: [["food", 15]],
    wantsToBuy: [],
    profitMargin: 0.05,
  },
];
