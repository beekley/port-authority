import { resourceDefs } from "./market.data";
import {
  Fraction,
  Price,
  Quantity,
  RecipeDef,
  ResourceID,
  TradePolicy,
  Transaction,
} from "./types";
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
  public tradePolicy: TradePolicy = {};

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

  public sellToMarket(
    quantity: Quantity,
    priceMultiplier: number = 1,
  ): Transaction {
    if (this.tradePolicy.importForbidden) {
      return {
        resourceId: this.resourceId,
        quantity: 0,
        totalPrice: 0,
      };
    }

    // Sell to the market as much as the global market can afford.
    const policyMultiplier = 1 + (this.tradePolicy.importPriceModifier || 0);
    const unitPrice = this.price * priceMultiplier * policyMultiplier;

    // Check affordability
    const maxAffordable = Math.floor(this.globalMarket.wealth / unitPrice);
    const quantityToSell = Math.min(quantity, maxAffordable);

    const totalPrice = unitPrice * quantityToSell;
    this.globalMarket.wealth -= totalPrice;
    this.tickProductionCount += quantityToSell;
    this.stock += quantityToSell;
    return {
      resourceId: this.resourceId,
      quantity: quantityToSell,
      totalPrice,
    };
  }

  public buyFromMarket(
    quantity: Quantity,
    priceMultiplier: number = 1,
  ): Transaction {
    // Check trade policy
    if (this.tradePolicy.exportForbidden) {
      return {
        resourceId: this.resourceId,
        quantity: 0,
        totalPrice: 0,
      };
    }

    // Check if enough in stock.
    if (this.stock < quantity) {
      return {
        resourceId: this.resourceId,
        quantity: 0,
        totalPrice: 0,
      };
    }

    const policyMultiplier = 1 + (this.tradePolicy.exportPriceModifier || 0);
    const unitPrice = this.price * priceMultiplier * policyMultiplier;

    const totalPrice = unitPrice * quantity;
    this.tickConsumptionCount += quantity;
    this.stock -= quantity;
    this.globalMarket.wealth += totalPrice;
    return {
      resourceId: this.resourceId,
      quantity,
      totalPrice,
    };
  }

  // Like buyFromMarket, but no money is exchanged.
  public consumeFromMarket(quantity: Quantity): Transaction {
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
      totalPrice: 0,
    };
  }

  // Like sellToMarket, but no money is exchanged.
  public giveToMarket(quantity: Quantity): Transaction {
    this.tickProductionCount += quantity;
    this.stock += quantity;
    return {
      resourceId: this.resourceId,
      quantity,
      totalPrice: 0,
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
  for (const [resourceId, resourceDef] of resourceDefs) {
    if (!market.resourceMarkets.has(resourceId)) {
      const resourceMarket = new ResourceMarket(
        resourceId,
        resourceDef.initialPrice,
        market,
      );
      resourceMarket.stock = resourceDef.initialQuantity || 0;
      market.resourceMarkets.set(resourceId, resourceMarket);
    }
  }
  return market;
}
