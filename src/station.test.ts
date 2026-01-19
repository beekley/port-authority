import { describe, it, expect, beforeEach } from "vitest";
import { Station } from "./station";
import { Agent } from "./agent";
import { GlobalMarket, ResourceMarket } from "./market";

describe("Station", () => {
  let station: Station;
  let market: GlobalMarket;
  let foodMarket: ResourceMarket;
  let agents: Agent[];

  beforeEach(() => {
    foodMarket = new ResourceMarket("food", 10);
    market = new Map([["food", foodMarket]]);
    agents = [];
    station = new Station(market, agents);
  });

  it("should tick the agents and markets", () => {
    // Replaces the tick method with a tracker
    let marketTickedCount = 0;
    foodMarket.tick = () => marketTickedCount++;

    let agentTickedCount = 0;
    const mockAgent = new Agent(100, [], market);
    mockAgent.tick = () => agentTickedCount++;

    station = new Station(market, [mockAgent]);
    station.tick();

    expect(marketTickedCount).toBe(1);
    expect(agentTickedCount).toBe(1);

    station.tick();

    expect(marketTickedCount).toBe(2);
    expect(agentTickedCount).toBe(2);
  });

  it("should evict agents with 'insufficient production' state", () => {
    const mockAgent1 = new Agent(100, [], market);
    const mockAgent2 = new Agent(0, [], market);

    let agent1TickedCount = 0;
    mockAgent1.tick = () => agent1TickedCount++;

    let agent2TickedCount = 0;
    mockAgent2.tick = () => agent2TickedCount++;

    mockAgent2.state = "insufficient production";
    station = new Station(market, [mockAgent1, mockAgent2]);
    station.tick();
    expect(station["agents"]).toEqual([mockAgent1]);
    expect(agent1TickedCount).toBe(1);
    expect(agent2TickedCount).toBe(1);

    // Also check that the evicted agent does not tick.
    station.tick();
    expect(agent1TickedCount).toBe(2);
    expect(agent2TickedCount).toBe(1);
  });
});
