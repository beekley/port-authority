import { ResourceID } from "./types";

const PRICE_INCREASE_FRACTION = 0.1;

// Sets the current price for a resource
export class ResourceMarket {
  public readonly resourceId: ResourceID;
  public stock: number = 0;
  public price: number; // Do not set except within this class

  // How many of the resource were produced (and sold) to the market.
  // Includes imports?
  private tickProductionCount: number = 0;
  // How many of the resource were consumed (and bought) from the market.
  private tickConsumptionCount: number = 0;

  constructor(resourceId: ResourceID, initialPrice: number) {
    this.resourceId = resourceId;
    this.price = initialPrice;
  }

  public sellToMarket(quantity: number) {
    this.tickProductionCount += quantity;
    this.stock += quantity;
  }

  public buyFromMarket(quantity: number) {
    // Check if enough in stock.
    if (this.stock < quantity) {
      // Responsibility of caller to prevent this.
      throw new Error("Not enough in stock");
    }
    this.tickConsumptionCount += quantity;
    this.stock -= quantity;
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
