import { describe, it, expect, beforeEach } from "vitest";
import { Station } from "./station";
import { Agent } from "./agent";
import { GlobalMarket, ResourceMarket } from "./market";
import { RecipeDef } from "./types";

describe("Station", () => {
  let station: Station;
  let market: GlobalMarket;
  let foodMarket: ResourceMarket;
  let steelMarket: ResourceMarket;
  let agents: Agent[];
  let recipes: RecipeDef[];
  let recipe: RecipeDef;

  beforeEach(() => {
    market = new GlobalMarket();
    foodMarket = new ResourceMarket("food", 10, market);
    steelMarket = new ResourceMarket("steel", 20, market);
    market.resourceMarkets.set("food", foodMarket);
    market.resourceMarkets.set("steel", steelMarket);
    agents = [];
    station = new Station(market, agents, []);

    recipe = {
      displayName: "Test Recipe",
      inputs: new Map([["food", 1]]),
      outputs: new Map([["steel", 2]]),
    };
  });

  it("should tick the agents and markets", () => {
    // Replaces the tick method with a tracker
    let marketTickedCount = 0;
    foodMarket.tick = () => marketTickedCount++;

    let agentTickedCount = 0;
    const mockAgent = new Agent(100, recipe, market);
    mockAgent.tick = () => agentTickedCount++;

    station = new Station(market, [mockAgent], []);
    station.tick();

    expect(marketTickedCount).toBe(1);
    expect(agentTickedCount).toBe(1);

    station.tick();

    expect(marketTickedCount).toBe(2);
    expect(agentTickedCount).toBe(2);
  });

  it("should evict agents with 'insufficient production' state", () => {
    const mockAgent1 = new Agent(100, recipe, market);
    const mockAgent2 = new Agent(0, recipe, market);

    let agent1TickedCount = 0;
    mockAgent1.tick = () => agent1TickedCount++;

    let agent2TickedCount = 0;
    mockAgent2.tick = () => agent2TickedCount++;

    mockAgent2.state = "insufficient production";
    station = new Station(market, [mockAgent1, mockAgent2], []);
    station.tick();
    expect(station["facilities"].map((f) => f.agent)).toEqual([
      mockAgent1,
      undefined,
    ]);
    expect(agent1TickedCount).toBe(1);
    expect(agent2TickedCount).toBe(1);

    // Also check that the evicted agent does not tick.
    station.tick();
    expect(agent1TickedCount).toBe(2);
    expect(agent2TickedCount).toBe(1);
  });

  it("should add a new agent if there is demand and an available facility", () => {
    recipes = [recipe];

    // Create a station with an empty facility and the recipe
    station = new Station(market, [], recipes, 1);
    expect(station.facilities.length).toBe(1);
    expect(station.facilities[0].agent).toBeUndefined();

    // Tick the station to trigger agent addition
    station.tick();

    // Check if a new agent was added to the facility
    expect(station.facilities.length).toBe(1);
    expect(station.facilities[0].agent).toBeDefined();
    expect(station.facilities[0].agent).toBeInstanceOf(Agent);
  });
});
