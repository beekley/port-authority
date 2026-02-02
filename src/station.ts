import { Agent } from "./agent";
import { GlobalMarket, profitability } from "./market";
import { Quantity, RecipeDef, Tick } from "./types";
import { DebugLogger } from "./logging";

// kg/day/person
const HOURLY_FOOD_CONSUMPTION: Record<number, Quantity> = {
  8: 0.4,
  12: 0.6,
  18: 0.7,
};

interface Facility {
  agent?: Agent;
}

export class Station {
  private debug: DebugLogger = new DebugLogger("Station");
  public readonly market: GlobalMarket;
  public readonly facilities: Facility[] = [];
  public readonly availableRecipes: RecipeDef[];
  public population: number = 100; // Initial population
  public starvingPopulation: number = 0;

  constructor(
    market: GlobalMarket,
    agents: Agent[],
    recipes: RecipeDef[],
    size = agents.length,
  ) {
    // Starting values for test / debug.
    this.market = market;

    if (size < agents.length) {
      throw new Error(
        `Insufficient size for number of starting agents (${size} < ${agents.length})`,
      );
    }
    for (let i = 0; i < size; i++) {
      this.facilities.push(
        i < agents.length ? { agent: agents[i] } : { agent: undefined },
      );
    }

    this.availableRecipes = recipes;
  }

  public tick(tick: Tick) {
    // Let agents do their work first.
    for (const facility of this.facilities) {
      if (!facility.agent) continue;
      facility.agent.tick();
    }

    // Update Market prices
    for (const market of this.market.resourceMarkets.values()) {
      market.tick();
    }

    // Consume food.
    this.consumeFood(tick.hour());

    // Manage facilities

    for (const facility of this.facilities) {
      // Add new agent to meet demand
      if (!facility.agent) {
        this.addAgent(facility);
        // Only one at a time
        break;
      }

      // Remove agent that isn't producing.
      if (facility.agent.state === "insufficient production") {
        this.evictAgent(facility);
      }
    }
  }

  // Basic linear consumption of food.
  private consumeFood(hour: number) {
    const foodMarket = this.market.resourceMarkets.get("food");
    if (!foodMarket) {
      this.debug.log(`No food market!`);
      return;
    }
    const neededFood = Math.floor(
      this.population * (HOURLY_FOOD_CONSUMPTION[Math.round(hour)] || 0),
    );
    if (Math.floor(neededFood) == 0) return;
    const availableFood = foodMarket.stock;
    const transaction = foodMarket.consumeFromMarket(
      availableFood >= neededFood ? neededFood : availableFood,
    );
    this.debug.log(`Consuming ${transaction.quantity} / ${neededFood} food.`);
    if (transaction.quantity < neededFood) {
      this.starvingPopulation = Math.floor(
        this.population * (1 - transaction.quantity / neededFood),
      );
      this.debug.log(
        `Starvation! Could only get ${transaction.quantity} of the ${neededFood} needed food. ${this.starvingPopulation} of ${this.population} is starving.`,
      );
    }
    this.debug.log(
      `Consumed ${transaction.quantity} food. Population: ${this.population}`,
    );
  }

  private addAgent(facility: Facility) {
    if (facility.agent) return;

    let mostProfitableRecipe: RecipeDef | undefined;
    let mostProfitableProfit = 0;
    for (const recipe of this.availableRecipes) {
      const profit = profitability(this.market, recipe);
      if (profit > 0 && profit > mostProfitableProfit) {
        mostProfitableRecipe = recipe;
        mostProfitableProfit = profit;
      }
    }
    if (mostProfitableRecipe) {
      facility.agent = new Agent(mostProfitableRecipe, this.market);
    }
  }

  private evictAgent(facility: Facility) {
    if (!facility.agent) return;

    facility.agent.prepareForEviction();
    facility.agent = undefined;
  }
}
