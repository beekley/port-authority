import { Game } from "./game";
import * as readline from "readline";
import { getSeed } from "./util";
import { ResourceID } from "./types";

const MAX_TPS = 1;

let tps: "1" | "2" = "1";
let paused = true;
let resourceIds: ResourceID[] = [];
let selectedResourceIndex = 0;

const game = new Game(getSeed());

// Setup Input (Keyboard)
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.on("keypress", (_, key) => {
  if (key?.name === "q") process.exit();
  if (key?.name === "space") togglePlay();

  // Adjust selected resource
  if (key?.name === "tab") {
    selectedResourceIndex = (selectedResourceIndex + 1) % resourceIds.length;
  }

  // Adjust import modifiers
  if (!resourceIds.length) return;

  const selectedResource = resourceIds[selectedResourceIndex] as ResourceID;
  if (key?.name === "i") adjustImportModifier(selectedResource, 0.1);
  if (key?.name === "k") adjustImportModifier(selectedResource, -0.1);
  if (key?.name === "e") adjustExportModifier(selectedResource, 0.1);
  if (key?.name === "d") adjustExportModifier(selectedResource, -0.1);
});

// 2. Setup Output (Subscription)
game.subscribe((state, logs) => {
  console.clear();
  resourceIds = Object.keys(state.resources) as ResourceID[];

  // Draw Dashboard
  console.log(`=== PORT AUTHORITY (Tick: ${state.tickCount}) ===`);
  console.log(`Port Wealth: $${state.wealth.toFixed(2)}`);
  console.log(`Port Pop: ${state.population.toFixed(0)}`);
  console.log(`-------------------------------------------`);

  const selectedResource = resourceIds[selectedResourceIndex] as ResourceID;
  for (const [id, res] of Object.entries(state.resources)) {
    const isSelected = id === selectedResource;
    const local = `local: $${res.price.toFixed(2)}`;
    const imp = `imp: $${(res.price * (1 + res.importModifier)).toFixed(2)} (${(100 * res.importModifier).toFixed(0)}%)`;
    const exp = `exp: $${(res.price * (1 + res.exportModifier)).toFixed(2)} (${(100 * res.exportModifier).toFixed(0)}%)`;
    console.log(
      `${isSelected ? "> " : "  "}${id.toUpperCase().padEnd(7)}: [${res.count}] ${local}, ${imp}, ${exp}`,
    );
  }

  // Draw Event Log
  console.log(`\n--- LOG ---`);
  logs.forEach((log) =>
    console.log(`> [tick ${log.timestamp}] [${log.type}] ${log.message}`),
  );
});

function adjustImportModifier(resourceId: ResourceID, amount: number) {
  const market = game.station.market;
  const currentModifier = market.importModifiers.get(resourceId) || 0;
  market.importModifiers.set(resourceId, currentModifier + amount);
}

function adjustExportModifier(resourceId: ResourceID, amount: number) {
  const market = game.station.market;
  const currentModifier = market.exportModifiers.get(resourceId) || 0;
  market.exportModifiers.set(resourceId, currentModifier + amount);
}

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

console.log("Press space to start and pause.");
