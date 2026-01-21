import { GlobalMarket } from "./market";
import { ResourceID, Quantity, Price, Transaction } from "./types";
import { Logger } from "./util";

// Merchants arrive at port and decide to sell or buy if prices meet their expectations.
export class Merchant extends Logger {
  // TODO: Should probably have an ID.
  public wealth: Price;
  public readonly cargo: Map<ResourceID, Quantity>;
  private readonly minSalePrices: Map<ResourceID, Price>;
  private readonly maxBuyPrices: Map<ResourceID, Price>;
  private market: GlobalMarket;

  constructor(
    initialWealth: Price,
    cargo: [ResourceID, Quantity][],
    minSalePrices: [ResourceID, Quantity][],
    maxBuyPrices: [ResourceID, Quantity][],
    market: GlobalMarket,
  ) {
    super();
    this.wealth = initialWealth;
    this.market = market;
    this.cargo = new Map(cargo);
    this.minSalePrices = new Map(minSalePrices);
    this.maxBuyPrices = new Map(maxBuyPrices);
  }

  public tick() {
    for (const resourceId of this.minSalePrices.keys()) {
      this.log(`Merchant selling ${resourceId}`);
      this.sell(resourceId);
    }
    for (const resourceId of this.maxBuyPrices.keys()) {
      this.log(`Merchant buying ${resourceId}`);
      this.buy(resourceId);
    }
  }

  private sell(resourceId: ResourceID): Transaction {
    const market = this.market.resourceMarkets.get(resourceId);
    if (!market) {
      throw new Error(`Merchant could not sell ${resourceId}: no market`);
    }

    const minSalePrice = this.minSalePrices.get(resourceId);
    if (!minSalePrice) {
      throw new Error(
        `Merchant could not sell ${resourceId}: no desired sale price`,
      );
    }

    const importUnitPrice = market.importUnitPrice();
    if (importUnitPrice >= minSalePrice) {
      const cargoQuantity = this.cargo.get(resourceId) || 0;
      const transaction = market.sellToMarket(cargoQuantity, true);
      this.wealth += transaction.totalPrice;
      this.cargo.set(resourceId, cargoQuantity - transaction.quantity);
      this.log(
        `Merchant sold ${transaction.quantity} ${resourceId} for ${transaction.totalPrice.toFixed(2)}`,
      );
      return transaction;
    }
    return { resourceId, quantity: 0, totalPrice: 0 };
  }

  private buy(resourceId: ResourceID): Transaction {
    const market = this.market.resourceMarkets.get(resourceId);
    if (!market) {
      throw new Error(`Merchant could not buy ${resourceId}: no market`);
    }

    const maxBuyPrice = this.maxBuyPrices.get(resourceId);
    if (!maxBuyPrice) {
      throw new Error(
        `Merchant could not buy ${resourceId}: no desired buy price`,
      );
    }
    if (market.price <= maxBuyPrice) {
      const cargoQuantity = this.cargo.get(resourceId) || 0;

      // Buy as many as the merchant can afford.
      const maxAffordableQuantity = Math.floor(this.wealth / market.price);
      const quantity = Math.min(maxAffordableQuantity, market.stock);

      const transaction = market.buyFromMarket(quantity, true);
      this.wealth -= transaction.totalPrice;
      this.cargo.set(resourceId, cargoQuantity + transaction.quantity);
      this.log(
        `Merchant bought ${transaction.quantity} ${resourceId} for ${transaction.totalPrice.toFixed(2)}`,
      );
      return transaction;
    }
    return { resourceId, quantity: 0, totalPrice: 0 };
  }
}
