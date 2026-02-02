<!-- TODO: Split into components -->
<template>
  <div id="app">
    <h1>Port Authority</h1>
    <p>Day {{ game.day() }} {{ game.hour() }}:00, Tick: {{ game.tickCount }}</p>
    <p>Port Wealth: ${{ game.station.market.wealth.toFixed(2) }}</p>
    <p>
      Port Pop: {{ game.station.population.toFixed(0) }}
      <span v-if="game.station.starvingPopulation > 0">
        ({{ game.station.starvingPopulation.toFixed(0) }} hungry, unable to
        work)
      </span>
    </p>

    <hr />

    <div>
      <button @click="togglePlay">
        {{ paused ? "Start" : "Pause" }}
      </button>
    </div>

    <hr />

    <h2>Resources</h2>
    <table>
      <thead>
        <tr>
          <th>Resource</th>
          <th>Stored</th>
          <th>Price</th>
          <th>Imports</th>
          <th>Exports</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="[resourceId, market] in game.station.market.resourceMarkets"
          :key="resourceId"
        >
          <td>{{ resourceId.toUpperCase() }}</td>
          <td>{{ market.stock.toFixed(0) }}</td>
          <td>${{ market.price.toFixed(2) }}</td>
          <td>
            <button @click="toggleAllow(resourceId, 'import')">
              {{ market.tradePolicy.importForbidden ? "Banned" : "Allowed" }}
            </button>
          </td>
          <td>
            <button @click="toggleAllow(resourceId, 'export')">
              {{ market.tradePolicy.exportForbidden ? "Banned" : "Allowed" }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <hr />

    <h2>Visiting Merchants</h2>
    <table>
      <thead>
        <tr>
          <th>Merchant</th>
          <th>Cargo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ merchant } in game.visitingMerchants" :key="merchant.name">
          <MerchantRow :merchant="merchant as Merchant" />
        </tr>
        <tr v-if="game.visitingMerchants.length === 0">
          <td colspan="5">No merchants currently visiting.</td>
        </tr>
      </tbody>
    </table>

    <hr />

    <h2>Log</h2>
    <ul>
      <li v-for="(log, i) in reversedLogs" :key="i">
        {{ log.message }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Game } from "../game";
import { getSeed } from "../util";
import { GameLogEvent, ResourceID } from "../types";
import MerchantRow from "./MerchantRow.vue";
import { Merchant } from "../merchant";

const MAX_GAME_FPS = 5;
const game = ref(new Game(getSeed()));
const logs = ref<GameLogEvent[]>([]);
let paused = ref(true);

const reversedLogs = computed(() => {
  return [...logs.value].reverse();
});

function togglePlay() {
  paused.value = !paused.value;
}

function startGame() {
  game.value.events.subscribe((event) => {
    logs.value.push(event);
    // Optional: limit log size
    if (logs.value.length > 50) {
      logs.value.shift();
    }
  });

  setInterval(() => {
    if (!paused.value) {
      game.value.tick();
    }
  }, 1000 / MAX_GAME_FPS);
}

function toggleAllow(resourceId: ResourceID, direction: "import" | "export") {
  const market = game.value.station.market.resourceMarkets.get(resourceId);
  if (!market) return;
  if (direction === "import") {
    market.tradePolicy.importForbidden = !market.tradePolicy.importForbidden;
  } else if (direction === "export") {
    market.tradePolicy.exportForbidden = !market.tradePolicy.exportForbidden;
  }
}

watch(
  () => game.value.visitingMerchants,
  (newMerchants, oldMerchants) => {
    console.log("BRETT", newMerchants);
  },
);

startGame();
</script>
