import { Agent } from "./agent";
import { getCompleteMarket, GlobalMarket, profitability } from "./market";
import { recipeDefs } from "./market.data";
import { Merchant } from "./merchant";
import { merchantDefs } from "./merchant.data";
import { Station } from "./station";
import { Fraction, MerchantDef, Price, Quantity, RecipeDef } from "./types";
import { getSeededRandom, Logger } from "./util";

export interface GameState {
  tickCount: number;
  wealth: Price;
  resources: Record<
    string,
    {
      count: Quantity;
      price: Price;
      modifier: Fraction;
    }
  >;
}

// 2. The Ephemeral Events: Things that happened THIS tick (for the log)
export interface GameLogEvent {
  type: "SHIP_ARRIVAL" | "AGENT_EVICTION" | "AGENT_ADDITION";
  message: string;
}

export type GameTickListener = (state: GameState, logs: GameLogEvent[]) => void;

// TODOs:
// - player can set tarrifs / subsidies
// - player can set max import quantity
export class Game extends Logger {
  public readonly station: Station;
  private tickCount = 0;
  private readonly seed: number;
  private subscribers: GameTickListener[] = [];

  constructor(seed: number) {
    super(true);
    this.seed = seed;

    const market: GlobalMarket = getCompleteMarket();
    const recipes: RecipeDef[] = recipeDefs;
    const agents: Agent[] = [];
    this.station = new Station(market, agents, recipes, 5);
  }

  public tick() {
    this.log(`\n~~ Tick ${this.tickCount} ~~`);

    // Create visiting merchants.
    const visitingMerchant = this.getRandomMerchant();
    visitingMerchant.tick();

    // Run the sim.
    this.station.tick();

    this.print();

    // Notify UIs
    this.notifyListeners();

    this.tickCount++;
  }

  public subscribe(listener: GameTickListener) {
    this.subscribers.push(listener);
  }

  private notifyListeners() {
    const state: GameState = {
      tickCount: this.tickCount,
      wealth: this.station.market.wealth,
      resources: {},
    };
    for (const [
      resourceId,
      market,
    ] of this.station.market.resourceMarkets.entries()) {
      state.resources[resourceId] = {
        count: market.stock,
        price: market.price,
        modifier: 0,
      };
    }

    // Nothing yet.
    const logs: GameLogEvent[] = [];

    for (const listener of this.subscribers) {
      listener(state, logs);
    }
  }

  private getRandomMerchant(): Merchant {
    const merchantDef = getSeededRandom<MerchantDef>(
      this.seed,
      this.tickCount,
      merchantDefs,
    );
    return new Merchant(
      merchantDef.initialWealth,
      merchantDef.cargo,
      merchantDef.minSalePrices,
      merchantDef.maxBuyPrices,
      this.station.market,
    );
  }

  private print() {
    this.log(`Tick ${this.tickCount} summary`);
    this.log(` Market:`);
    this.log(`  - Wealth: ${this.station.market.wealth.toFixed(2)}`);
    for (const [
      resourceId,
      market,
    ] of this.station.market.resourceMarkets.entries()) {
      this.log(
        `  - [${market.id}] ${resourceId}: ${market.stock.toFixed(0)} in stock, ${market.price.toFixed(2)} per unit`,
      );
    }
    this.log(` Agents:`);
    for (const facility of this.station.facilities) {
      if (facility.agent) {
        const agent = facility.agent;
        this.log(
          `  - [${agent.id}] ${agent.recipe.displayName} with ${agent.wealth.toFixed(2)} wealth, ${agent.state}`,
        );
      } else {
        this.log(`  - No agent`);
      }
    }
    this.log(` Recipes:`);
    for (const recipe of this.station.availableRecipes) {
      this.log(
        `  - ${recipe.displayName}: ${profitability(this.station.market, recipe).toFixed(2)} profit`,
      );
    }
  }
}
