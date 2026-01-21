// Keep sorted
export type ResourceID =
  | "biomass"
  | "food"
  | "fuel"
  | "plastic"
  | "steel"
  | "water";

export type Quantity = number;
export type Price = number;
export type Fraction = number;

export interface Transaction {
  resourceId: ResourceID;
  quantity: Quantity;
  totalPrice: Price;
}

export interface RecipeDef {
  displayName: string;
  // processTimeTicks: number; TODO
  // Quantity per resource
  inputs: Map<ResourceID, Quantity>;
  outputs: Map<ResourceID, Quantity>;
}

// TODO: support a range of values.
export interface MerchantDef {
  initialWealth: Price;
  cargo: [ResourceID, Quantity][];
  minSalePrices: [ResourceID, Price][];
  maxBuyPrices: [ResourceID, Price][];
}
