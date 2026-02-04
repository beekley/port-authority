import { GlobalMarket } from "./market";
import {
  ResourceID,
  Quantity,
  Price,
  Transaction,
  Fraction,
  LogSource,
} from "./types";
import { DebugLogger, EventLogger } from "./logging";

// Merchants arrive at port and decide to sell or buy if prices meet their expectations.
export class Merchant {
  private readonly debug: DebugLogger;
  public readonly events: EventLogger;

  public name: string;
  public wealth: Price;
  public readonly cargo: Map<ResourceID, Quantity>;
  public readonly wantsToBuy: ResourceID[];
  public readonly profitMargin: Fraction;
  private market: GlobalMarket;

  constructor(
    name: string,
    initialWealth: Price,
    cargo: [ResourceID, Quantity][],
    wantsToBuy: ResourceID[],
    profitMargin: Fraction,
    market: GlobalMarket,
  ) {
    this.name = name;
    this.debug = new DebugLogger(name);
    this.events = new EventLogger();
    this.wealth = initialWealth;
    this.market = market;
    this.cargo = new Map(cargo);
    this.wantsToBuy = wantsToBuy;
    this.profitMargin = profitMargin;
  }

  public tick() {
    for (const resourceId of this.cargo.keys()) {
      // Don't sell things we want to buy!
      if (this.wantsToBuy.includes(resourceId)) continue;

      if ((this.cargo.get(resourceId) || 0) > 0) {
        this.debug.log(`Merchant selling ${resourceId}`);
        this.sell(resourceId);
      }
    }
    for (const resourceId of this.wantsToBuy) {
      this.debug.log(`Merchant buying ${resourceId}`);
      this.buy(resourceId);
    }
  }

  private sell(resourceId: ResourceID): Transaction {
    const market = this.market.resourceMarkets.get(resourceId);
    if (!market) {
      throw new Error(`Merchant could not sell ${resourceId}: no market`);
    }

    const cargoQuantity = this.cargo.get(resourceId) || 0;
    // Sell at market price + profit.
    const desiredUnitPrice = market.price * (1 + this.profitMargin);

    const transaction = market.quotePurchase(cargoQuantity, desiredUnitPrice);

    if (transaction.quantity > 0) {
      market.commitPurchase(transaction);
      this.wealth += transaction.totalPrice;
      this.cargo.set(resourceId, cargoQuantity - transaction.quantity);

      const log = `Merchant sold ${transaction.quantity} ${resourceId} for ${transaction.totalPrice.toFixed(2)}`;
      this.debug.log(log);
      this.events.log(LogSource.MERCHANT, log);
    }

    return transaction;
  }

  private buy(resourceId: ResourceID): Transaction {
    const market = this.market.resourceMarkets.get(resourceId);
    if (!market) {
      throw new Error(`Merchant could not buy ${resourceId}: no market`);
    }

    // Buying at market price - profit.
    const desiredUnitPrice = market.price * (1 - this.profitMargin);

    const maxAffordableQuantity = Math.floor(this.wealth / desiredUnitPrice);
    const quantityToRequest = Math.min(maxAffordableQuantity, market.stock);

    if (quantityToRequest <= 0) {
      return { resourceId, quantity: 0, totalPrice: 0 };
    }

    const transaction = market.quoteSale(quantityToRequest, desiredUnitPrice);

    if (transaction.quantity > 0) {
      // confirm affordability
      if (transaction.totalPrice <= this.wealth) {
        market.commitSale(transaction);
        this.wealth -= transaction.totalPrice;
        const currentCargo = this.cargo.get(resourceId) || 0;
        this.cargo.set(resourceId, currentCargo + transaction.quantity);
        const log = `Merchant bought ${transaction.quantity} ${resourceId} for ${transaction.totalPrice.toFixed(2)}`;
        this.debug.log(log);
        this.events.log(LogSource.MERCHANT, log);
        return transaction;
      }
    }
    return { resourceId, quantity: 0, totalPrice: 0 };
  }
}
