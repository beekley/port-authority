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
  LogSource,
  MerchantDef,
  RecipeDef,
  Tick,
} from "./types";
import { getSeededRandom } from "./util";
import { DebugLogger, EventLogger } from "./logging";

const MAX_EVENT_HISTORY = 3;
const MERCHANT_TICK_INTERVAL = 24;
const MERCHANT_TICK_DURATION = 5;

// TODOs:
// - player can set tarrifs / subsidies
// - player can set max import quantity
export class Game {
  public readonly debug: DebugLogger;
  public readonly events: EventLogger;

  public readonly station: Station;
  public readonly visitingMerchants: {
    sinceTick: number;
    merchant: Merchant;
  }[] = [];

  public tickCount = 0;
  private readonly seed: number;
  private subscribers: GameTickListener[] = [];
  // Ring buffer
  private eventLogs: GameLogEvent[] = [];

  constructor(seed: number) {
    this.seed = seed;
    this.debug = new DebugLogger("Game");
    this.events = new EventLogger();

    const market: GlobalMarket = getCompleteMarket();
    const recipes: RecipeDef[] = recipeDefs;
    const agents: Agent[] = [];
    this.station = new Station(market, agents, recipes, 5);
  }

  public tick() {
    // Logs maintenance.
    this.debug.log(`\n~~ Tick ${this.tickCount} ~~`);
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
      this.events.log(
        LogSource.MERCHANT,
        `${merchant.name} arrived with ${merchant.wealth.toFixed(2)} wealth`,
      );
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
    this.debug.log(`Tick ${this.tickCount} summary`);
    this.debug.log(` Market:`);
    this.debug.log(`  - Wealth: ${this.station.market.wealth.toFixed(2)}`);
    for (const [
      resourceId,
      market,
    ] of this.station.market.resourceMarkets.entries()) {
      this.debug.log(
        `  - [${market.resourceId}] ${resourceId}: ${market.stock.toFixed(0)} in stock, ${market.price.toFixed(2)} per unit`,
      );
    }
    this.debug.log(` Agents:`);
    for (const facility of this.station.facilities) {
      if (facility.agent) {
        const agent = facility.agent;
        this.debug.log(
          `  - [${agent.id}] ${agent.recipe.displayName}, ${agent.state}`,
        );
      } else {
        this.debug.log(`  - No agent`);
      }
    }
    this.debug.log(` Recipes:`);
    for (const recipe of this.station.availableRecipes) {
      this.debug.log(
        `  - ${recipe.displayName}: ${profitability(this.station.market, recipe).toFixed(2)} profit`,
      );
    }
  }
}
