import { GlobalMarket } from "./market";
import { Price, Quantity, RecipeDef, ResourceID, Transaction } from "./types";
import { Logger } from "./util";

const MAX_TICKS_WITHOUT_PRODUCTION = 5;

export type State = "producing" | "insufficient production";

// The thing that takes in resources and ouputs resources
export class Agent extends Logger {
  // Variables
  public state: State = "producing";
  public wealth: Price;
  private readonly storage: Map<ResourceID, Quantity> = new Map();
  private ticksWithoutProduction: number = 0;

  // Constants
  private readonly recipes: RecipeDef[] = [];
  private readonly market: GlobalMarket;

  constructor(
    initialWealth: Price,
    recipes: RecipeDef[],
    market: GlobalMarket,
  ) {
    super();
    this.wealth = initialWealth;
    this.recipes.push(...recipes);
    this.market = market;
  }

  public tick() {
    // Try to store one recipe's worth of resources.
    for (const recipe of this.recipes) {
      for (const [resourceId, inputQuantity] of recipe.inputs) {
        const storedQuantity = this.storage.get(resourceId) || 0;
        const neededQuantity = inputQuantity - storedQuantity;
        if (neededQuantity < 0) continue;

        const transaction = this.buyResource(resourceId, neededQuantity);
        this.storage.set(resourceId, storedQuantity + transaction.quantity);
      }
    }

    // Produce with as many resources as are stored.
    let maxProductionQuantity: Quantity = 0;
    for (const recipe of this.recipes) {
      for (const [resourceId, inputQuantity] of recipe.inputs) {
        const storedQuantity = this.storage.get(resourceId) || 0;
        maxProductionQuantity = Math.max(
          maxProductionQuantity,
          Math.floor(storedQuantity / inputQuantity),
        );
      }
      for (let i = 0; i < maxProductionQuantity; i++) {
        this.produceOne(recipe);
      }
    }

    // Sell all outputs to market.
    let soldQuantity = 0;
    for (const recipe of this.recipes) {
      for (const [resourceId, _] of recipe.outputs) {
        const storedQuantity = this.storage.get(resourceId) || 0;
        const market = this.market.get(resourceId);
        if (!market) {
          this.log(`Agent could not sell ${resourceId}: no market`);
          continue;
        }
        const transaction = market.sellToMarket(storedQuantity);
        soldQuantity += transaction.quantity;
        this.storage.set(resourceId, storedQuantity - transaction.quantity);
        this.log(`Sold ${transaction.quantity} ${resourceId} to market.`);
      }
    }

    // Check if there was no production.
    if (maxProductionQuantity === 0 && soldQuantity === 0) {
      this.log(
        `No production (${this.ticksWithoutProduction} / ${MAX_TICKS_WITHOUT_PRODUCTION} ticks without production).`,
      );
      this.ticksWithoutProduction++;
    } else {
      this.ticksWithoutProduction = 0;
      this.state = "producing";
    }

    // Leave
    if (this.ticksWithoutProduction > MAX_TICKS_WITHOUT_PRODUCTION) {
      this.state = "insufficient production";
    }
  }

  private produceOne(recipe: RecipeDef): void {
    for (const [resourceId, inputQuantity] of recipe.inputs) {
      const storedQuantity = this.storage.get(resourceId) || 0;
      if (storedQuantity < inputQuantity) {
        throw new Error(
          `Could not produce: insufficient ${resourceId} (${storedQuantity} < ${inputQuantity})`,
        );
      }
      this.storage.set(resourceId, storedQuantity - inputQuantity);
    }

    for (const [resourceId, outputQuantity] of recipe.outputs) {
      const storedQuantity = this.storage.get(resourceId) || 0;
      this.storage.set(resourceId, storedQuantity + outputQuantity);
      this.log(
        `Produced ${outputQuantity} ${resourceId} (${recipe.displayName})`,
      );
    }
  }

  private buyResource(resourceId: ResourceID, quantity: number): Transaction {
    const resourceMarket = this.market.get(resourceId);
    if (!resourceMarket) {
      this.log(`Agent could not buy ${quantity} ${resourceId}: no market`);
      return { resourceId, quantity: 0, totalPrice: 0 };
    }

    // Buy as many as the agent can afford.
    const totalCost = resourceMarket.price * quantity;
    if (totalCost < this.wealth) {
      const transaction = resourceMarket.buyFromMarket(quantity);
      this.wealth -= transaction.totalPrice;
      this.log(
        `Agent bought ${transaction.quantity} ${resourceId} for ${transaction.totalPrice} (full order)`,
      );
      return transaction;
    }

    const affordableQuantity = Math.floor(this.wealth / resourceMarket.price);
    const transaction = resourceMarket.buyFromMarket(affordableQuantity);
    this.wealth -= transaction.totalPrice;
    this.log(
      `Agent bought ${transaction.quantity} ${resourceId} for ${transaction.totalPrice} (partial order ${transaction.quantity} / ${quantity})`,
    );
    return transaction;
  }

  public prepareForEviction() {
    // Sell everything.
    for (const [resourceId, _] of this.storage.entries()) {
      const storedQuantity = this.storage.get(resourceId) || 0;
      const market = this.market.get(resourceId);
      if (!market) {
        this.log(`Agent could not sell ${resourceId}: no market`);
        continue;
      }
      const transaction = market.sellToMarket(storedQuantity);
    }
    this.log(`Agent ready for eviction`);
  }
}
