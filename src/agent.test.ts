import { describe, it, expect, beforeEach } from "vitest";
import { Agent } from "./agent";
import { GlobalMarket, ResourceMarket } from "./market";
import { ResourceID, Quantity, RecipeDef } from "./types";

describe("Agent", () => {
  let agent: Agent;
  let market: GlobalMarket;
  let foodMarket: ResourceMarket;
  let steelMarket: ResourceMarket;

  const recipe = {
    displayName: "Burger",
    inputs: new Map<ResourceID, Quantity>([["food", 1]]),
    outputs: new Map<ResourceID, Quantity>([["steel", 2]]),
  };

  beforeEach(() => {
    market = new GlobalMarket();
    foodMarket = new ResourceMarket("food", 10, market);
    steelMarket = new ResourceMarket("steel", 10, market);
    market.resourceMarkets.set("food", foodMarket);
    market.resourceMarkets.set("steel", steelMarket);
    agent = new Agent(recipe, market);
  });

  it("should buy needed resources for a recipe", () => {
    foodMarket.executePurchase(1, 10); // Put 1 food in the market stock

    agent.tick();

    console.log(agent);
    expect(foodMarket.stock).toBe(0); // Agent bought the 1 food
  });

  it("should produce resources and sell them to the market", () => {
    // Tick 1: Buy resources
    foodMarket.executePurchase(1, 10);
    agent.tick();
    expect(foodMarket.stock).toBe(0);

    // Should have produced 2 food, and sold them.
    // The recipe is 1 in, 2 out. Agent had 1 food.
    // It produces 2 steel. Storage becomes 2. Then it sells them.
    expect(steelMarket.stock).toBe(2);
  });

  it("should update state to 'insufficient production' after MAX_TICKS_WITHOUT_PRODUCTION ticks", () => {
    for (let i = 0; i < 6; i++) {
      agent.tick();
    }

    expect(agent.state).toBe("insufficient production");

    // Fill market and it should produce again.
    foodMarket.executePurchase(1, 10);
    agent.tick();

    expect(agent.state).toBe("producing");
  });
});
