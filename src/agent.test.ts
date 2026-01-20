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
    agent = new Agent(100, recipe, market);
  });

  it("should buy needed resources for a recipe", () => {
    foodMarket.sellToMarket(1); // Put 1 food in the market stock

    agent.tick();

    console.log(agent);
    expect(agent.wealth).toBe(90); // 100 - 1*10
    expect(foodMarket.stock).toBe(0); // Agent bought the 1 food
  });

  it("should not buy resources if it cannot afford them", () => {
    agent.wealth = 5;
    foodMarket.sellToMarket(1);

    agent.tick();

    expect(agent.wealth).toBe(5); // Not enough money
    expect(foodMarket.stock).toBe(1); // Should not have bought anything
  });

  it("should produce resources and sell them to the market", () => {
    // Tick 1: Buy resources
    foodMarket.sellToMarket(1);
    agent.tick();
    expect(agent.wealth).toBe(90);
    expect(foodMarket.stock).toBe(0);

    // Should have produced 2 food, and sold them.
    // The recipe is 1 in, 2 out. Agent had 1 food.
    // It produces 2 steel. Storage becomes 2. Then it sells them.
    expect(steelMarket.stock).toBe(2);
  });

  it("should update state to 'insufficient production' after MAX_TICKS_WITHOUT_PRODUCTION ticks", () => {
    foodMarket.sellToMarket(1);
    agent.wealth = 0; // Agent cannot afford resources.

    for (let i = 0; i < 6; i++) {
      agent.tick();
    }

    expect(agent.state).toBe("insufficient production");

    // Magically give it wealth and it should produce again.
    agent.wealth = 100;
    agent.tick();

    expect(agent.state).toBe("producing");
  });
});
