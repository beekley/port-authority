import { initialPrices, recipeDefs } from "./market.data";
import { Price, Quantity, RecipeDef, ResourceID, Transaction } from "./types";
import { Logger } from "./util";

const PRICE_INCREASE_FRACTION = 0.2;

export class GlobalMarket {
  resourceMarkets: Map<ResourceID, ResourceMarket> = new Map();
  wealth: Price = 100;
}

export function profitability(market: GlobalMarket, recipe: RecipeDef): number {
  let costs = 0;
  for (const [resourceId, inputQuantity] of recipe.inputs) {
    const resourceMarket = market.resourceMarkets.get(resourceId);
    if (!resourceMarket) {
      throw new Error(`Could not find market for ${resourceId}`);
    }
    costs += inputQuantity * resourceMarket.price;
  }

  let revenue = 0;
  for (const [resourceId, outputQuantity] of recipe.outputs) {
    const resourceMarket = market.resourceMarkets.get(resourceId);
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

  private globalMarket: GlobalMarket;
  // How many of the resource were produced (and sold) to the market.
  private tickProductionCount: Quantity = 0;
  // How many of the resource were consumed (and bought) from the market.
  private tickConsumptionCount: Quantity = 0;

  constructor(
    resourceId: ResourceID,
    initialPrice: Price,
    market: GlobalMarket,
  ) {
    super();
    this.resourceId = resourceId;
    this.price = initialPrice;
    this.globalMarket = market;
  }

  public sellToMarket(quantity: Quantity): Transaction {
    // Sell to the market as much as the global market can afford.
    const quantityToSell = Math.min(
      quantity,
      this.globalMarket.wealth / this.price,
    );
    const totalPrice = this.price * quantityToSell;
    this.globalMarket.wealth -= totalPrice;
    this.tickProductionCount += quantityToSell;
    this.stock += quantityToSell;
    return {
      resourceId: this.resourceId,
      quantity: quantityToSell,
      totalPrice,
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
    this.globalMarket.wealth += this.price * quantity;
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
  const market = new GlobalMarket();
  for (const [resourceId, price] of initialPrices) {
    if (!market.resourceMarkets.has(resourceId)) {
      market.resourceMarkets.set(
        resourceId,
        new ResourceMarket(resourceId, price, market),
      );
    }
  }
  return market;
}
