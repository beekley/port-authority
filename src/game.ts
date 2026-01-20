import { Agent } from "./agent";
import { getCompleteMarket, GlobalMarket, profitability } from "./market";
import { recipeDefs } from "./market.data";
import { Merchant } from "./merchant";
import { merchantDefs } from "./merchant.data";
import { Station } from "./station";
import { MerchantDef, RecipeDef } from "./types";
import { getSeededRandom, Logger } from "./util";

export class Game extends Logger {
  public readonly station: Station;
  private tickCount = 0;
  private readonly seed: number;

  constructor(seed: number) {
    super(false);
    this.seed = seed;

    const market: GlobalMarket = getCompleteMarket();
    const recipes: RecipeDef[] = recipeDefs;
    const agents: Agent[] = [];
    this.station = new Station(market, agents, recipes, 5);
  }

  public tick() {
    this.log(`Tick ${this.tickCount}`);

    // Create visiting merchants.
    const visitingMerchant = this.getRandomMerchant();
    visitingMerchant.tick();

    // Run the sim.
    this.station.tick();

    this.print();

    this.tickCount++;
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
    this.log(`Tick ${this.tickCount} summary:`);
    this.log(` Market:`);
    for (const [resourceId, market] of this.station.market.entries()) {
      this.log(
        `  - [${market.id}] ${resourceId}: ${market.stock} in stock, ${market.price.toFixed(2)} per unit`,
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
