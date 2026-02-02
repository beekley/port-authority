import { GlobalMarket } from "./market";
import { ResourceID, Quantity, Price, Transaction, Fraction } from "./types";
import { DebugLogger } from "./logging";

// Merchants arrive at port and decide to sell or buy if prices meet their expectations.
export class Merchant {
  private debug: DebugLogger;
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
    this.wealth = initialWealth;
    this.market = market;
    this.cargo = new Map(cargo);
    this.wantsToBuy = wantsToBuy;
    this.profitMargin = profitMargin;
  }

  public tick() {
    for (const resourceId of this.cargo.keys()) {
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
    const transaction = market.sellToMarket(cargoQuantity, 1 + this.profitMargin);
    this.wealth += transaction.totalPrice;
    this.cargo.set(resourceId, cargoQuantity - transaction.quantity);
    if (transaction.quantity > 0) {
      this.debug.log(
        `Merchant sold ${transaction.quantity} ${resourceId} for ${transaction.totalPrice.toFixed(2)}`,
      );
    }
    return transaction;
  }

  private buy(resourceId: ResourceID): Transaction {
    const market = this.market.resourceMarkets.get(resourceId);
    if (!market) {
      throw new Error(`Merchant could not buy ${resourceId}: no market`);
    }

    // Buy as many as the merchant can afford.
    // Buying at market price - profit.
    const unitPrice = market.price * (1 - this.profitMargin);
    const maxAffordableQuantity = Math.floor(this.wealth / unitPrice);
    const quantity = Math.min(maxAffordableQuantity, market.stock);

    if (quantity > 0) {
      const transaction = market.buyFromMarket(quantity, 1 - this.profitMargin);
      this.wealth -= transaction.totalPrice;
      const currentCargo = this.cargo.get(resourceId) || 0;
      this.cargo.set(resourceId, currentCargo + transaction.quantity);
      this.debug.log(
        `Merchant bought ${transaction.quantity} ${resourceId} for ${transaction.totalPrice.toFixed(2)}`,
      );
      return transaction;
    }
    return { resourceId, quantity: 0, totalPrice: 0 };
  }
}
