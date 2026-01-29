// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import { ResourceID, RecipeDef } from "./types";
import { GlobalMarket, ResourceMarket } from "./market";
import { profitability } from "./market";

describe("ResourceMarket", () => {
  let market: ResourceMarket;
  const resourceId: ResourceID = "food";
  const initialPrice = 100;

  beforeEach(() => {
    const globalMarket = new GlobalMarket();
    globalMarket.wealth = 10000; // Plenty
    market = new ResourceMarket(resourceId, initialPrice, globalMarket);
  });

  it("should initialize with correct values", () => {
    expect(market.resourceId).toBe(resourceId);
    expect(market.price).toBe(initialPrice);
    expect(market.stock).toBe(0);
  });

  it("should decrease stock and increase consumption count when buying from market", () => {
    market.sellToMarket(100);
    market.buyFromMarket(30);
    expect(market.stock).toBe(70);
  });

  it("should increase the price when consumption is greater than production", () => {
    // Prefill the stock.
    market.sellToMarket(50);
    market.tick();
    const oldPrice = market.price;

    market.sellToMarket(50);
    market.buyFromMarket(60);
    market.tick();
    expect(market.price).toBeGreaterThan(oldPrice);
  });

  it("should decrease the price when production is greater than consumption", () => {
    market.sellToMarket(60);
    market.buyFromMarket(50);
    market.tick();
    expect(market.price).toBeLessThan(initialPrice);
  });

  it("should not change the price when production and consumption are equal", () => {
    market.sellToMarket(50);
    market.buyFromMarket(50);
    market.tick();
    expect(market.price).toBe(initialPrice);
  });



  describe("TradePolicy", () => {
    it("should forbid imports", () => {
      market.tradePolicy.importForbidden = true;
      const tx = market.sellToMarket(10, 1);
      expect(tx.quantity).toBe(0);
      expect(tx.totalPrice).toBe(0);
    });

    it("should forbid exports", () => {
      market.tradePolicy.exportForbidden = true;
      // Stock up first
      market.stock = 100;
      const tx = market.buyFromMarket(10, 1);
      expect(tx.quantity).toBe(0);
      expect(tx.totalPrice).toBe(0);
    });

    it("should apply import price modifier", () => {
      market.tradePolicy.importPriceModifier = 0.5; // +50%
      // Base price 100 * 1.5 = 150
      const tx = market.sellToMarket(10, 1);
      expect(tx.totalPrice).toBe(1500);
    });

    it("should apply export price modifier", () => {
      market.tradePolicy.exportPriceModifier = -0.5; // -50%
      // Base price 100 * 0.5 = 50
      market.stock = 100;
      const tx = market.buyFromMarket(10, 1);
      expect(tx.totalPrice).toBe(500);
    });
  });
});

describe("profitability", () => {
  it("should calculate profitability correctly", () => {
    const market: GlobalMarket = {
      resourceMarkets: new Map(),
      wealth: 0,
    };
    const foodMarket = new ResourceMarket("food", 10);
    const steelMarket = new ResourceMarket("steel", 20);
    market.resourceMarkets.set("food", foodMarket);
    market.resourceMarkets.set("steel", steelMarket);

    const recipe: RecipeDef = {
      displayName: "Test Recipe",
      inputs: new Map([["food", 2]]),
      outputs: new Map([["steel", 2]]),
    };

    const profit = profitability(market, recipe);
    expect(profit).toBe(20); // 2*20 - 2*10 = 20
  });
});
