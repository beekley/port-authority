import { describe, it, expect } from "vitest";
import { Game } from "./game";

describe("Game", () => {
  it("should tick the game and increase the tick count", () => {
    const game = new Game(123);
    expect(game["tickCount"]).toBe(0);

    game.tick();
    expect(game["tickCount"]).toBe(1);

    for (let i = 0; i < 10; i++) {
      game.tick();
    }
    expect(game["tickCount"]).toBe(11);
  });
});
