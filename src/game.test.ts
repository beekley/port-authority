import { describe, it, expect } from "vitest";
import { Game } from "./game";
import { env, memoryUsage } from "process";
import { SILENT } from "./util";

describe("Game", () => {
  it("should tick the game and increase the tick count", () => {
    const game = new Game(123);
    expect(game["tickCount"]).toBe(0);

    for (let i = 0; i < 10; i++) {
      game.tick();
    }

    expect(game["tickCount"]).toBe(10);
  });

  it("should tick many times performantly", () => {
    // VERY IMPORTANT TO TURN OFF LOGGING!
    env.LOGGING = SILENT;
    const tickCount = 10 * 1000;
    const game = new Game(123);
    const start = performance.now();

    for (let i = 0; i < tickCount; i++) {
      game.tick();
    }

    const durationMs = performance.now() - start;
    expect(durationMs).toBeLessThan(300);
    const ramMb = memoryUsage().rss / 1024 / 1024;
    expect(ramMb).toBeLessThan(100);

    console.log(
      `Took ${durationMs.toFixed(1)}ms, ${(tickCount / (durationMs / 1000)).toFixed(0)} ticks / sec; ${ramMb.toFixed(2)}MB process RAM.`,
    );
  });
});
