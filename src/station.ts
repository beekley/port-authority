import { Agent } from "./agent";
import { GlobalMarket, profitability } from "./market";
import { RecipeDef } from "./types";
import { Logger } from "./util";

const DAILY_FOOD_CONSUMPTION = 1.7; // kg/day/person.

interface Facility {
  agent?: Agent;
}

export class Station extends Logger {
  public readonly market: GlobalMarket;
  public readonly facilities: Facility[] = [];
  public population: number = 100; // Initial population
  public readonly availableRecipes: RecipeDef[];

  constructor(
    market: GlobalMarket,
    agents: Agent[],
    recipes: RecipeDef[],
    size = agents.length,
  ) {
    super();
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

  public tick() {
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
    this.consumeFood();

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
  // TODO: vary the consumption rate.
  private consumeFood() {
    const foodMarket = this.market.resourceMarkets.get("food");
    if (!foodMarket) {
      this.log(`No food market!`);
      return;
    }
    const foodConsumption = Math.floor(
      (this.population * DAILY_FOOD_CONSUMPTION) / 24,
    );
    // TODO: where does this money come from? Maybe per agent?
    const transaction = foodMarket.consumeFromMarket(foodConsumption);
    if (transaction.quantity < foodConsumption) {
      this.log(`Starvation! Could only get ${transaction.quantity} food`);
      this.population *= 0.9; // Simulate population decline
    }
    this.log(
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
      facility.agent = new Agent(100, mostProfitableRecipe, this.market);
    }
  }

  private evictAgent(facility: Facility) {
    if (!facility.agent) return;

    facility.agent.prepareForEviction();
    facility.agent = undefined;
  }
}
