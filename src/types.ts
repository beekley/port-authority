// Keep sorted
export type ResourceID =
  | "biomass"
  | "food"
  | "fuel"
  | "plastic"
  | "steel"
  | "clean water"
  | "dirty water";

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
  name?: string;
  initialWealth: Price;
  cargo: [ResourceID, Quantity][];
  minSalePrices: [ResourceID, Price][];
  maxBuyPrices: [ResourceID, Price][];
}

export interface GameState {
  tickCount: number;
  population: Quantity;
  wealth: Price;
  resources: Record<
    string,
    {
      count: Quantity;
      price: Price;
      importModifier: Fraction;
      exportModifier: Fraction;
    }
  >;
}

export interface GameLogEvent {
  type: "SHIP_ARRIVAL" | "AGENT_EVICTION" | "AGENT_ADDITION" | "POP_LOSS";
  timestamp?: string;
  message: string;
}

export type GameTickListener = (state: GameState, logs: GameLogEvent[]) => void;
