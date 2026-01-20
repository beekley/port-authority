import { initialPrices, recipeDefs } from "./market.data";
import { Price, Quantity, RecipeDef, ResourceID, Transaction } from "./types";
import { Logger } from "./util";

const PRICE_INCREASE_FRACTION = 0.1;

export type GlobalMarket = Map<ResourceID, ResourceMarket>;

export function profitability(market: GlobalMarket, recipe: RecipeDef): number {
  let costs = 0;
  for (const [resourceId, inputQuantity] of recipe.inputs) {
    const resourceMarket = market.get(resourceId);
    if (!resourceMarket) {
      throw new Error(`Could not find market for ${resourceId}`);
    }
    costs += inputQuantity * resourceMarket.price;
  }

  let revenue = 0;
  for (const [resourceId, outputQuantity] of recipe.outputs) {
    const resourceMarket = market.get(resourceId);
    if (!resourceMarket) {
      throw new Error(`Could not find market for ${resourceId}`);
    }
    revenue += outputQuantity * resourceMarket.price;
  }

  return revenue - costs;
}

// Sets the current price for a resource
export class ResourceMarket extends Logger {
  public readonly resourceId: ResourceID;
  public stock: Quantity = 0;
  public price: Price; // Do not set except within this class

  // How many of the resource were produced (and sold) to the market.
  // Includes imports?
  private tickProductionCount: Quantity = 0;
  // How many of the resource were consumed (and bought) from the market.
  private tickConsumptionCount: Quantity = 0;

  constructor(resourceId: ResourceID, initialPrice: Price) {
    super();
    this.resourceId = resourceId;
    this.price = initialPrice;
  }

  public sellToMarket(quantity: Quantity): Transaction {
    this.tickProductionCount += quantity;
    this.stock += quantity;
    return {
      resourceId: this.resourceId,
      quantity,
      totalPrice: this.price * quantity,
    };
  }

  public buyFromMarket(quantity: Quantity): Transaction {
    // Check if enough in stock.
    if (this.stock < quantity) {
      // Responsibility of caller to prevent this.
      return {
        resourceId: this.resourceId,
        quantity: 0,
        totalPrice: 0,
      };
    }
    this.tickConsumptionCount += quantity;
    this.stock -= quantity;
    return {
      resourceId: this.resourceId,
      quantity,
      totalPrice: this.price * quantity,
    };
  }

  public tick() {
    const oldPrice = this.price;
    // Consumed more than made.
    if (this.tickConsumptionCount > this.tickProductionCount) {
      this.price *= 1 + PRICE_INCREASE_FRACTION;
    }
    // Made more than consumed.
    else if (this.tickConsumptionCount < this.tickProductionCount) {
      this.price *= 1 - PRICE_INCREASE_FRACTION;
    }

    this.log(
      `Price for ${this.resourceId}: ${oldPrice.toFixed(2)} -> ${this.price.toFixed(2)}.`,
    );

    // Reset tick.
    this.tickProductionCount = 0;
    this.tickConsumptionCount = 0;
  }
}

export function getCompleteMarket(): GlobalMarket {
  const market: GlobalMarket = new Map();
  for (const [resourceId, price] of initialPrices) {
    if (!market.has(resourceId)) {
      market.set(resourceId, new ResourceMarket(resourceId, price));
    }
  }
  return market;
}
