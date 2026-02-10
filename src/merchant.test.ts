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
    foodMarket.import(10);
    market.resourceMarkets.set("clean water", waterMarket);
    waterMarket.import(10);
  });

  // Parameterized tests.
  interface MerchantTestCase {
    name: string;
    initialWealth: Price;
    cargo: [ResourceID, Quantity][];
    wantsToBuy: ResourceID[];
    profitMargin: number;
    tradePolicy: {
      resourceId: ResourceID;
      importPriceModifier?: number;
      exportPriceModifier?: number;
    };
    expectedWealth: Price;
    expectedCargo: [ResourceID, Quantity][];
  }

  test.each<MerchantTestCase>([
    {
      name: "should sell food when price is right",
      initialWealth: 100,
      cargo: [["food", 10]] as [ResourceID, Quantity][],
      wantsToBuy: [] as ResourceID[],
      profitMargin: 0.5, // 50% margin
      tradePolicy: { resourceId: "food", importPriceModifier: 0.5 },
      // Market price is 15. With modifier, import price is 15 * 1.5 = 22.5. Merchant wants >= 22.5.
      // Total 225.
      expectedWealth: 100 + 225,
      expectedCargo: [["food", 0]] as [ResourceID, Quantity][],
    },
    {
      name: "should buy water when price is right",
      initialWealth: 100,
      cargo: [] as [ResourceID, Quantity][],
      wantsToBuy: ["clean water"] as ResourceID[],
      profitMargin: 0.2, // 20% margin
      tradePolicy: { resourceId: "clean water", exportPriceModifier: -0.2 },
      // Market price is 5. With modifier, export price is 5 * 0.8 = 4. Merchant wants <= 4.
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
      tradePolicy,
    }) => {
      // Apply trade policy for this test case
      if (tradePolicy) {
        const m = market.resourceMarkets.get(tradePolicy.resourceId);
        if (m) {
          if (tradePolicy.importPriceModifier) {
            m.tradePolicy.importPriceModifier = tradePolicy.importPriceModifier;
          }
          if (tradePolicy.exportPriceModifier) {
            m.tradePolicy.exportPriceModifier = tradePolicy.exportPriceModifier;
          }
        }
      }

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
