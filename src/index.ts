// CLI
import { Game } from "./game";
import * as readline from "readline";
import { getSeed } from "./util";
import { GameLogEvent, GameState, ResourceID } from "./types";

const MAX_GAME_FPS = 5;
const MAX_UI_FPS = 20;

let paused = true;
let resourceIds: ResourceID[] = [];
let selectedResourceIndex = 0;
let gameState: GameState | null = null;
let gameLogs: GameLogEvent[] = [];

// 1. Setup Game

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
  if (key?.name === "i") toggleImportBan(selectedResource);
  if (key?.name === "e") toggleExportBan(selectedResource);
  // if (key?.name === "i") adjustImportModifier(selectedResource, 0.1);
  // if (key?.name === "k") adjustImportModifier(selectedResource, -0.1);
  // if (key?.name === "e") adjustExportModifier(selectedResource, 0.1);
  // if (key?.name === "d") adjustExportModifier(selectedResource, -0.1);
});

// 2. Setup Output (Subscription)
game.subscribe((state, logs) => {
  gameState = state;
  gameLogs = logs;
});

function updateUi() {
  if (!gameState || !resourceIds) return;
  const state = gameState;
  const logs = gameLogs;

  console.clear();
  resourceIds = Object.keys(state.resources) as ResourceID[];

  // Draw Dashboard
  console.log(
    `=== PORT AUTHORITY (Day ${game.day()} ${game.hour()}:00, Tick: ${state.tickCount}) ===`,
  );
  console.log(`Port Wealth: $${state.wealth.toFixed(2)}`);
  console.log(
    `Port Pop: ${state.population.toFixed(0)} ${state.starvingPopulation > 0 ? `(${state.starvingPopulation.toFixed(0)} hungry, unable to work)` : ""}`,
  );
  console.log(`-------------------------------------------`);

  const selectedResource = resourceIds[selectedResourceIndex] as ResourceID;
  for (const [id, res] of Object.entries(state.resources)) {
    const isSelected = id === selectedResource;
    const priceStr = `Price: $${res.price.toFixed(2)}`;
    // const impPrice = (res.price * (1 + res.importModifier)).toFixed(2);
    const countStr = `Stored: ${res.count.toFixed(0)}`;
    const impStr = res.importForbidden ? "IMPORTS BANNED" : "";
    const expStr = res.exportForbidden ? "EXPORTS BANNED" : "";
    console.log(
      `${isSelected ? "> " : "  "}${id.toUpperCase().padEnd(10)} | ${countStr.padEnd(12)} | ${priceStr.padEnd(15)} | ${impStr} ${expStr}`,
    );
  }

  // Draw Event Log
  console.log(`\n--- LOG ---`);
  logs.forEach((log) =>
    console.log(`> [tick ${log.timestamp}] [${log.type}] ${log.message}`),
  );
}

function toggleImportBan(resourceId: ResourceID) {
  const market = game.station.market.resourceMarkets.get(resourceId);
  if (market) {
    market.tradePolicy.importForbidden = !market.tradePolicy.importForbidden;
  }
}

function toggleExportBan(resourceId: ResourceID) {
  const market = game.station.market.resourceMarkets.get(resourceId);
  if (market) {
    market.tradePolicy.exportForbidden = !market.tradePolicy.exportForbidden;
  }
}

// function adjustImportModifier(resourceId: ResourceID, amount: number) {
//   const market = game.station.market;
//   const currentModifier = market.importModifiers.get(resourceId) || 0;
//   market.importModifiers.set(resourceId, currentModifier + amount);
// }

// function adjustExportModifier(resourceId: ResourceID, amount: number) {
//   const market = game.station.market;
//   const currentModifier = market.exportModifiers.get(resourceId) || 0;
//   market.exportModifiers.set(resourceId, currentModifier + amount);
// }

function togglePlay() {
  // Was paused -> play
  paused = !paused;
}

// Game loop.
setInterval(() => {
  if (paused) return;
  game.tick();
}, 1000 / MAX_GAME_FPS);

setInterval(() => {
  updateUi();
}, 1000 / MAX_UI_FPS);

console.log("Press space to start and pause.");
