import { describe, it, expect, beforeEach, test } from "vitest";
import { Merchant } from "./merchant";
import { GlobalMarket, ResourceMarket } from "./market";
import { ResourceID, Quantity, Price } from "./types";

describe("Merchant", () => {
  let merchant: Merchant;
  let market: GlobalMarket;
  let foodMarket: ResourceMarket;
  let waterMarket: ResourceMarket;

  beforeEach(() => {
    // Prefill market.
    market = new GlobalMarket();
    market.wealth = 10000; // Plenty
    foodMarket = new ResourceMarket("food", 15, market);
    waterMarket = new ResourceMarket("clean water", 5, market);
    market.resourceMarkets.set("food", foodMarket);
    foodMarket.sellToMarket(10);
    market.resourceMarkets.set("clean water", waterMarket);
    waterMarket.sellToMarket(10);
  });

  // Parameterized tests.
  test.each([
    {
      name: "should sell food when price is right",
      initialWealth: 100,
      cargo: [["food", 10]] as [ResourceID, Quantity][],
      wantsToBuy: [] as ResourceID[],
      profitMargin: 0.5, // 50% margin
      // Market price is 15. Sell at 15 * 1.5 = 22.5. Total 225.
      expectedWealth: 100 + 225,
      expectedCargo: [["food", 0]] as [ResourceID, Quantity][],
    },
    {
      name: "should buy water when price is right",
      initialWealth: 100,
      cargo: [] as [ResourceID, Quantity][],
      wantsToBuy: ["clean water"] as ResourceID[],
      profitMargin: 0.2, // 20% margin
      // Market price is 5. Buy at 5 * 0.8 = 4.
      // Wealth 100. Can buy 100 / 4 = 25. Market has 10. Buy 10.
      // Cost 10 * 4 = 40. Wealth = 60.
      expectedWealth: 100 - 40,
      expectedCargo: [["clean water", 10]] as [ResourceID, Quantity][],
    },
  ])(
    "$name",
    ({
      initialWealth,
      cargo,
      wantsToBuy,
      profitMargin,
      expectedWealth,
      expectedCargo,
    }) => {
      // Create the merchant.
      merchant = new Merchant(
        "Test Merchant",
        initialWealth,
        cargo,
        wantsToBuy,
        profitMargin,
        market,
      );

      // Simulate the sales / purchases.
      merchant.tick();

      // Check conditions.
      expect(merchant.wealth).toBe(expectedWealth);
      for (const [resourceId, expectedQuantity] of expectedCargo) {
        expect(merchant.cargo.get(resourceId) || 0).toBe(expectedQuantity);
      }
    },
  );
});
