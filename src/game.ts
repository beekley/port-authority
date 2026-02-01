import { Agent } from "./agent";
import { getCompleteMarket, GlobalMarket, profitability } from "./market";
import { recipeDefs } from "./market.data";
import { Merchant } from "./merchant";
import { merchantDefs } from "./merchant.data";
import { Station } from "./station";
import {
  GameLogEvent,
  GameState,
  GameTickListener,
  MerchantDef,
  RecipeDef,
  Tick,
} from "./types";
import { getSeededRandom, Logger } from "./util";

const MAX_EVENT_HISTORY = 3;
const MERCHANT_TICK_INTERVAL = 24;
const MERCHANT_TICK_DURATION = 1;

// TODOs:
// - player can set tarrifs / subsidies
// - player can set max import quantity
export class Game extends Logger {
  public readonly station: Station;
  public readonly visitingMerchants: {
    sinceTick: number;
    merchant: Merchant;
  }[] = [];

  private tickCount = 0;
  private readonly seed: number;
  private subscribers: GameTickListener[] = [];
  // Ring buffer
  private eventLogs: GameLogEvent[] = [];

  constructor(seed: number) {
    super(true);
    this.seed = seed;

    const market: GlobalMarket = getCompleteMarket();
    const recipes: RecipeDef[] = recipeDefs;
    const agents: Agent[] = [];
    this.station = new Station(market, agents, recipes, 5);
  }

  public tick() {
    // Logs maintenance.
    this.log(`\n~~ Tick ${this.tickCount} ~~`);
    const tick: Tick = {
      tickCount: this.tickCount,
      hour: this.hour,
      day: this.day,
    };

    // Update merchants.
    this.updateMerchants();

    // Run the sim.
    this.station.tick(tick);

    this.print();

    // Notify UIs
    this.notifyListeners();

    this.tickCount++;
  }

  public subscribe(listener: GameTickListener) {
    this.subscribers.push(listener);
  }

  public hour(): number {
    return Math.floor(this.tickCount % 24);
  }

  public day(): number {
    return Math.floor(this.tickCount / 24) + 1;
  }

  private notifyListeners() {
    const state: GameState = {
      tickCount: this.tickCount,
      population: this.station.population,
      starvingPopulation: this.station.starvingPopulation,
      wealth: this.station.market.wealth,
      resources: {},
    };
    for (const [
      resourceId,
      market,
    ] of this.station.market.resourceMarkets.entries()) {
      const importModifier = market.tradePolicy.importPriceModifier || 0;
      const exportModifier = market.tradePolicy.exportPriceModifier || 0;
      state.resources[resourceId] = {
        count: market.stock,
        price: market.price,
        importModifier,
        exportModifier,
        importForbidden: market.tradePolicy.importForbidden || false,
        exportForbidden: market.tradePolicy.exportForbidden || false,
      };
    }

    for (const listener of this.subscribers) {
      listener(state, this.eventLogs);
    }
  }

  private addGameEvent(event: GameLogEvent) {
    if (this.eventLogs.length >= MAX_EVENT_HISTORY) {
      this.eventLogs.pop();
    }
    event.timestamp = this.tickCount.toString();
    this.eventLogs.unshift(event);
  }

  private updateMerchants() {
    // Get the most recent tick that had a new merchant
    let lastTickWithMerchant = 0;
    for (const { sinceTick } of this.visitingMerchants) {
      if (sinceTick > lastTickWithMerchant) {
        lastTickWithMerchant = sinceTick;
      }
    }

    // If it's time for a new merchant, add one
    // TODO: Check that there isn't a duplicate merchant, if we ever make them unique.
    if (this.tickCount - lastTickWithMerchant > MERCHANT_TICK_INTERVAL) {
      const merchantDef = getSeededRandom<MerchantDef>(
        this.seed,
        this.tickCount,
        merchantDefs,
      );
      const merchant = new Merchant(
        merchantDef.name || `Merchant ${this.tickCount}`,
        merchantDef.initialWealth,
        merchantDef.cargo,
        merchantDef.wantsToBuy,
        merchantDef.profitMargin,
        this.station.market,
      );
      this.visitingMerchants.push({
        sinceTick: this.tickCount,
        merchant,
      });
      this.addGameEvent({
        type: "SHIP_ARRIVAL",
        message: `${merchant.name} arrived with ${merchant.wealth.toFixed(2)} wealth`,
      });
    }

    for (const { sinceTick, merchant } of this.visitingMerchants) {
      // Sim merchant
      merchant.tick();

      // Merchant leaves if it's time for them to go
      if (this.tickCount - sinceTick > MERCHANT_TICK_DURATION) {
        this.visitingMerchants.splice(
          this.visitingMerchants.indexOf({ sinceTick, merchant }),
          1,
        );
      }
    }
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
          `  - [${agent.id}] ${agent.recipe.displayName}, ${agent.state}`,
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
