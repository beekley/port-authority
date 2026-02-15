// Keep sorted
export type ResourceID =
  | "biomass"
  | "food"
  | "fuel"
  | "plastic"
  | "steel"
  | "clean water"
  | "dirty water";

export type ResourceUnit = "L" | "kg";

export interface ResourceDef {
  id: ResourceID;
  initialPrice: Price;
  initialQuantity: Quantity;
  unit: ResourceUnit;
}

export type Quantity = number;
export type Price = number;
export type Fraction = number;

export interface Transaction {
  resourceId: ResourceID;
  quantity: Quantity;
  totalPrice: Price;
}

export interface TradePolicy {
  // Fraction added/removed from the market price.
  importPriceModifier?: Fraction;
  exportPriceModifier?: Fraction;

  // Bans external trade.
  importForbidden?: boolean;
  exportForbidden?: boolean;
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
  wantsToBuy: ResourceID[];
  profitMargin: Fraction;
  // Unused
  passangerCapacity: Quantity;
}

export interface GameState {
  tickCount: number;
  population: Quantity;
  starvingPopulation: Quantity;
  wealth: Price;
  resources: Record<
    string,
    {
      count: Quantity;
      price: Price;
      importModifier: Fraction;
      exportModifier: Fraction;
      importForbidden: boolean;
      exportForbidden: boolean;
    }
  >;
}

// TODO: Refine these sources as needed.
export enum LogSource {
  SYSTEM = "SYSTEM",
  MARKET = "MARKET",
  MERCHANT = "MERCHANT",
  POPULATION = "POPULATION",
  AGENT = "AGENT",
}

export interface GameLogEvent {
  source: LogSource;
  message: string;
}

export type GameTickListener = (state: GameState, logs: GameLogEvent[]) => void;

export interface Tick {
  tickCount: number;
  hour(): number;
  day(): number;
}
