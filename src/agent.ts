import { GlobalMarket } from "./market";
import { Price, Quantity, RecipeDef, ResourceID, Transaction } from "./types";
import { DebugLogger } from "./logging";

const MAX_TICKS_WITHOUT_PRODUCTION = 5;

export type State = "producing" | "insufficient production";

// The thing that takes in resources and ouputs resources
export class Agent {
  public readonly id: string;
  private debug: DebugLogger;

  // Variables
  public state: State = "producing";
  private readonly storage: Map<ResourceID, Quantity> = new Map();
  private ticksWithoutProduction: number = 0;

  // Constants
  public readonly recipe: RecipeDef;
  private readonly market: GlobalMarket;

  constructor(productionRecipe: RecipeDef, market: GlobalMarket) {
    this.id = crypto.randomUUID().split("-").pop() || "";
    this.debug = new DebugLogger(this.id);
    this.recipe = productionRecipe;
    this.market = market;
  }

  public tick() {
    const recipe = this.recipe;
    for (const [resourceId, inputQuantity] of recipe.inputs) {
      const storedQuantity = this.storage.get(resourceId) || 0;
      const neededQuantity = inputQuantity - storedQuantity;
      if (neededQuantity < 0) continue;

      const transaction = this.buyResource(resourceId, neededQuantity);
      this.storage.set(resourceId, storedQuantity + transaction.quantity);
    }

    // Produce with as many resources as are stored.
    let maxProductionQuantity: Quantity = 0;
    for (const [resourceId, inputQuantity] of this.recipe.inputs) {
      const storedQuantity = this.storage.get(resourceId) || 0;
      maxProductionQuantity = Math.max(
        maxProductionQuantity,
        Math.floor(storedQuantity / inputQuantity),
      );
    }
    for (let i = 0; i < maxProductionQuantity; i++) {
      this.produceOne(this.recipe);
    }

    // Sell all outputs to market.
    let soldQuantity = 0;
    for (const [resourceId, _] of this.recipe.outputs) {
      const storedQuantity = this.storage.get(resourceId) || 0;
      const market = this.market.resourceMarkets.get(resourceId);
      if (!market) {
        this.debug.log(`Agent could not sell ${resourceId}: no market`);
        continue;
      }
      const transaction = market.give(storedQuantity);
      soldQuantity += transaction.quantity;
      this.storage.set(resourceId, storedQuantity - transaction.quantity);
      this.debug.log(`Gave ${transaction.quantity} ${resourceId} to market.`);
    }

    // Check if there was no production.

    if (maxProductionQuantity === 0 && soldQuantity === 0) {
      this.debug.log(
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
      this.debug.log(
        `Produced ${outputQuantity} ${resourceId} (${recipe.displayName})`,
      );
    }
  }

  private buyResource(resourceId: ResourceID, quantity: number): Transaction {
    const resourceMarket = this.market.resourceMarkets.get(resourceId);
    if (!resourceMarket) {
      this.debug.log(`Agent could not buy ${quantity} ${resourceId}: no market`);
      return { resourceId, quantity: 0, totalPrice: 0 };
    }
    const transaction = resourceMarket.consume(quantity);
    if (transaction.quantity > 0) {
      this.debug.log(
        `Agent consumed ${transaction.quantity} ${resourceId} for ${transaction.totalPrice.toFixed(2)} (full order)`,
      );
    }
    return transaction;
  }

  public prepareForEviction() {
    // Sell everything.
    for (const [resourceId, _] of this.storage.entries()) {
      const storedQuantity = this.storage.get(resourceId) || 0;
      const market = this.market.resourceMarkets.get(resourceId);
      if (!market) {
        this.debug.log(`Agent could not sell ${resourceId}: no market`);
        continue;
      }
      const transaction = market.give(storedQuantity);
    }
    this.debug.log(`Agent ready for eviction`);
  }
}
