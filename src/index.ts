// cli.ts
import { env } from "process";
import { Game } from "./game";
import * as readline from "readline";
import { getSeed, SILENT } from "./util";

const MAX_TPS = 1;

// Log our own state.
env.LOGGING = SILENT;
const game = new Game(getSeed());
let tps: "1" | "2" = "1";
let paused = true;

// Setup Input (Keyboard)
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.on("keypress", (_, key) => {
  if (key?.name === "q") process.exit();
  if (key?.name === "space") togglePlay();
});

// 2. Setup Output (Subscription)
game.subscribe((state, logs) => {
  console.clear();

  // Draw Dashboard
  console.log(`=== PORT AUTHORITY (Tick: ${state.tickCount}) ===`);
  console.log(`Port Wealth: $${state.wealth.toFixed(2)}`);
  console.log(`-------------------------------------------`);

  for (const [id, res] of Object.entries(state.resources)) {
    console.log(
      `${id.toUpperCase()}: [${res.count}] $${res.price.toFixed(2)} (${res.modifier.toFixed(2)})`,
    );
  }

  // Draw Event Log
  console.log(`\n--- LOG ---`);
  logs.forEach((log) =>
    console.log(`> [tick ${log.timestamp}] [${log.type}] ${log.message}`),
  );
});

function togglePlay() {
  // Was paused -> play
  paused = !paused;
}

// Game loop.
setInterval(() => {
  if (paused) return;
  if (tps === "1") {
    game.tick();
  }
}, 1000 / MAX_TPS);

console.log("press space to start and pause");
