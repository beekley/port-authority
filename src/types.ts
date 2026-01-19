export type ResourceID = "food" | "steel" | "water";
export type Quantity = number;
export type Price = number;

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
