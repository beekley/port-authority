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
import { getSeededWeightedRandom } from "./util";
import { DebugLogger, EventLogger } from "./logging";

const MERCHANT_TICK_INTERVAL = 5;
const MERCHANT_TICK_DURATION = 3;

// TODOs:
// - player can set tarrifs / subsidies
// - player can set max import quantity
export class Game {
  public readonly debug: DebugLogger;
  public readonly events: EventLogger;

  public state: "PLAY" | "LOSE" = "PLAY";
  public readonly station: Station;
  public readonly visitingMerchants: {
    sinceTick: number;
    merchant: Merchant;
  }[] = [];
  private lastTickWithMerchant = 0;

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

    // Check Game state.
    if (this.station.population <= 0) {
      this.state = "LOSE";
      return;
    }

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
    // If it's time for a new merchant, add one
    // TODO: Check that there isn't a duplicate merchant, if we ever make them unique.
    if (this.tickCount - this.lastTickWithMerchant > MERCHANT_TICK_INTERVAL) {
      this.lastTickWithMerchant = this.tickCount;
      const weights = merchantDefs.map((def) => {
        let weight = 10; // Base weight

        // Merchant selling to us (Importing)
        // More subsidy (positive mod) = more attractive
        for (const [resourceId] of def.cargo) {
          const market = this.station.market.resourceMarkets.get(resourceId);
          if (market) {
            const mod = market.tradePolicy.importPriceModifier || 0;
            weight *= Math.max(0, 1 + mod);
          }
        }

        // Merchant buying from us (Exporting)
        // Less tax (negative mod) = more attractive
        // Lower price = more attractive
        for (const resourceId of def.wantsToBuy) {
          const market = this.station.market.resourceMarkets.get(resourceId);
          if (market) {
            const mod = market.tradePolicy.exportPriceModifier || 0;
            // Avoid division by zero and extreme weights
            const effectiveMod = Math.max(-0.9, mod);
            weight *= 1 / (1 + effectiveMod);
          }
        }
        return weight;
      });

      const merchantDef = getSeededWeightedRandom<MerchantDef>(
        this.seed,
        this.tickCount,
        merchantDefs,
        weights,
      );
      const merchant = new Merchant(
        merchantDef.name || `Merchant ${this.tickCount}`,
        merchantDef.initialWealth,
        merchantDef.cargo,
        merchantDef.wantsToBuy,
        merchantDef.profitMargin,
        this.station.market,
      );
      merchant.events.subscribe(({ source, message }) => {
        this.events.log(source, message);
      });
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
        this.station.migratePop(merchant);
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
