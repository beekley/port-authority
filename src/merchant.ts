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

    // The price the market will offer.
    const importPrice =
      market.price * (1 + (market.tradePolicy.importPriceModifier || 0));

    // The price the merchant wants. Assume they bought it somewhere else for market.price
    // and want to make a profit.
    const desiredPrice = market.price * (1 + this.profitMargin);

    if (importPrice < desiredPrice) {
      // Not profitable to sell.
      return { resourceId, quantity: 0, totalPrice: 0 };
    }

    const cargoQuantity = this.cargo.get(resourceId) || 0;
    const transaction = market.import(cargoQuantity);

    if (transaction.quantity > 0) {
      this.wealth += transaction.totalPrice;
      this.cargo.set(resourceId, cargoQuantity - transaction.quantity);

      const log = `Merchant sold ${
        transaction.quantity
      } ${resourceId} for ${transaction.totalPrice.toFixed(2)}`;
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

    // The price the market will charge.
    const exportPrice =
      market.price * (1 + (market.tradePolicy.exportPriceModifier || 0));

    // The price the merchant is willing to pay.
    const desiredPrice = market.price * (1 - this.profitMargin);

    if (exportPrice > desiredPrice) {
      // Not profitable to buy.
      return { resourceId, quantity: 0, totalPrice: 0 };
    }

    if (exportPrice <= 0) {
      // Price is zero or negative, can't determine affordable quantity, or it is infinite.
      // Assume we can't buy in this case. A merchant probably does not trade for free.
      return { resourceId, quantity: 0, totalPrice: 0 };
    }

    const maxAffordableQuantity = Math.floor(this.wealth / exportPrice);

    if (maxAffordableQuantity <= 0) {
      return { resourceId, quantity: 0, totalPrice: 0 };
    }

    const transaction = market.export(maxAffordableQuantity);

    if (transaction.quantity > 0) {
      // market.export already updated market wealth and stock
      this.wealth -= transaction.totalPrice;
      const currentCargo = this.cargo.get(resourceId) || 0;
      this.cargo.set(resourceId, currentCargo + transaction.quantity);
      const log = `Merchant bought ${
        transaction.quantity
      } ${resourceId} for ${transaction.totalPrice.toFixed(2)}`;
      this.debug.log(log);
      this.events.log(LogSource.MERCHANT, log);
    }
    return transaction;
  }
}
