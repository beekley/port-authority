export type ResourceID = "food" | "steel";
export type Quantity = number;
export type Price = number;

export interface Transaction {
  resourceId: ResourceID;
  quantity: Quantity;
  totalPrice: Price;
}
