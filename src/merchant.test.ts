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
    market = new Map();
    foodMarket = new ResourceMarket("food", 15);
    waterMarket = new ResourceMarket("water", 5);
    market.set("food", foodMarket);
    foodMarket.sellToMarket(10);
    market.set("water", waterMarket);
    waterMarket.sellToMarket(10);
  });

  // Parameterized tests.
  test.each([
    {
      name: "should sell food when price is right",
      initialWealth: 100,
      cargo: [["food", 10]] as [ResourceID, Quantity][],
      minSalePrices: [["food", 15]] as [ResourceID, Quantity][],
      maxBuyPrices: [] as [ResourceID, Quantity][],
      expectedWealth: 100 + 10 * 15,
      expectedCargo: [["food", 0]] as [ResourceID, Quantity][],
    },
    {
      name: "should buy water when price is right",
      initialWealth: 100,
      cargo: [["water", 0]] as [ResourceID, Quantity][],
      minSalePrices: [] as [ResourceID, Quantity][],
      maxBuyPrices: [["water", 5]] as [ResourceID, Quantity][],
      expectedWealth: 100 - 10 * 5,
      expectedCargo: [["water", 10]] as [ResourceID, Quantity][],
    },
  ])(
    "$name",
    ({
      initialWealth,
      cargo,
      minSalePrices,
      maxBuyPrices,
      expectedWealth,
      expectedCargo,
    }) => {
      // Create the merchant.
      merchant = new Merchant(
        initialWealth,
        cargo,
        minSalePrices,
        maxBuyPrices,
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
