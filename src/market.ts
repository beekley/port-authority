import { Price, Quantity, ResourceID, Transaction } from "./types";

const PRICE_INCREASE_FRACTION = 0.1;

export type GlobalMarket = Map<ResourceID, ResourceMarket>;

// Sets the current price for a resource
export class ResourceMarket {
  public readonly resourceId: ResourceID;
  public stock: Quantity = 0;
  public price: Price; // Do not set except within this class

  // How many of the resource were produced (and sold) to the market.
  // Includes imports?
  private tickProductionCount: Quantity = 0;
  // How many of the resource were consumed (and bought) from the market.
  private tickConsumptionCount: Quantity = 0;

  constructor(resourceId: ResourceID, initialPrice: Price) {
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
      throw new Error("Not enough in stock");
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

    console.log(`Price for ${this.resourceId}: ${oldPrice} -> ${this.price}.`);

    // Reset tick.
    this.tickProductionCount = 0;
    this.tickConsumptionCount = 0;
  }
}
