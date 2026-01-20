import { describe, it, expect } from "vitest";
import { Game } from "./game";
import { env, memoryUsage } from "process";
import { SILENT } from "./util";

describe("Game", () => {
  it("should tick the game and increase the tick count", () => {
    const game = new Game(123);
    const tickCount = 100;
    expect(game["tickCount"]).toBe(0);

    for (let i = 0; i < tickCount; i++) {
      game.tick();
    }

    expect(game["tickCount"]).toBe(tickCount);
  });

  it("should tick many times performantly", () => {
    // VERY IMPORTANT TO TURN OFF LOGGING!
    env.LOGGING = SILENT;
    const tickCount = 10 * 1000;
    const game = new Game(123);
    const start = performance.now();
    const startRam = memoryUsage().rss;

    for (let i = 0; i < tickCount; i++) {
      game.tick();
    }

    const durationMs = performance.now() - start;
    expect(durationMs).toBeLessThan(300);
    const endRam = memoryUsage().rss;
    const processRamMb = endRam / 1024 / 1024;
    const testRamMb = (endRam - startRam) / 1024 / 1024;
    expect(processRamMb).toBeLessThan(250);
    expect(testRamMb).toBeLessThan(100);

    console.log(
      `Took ${durationMs.toFixed(1)}ms, ${(tickCount / (durationMs / 1000)).toFixed(0)} ticks / sec; ${testRamMb.toFixed(2)}MB test RAM, ${processRamMb.toFixed(2)}MB process RAM`,
    );
  });
});
