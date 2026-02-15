import { resourceDefs } from "./market.data";
import {
  Price,
  Quantity,
  RecipeDef,
  ResourceID,
  TradePolicy,
  Transaction,
} from "./types";
import { DebugLogger } from "./logging";

const DEFAULT_TRADE_MARGIN = 0.2;

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
export class ResourceMarket {
  private debug: DebugLogger;
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
    this.resourceId = resourceId;
    this.debug = new DebugLogger(resourceId);
    this.price = initialPrice;
    this.globalMarket = market;
  }

  public importPrice(): Price {
    return (
      this.price *
      (1 + DEFAULT_TRADE_MARGIN + (this.tradePolicy.importPriceModifier || 0))
    );
  }

  public exportPrice(): Price {
    return (
      this.price *
      (1 - DEFAULT_TRADE_MARGIN + (this.tradePolicy.exportPriceModifier || 0))
    );
  }

  // Sell to the market (Market is BUYING from a seller)
  public import(quantity: Quantity): Transaction {
    if (this.tradePolicy.importForbidden) {
      return {
        resourceId: this.resourceId,
        quantity: 0,
        totalPrice: 0,
      };
    }

    // Apply policy to the market price
    const policyMultiplier = 1 + (this.tradePolicy.importPriceModifier || 0);
    const finalUnitPrice = this.price * policyMultiplier;

    // Check affordability
    let quantityToBuy = quantity;
    if (finalUnitPrice > 0) {
      const maxAffordable = Math.floor(
        this.globalMarket.wealth / finalUnitPrice,
      );
      quantityToBuy = Math.min(quantity, maxAffordable);
    }

    const transaction: Transaction = {
      resourceId: this.resourceId,
      quantity: quantityToBuy,
      totalPrice: quantityToBuy * finalUnitPrice,
    };

    if (transaction.quantity > 0) {
      this.globalMarket.wealth -= transaction.totalPrice;
      this.tickProductionCount += transaction.quantity;
      this.stock += transaction.quantity;
    }

    return transaction;
  }

  // Buy from the market (Market is SELLING to a buyer)
  public export(quantity: Quantity): Transaction {
    if (this.tradePolicy.exportForbidden) {
      return {
        resourceId: this.resourceId,
        quantity: 0,
        totalPrice: 0,
      };
    }

    const quantityToSell = Math.min(quantity, this.stock);

    if (quantityToSell <= 0) {
      return {
        resourceId: this.resourceId,
        quantity: 0,
        totalPrice: 0,
      };
    }

    const policyMultiplier = 1 + (this.tradePolicy.exportPriceModifier || 0);
    const finalUnitPrice = this.price * policyMultiplier;

    const transaction: Transaction = {
      resourceId: this.resourceId,
      quantity: quantityToSell,
      totalPrice: quantityToSell * finalUnitPrice,
    };

    if (transaction.quantity > 0) {
      this.tickConsumptionCount += transaction.quantity;
      this.stock -= transaction.quantity;
      this.globalMarket.wealth += transaction.totalPrice;
    }

    return transaction;
  }

  // Take from the market at no cost.
  public consume(quantity: Quantity): Transaction {
    const quantityToConsume = Math.min(quantity, this.stock);

    if (quantityToConsume <= 0) {
      return {
        resourceId: this.resourceId,
        quantity: 0,
        totalPrice: 0,
      };
    }

    this.tickConsumptionCount += quantityToConsume;
    this.stock -= quantityToConsume;
    return {
      resourceId: this.resourceId,
      quantity: quantityToConsume,
      totalPrice: 0,
    };
  }

  // Give to the market at no cost.
  public give(quantity: Quantity): Transaction {
    this.tickProductionCount += quantity;
    this.stock += quantity;
    return {
      resourceId: this.resourceId,
      quantity,
      totalPrice: 0,
    };
  }

  public tick() {
    // Price update logic removed as per design change.
    // Price remains constant at initialPrice.
    // We only reset the counters for statistical purposes.
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
