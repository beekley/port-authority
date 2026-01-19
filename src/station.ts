import { Agent } from "./agent";
import { GlobalMarket, profitability } from "./market";
import { RecipeDef } from "./types";

interface Facility {
  agent?: Agent;
}

export class Station {
  private readonly market: GlobalMarket;
  public readonly facilities: Facility[] = [];
  private readonly availableRecipes: RecipeDef[];

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

  public tick() {
    // Let agents do their work first.
    for (const facility of this.facilities) {
      if (!facility.agent) continue;
      facility.agent.tick();
    }

    // Update Market prices
    for (const market of this.market.values()) {
      market.tick();
    }

    for (const facility of this.facilities) {
      // Add new agent to meet demand
      if (!facility.agent) {
        for (const recipe of this.availableRecipes) {
          // TODO: sort by most profitable.
          if (profitability(this.market, recipe) > 0) {
            facility.agent = new Agent(100, [recipe], this.market);
            break;
          }
        }
        continue;
      }

      // Remove agent that isn't producing.
      if (facility.agent.state === "insufficient production") {
        this.evictAgent(facility);
      }
    }
  }

  private evictAgent(facility: Facility) {
    if (!facility.agent) return;
    facility.agent.prepareForEviction();
    facility.agent = undefined;
  }
}
