import { describe, it, expect } from "vitest";
import { Game } from "./game";

describe("Game", () => {
  it("should tick the game and increase the tick count", () => {
    const game = new Game(123);
    expect(game["tickCount"]).toBe(0);

    game.tick();
    expect(game["tickCount"]).toBe(1);

    game.tick();
    expect(game["tickCount"]).toBe(2);

    game.tick();
    expect(game["tickCount"]).toBe(3);
  });
});
