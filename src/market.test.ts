// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import { ResourceID } from "./types";
import { ResourceMarket } from "./market";

describe("ResourceMarket", () => {
  let market: ResourceMarket;
  const resourceId: ResourceID = "food";
  const initialPrice = 100;

  beforeEach(() => {
    market = new ResourceMarket(resourceId, initialPrice);
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

  it("should throw an error when buying more than available stock", () => {
    market.sellToMarket(20);
    expect(() => market.buyFromMarket(30)).toThrow("Not enough in stock");
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
});
