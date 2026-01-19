import { Agent } from "./agent";
import { GlobalMarket } from "./market";

export class Station {
  private readonly market: GlobalMarket;
  private readonly agents: Agent[];

  constructor(market: GlobalMarket, agents: Agent[]) {
    // Starting values for test / debug.
    this.market = market;
    this.agents = agents;
  }

  public tick() {
    // Let agents do their work first.
    for (const agent of this.agents) {
      agent.tick();
    }
    // Update Market prices
    for (const market of this.market.values()) {
      market.tick();
    }
    // Remove agents that aren't producing.
    // Add new agents to meet demand.
    for (const agent of this.agents) {
      if (agent.state === "insufficient production") {
        this.evictAgent(agent);
      }
    }
  }

  private evictAgent(agent: Agent) {
    agent.prepareForEviction();
    this.agents.splice(this.agents.indexOf(agent), 1);
  }
}
