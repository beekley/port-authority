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

  it("should apply tarrifs to import but not local sale prices", () => {
    // Pre-tarrif.
    const importTx1 = market.sellToMarket(2, true);
    expect(importTx1.totalPrice).toBe(2 * initialPrice);

    // Apply tarrif
    const importModifier = 0.1;
    market.globalMarket.importModifiers.set(resourceId, importModifier);

    // Post-tarrif
    const localTx = market.sellToMarket(2);
    expect(localTx.totalPrice).toBe(2 * initialPrice);
    const importTx2 = market.sellToMarket(2, true);
    expect(importTx2.totalPrice).toBe(2 * initialPrice * (1 + importModifier));
  });

  it("should apply tarrifs to export but not local purchase prices", () => {
    // Fill market
    market.sellToMarket(50);

    // Pre-tarrif.
    const exportTx1 = market.buyFromMarket(2, true);
    expect(exportTx1.totalPrice).toBe(2 * initialPrice);

    // Apply tarrif
    const exportModifier = 0.1;
    market.globalMarket.exportModifiers.set(resourceId, exportModifier);

    // Post-tarrif
    const localTx = market.buyFromMarket(2);
    expect(localTx.totalPrice).toBe(2 * initialPrice);
    const exportTx2 = market.buyFromMarket(2, true);
    expect(exportTx2.totalPrice).toBe(2 * initialPrice * (1 + exportModifier));
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
