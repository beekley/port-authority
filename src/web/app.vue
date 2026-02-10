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
      <button @click="toggleSpeed">{{ gameSpeed }}x</button>
    </div>

    <hr />

    <h2>Resources</h2>
    <table>
      <thead>
        <tr>
          <th>Resource</th>
          <th>Stored</th>
          <th>Market Price</th>
          <th>Imports</th>
          <th>Exports</th>
        </tr>
      </thead>
      <tbody>
        <ResourceRow
          :market="market as ResourceMarket"
          v-for="[resourceId, market] in game.station.market.resourceMarkets"
          :key="resourceId"
        />
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
        <MerchantRow
          :merchant="merchant as Merchant"
          v-for="{ merchant } in game.visitingMerchants"
          :key="merchant.name"
        />
        <tr v-if="game.visitingMerchants.length === 0">
          <td colspan="5">No merchants currently visiting.</td>
        </tr>
      </tbody>
    </table>

    <hr />

    <h3>Wealth History</h3>
    <Chart :series="[history.map((p) => p.wealth)]" />
    <h3>Pop History</h3>
    <Chart
      :series="[
        history.map((p) => p.population),
        history.map((p) => p.hungryPopulation),
      ]"
    />

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
import ResourceRow from "./ResourceRow.vue";
import { ResourceMarket } from "../market";
import Chart from "./Chart.vue";

interface HistoryPoint {
  wealth: number;
  population: number;
  hungryPopulation: number;
}

const MAX_GAME_FPS = 8;
const game = ref(new Game(getSeed()));
const logs = ref<GameLogEvent[]>([]);
const history = ref<HistoryPoint[]>([]);

let gameSpeed = ref<"0.5" | "1" | "2" | "4" | "8">("1");
let paused = ref(true);

const reversedLogs = computed(() => {
  return [...logs.value].reverse();
});

function togglePlay() {
  paused.value = !paused.value;
}

function toggleSpeed() {
  if (gameSpeed.value === "0.5") {
    gameSpeed.value = "1";
  } else if (gameSpeed.value === "1") {
    gameSpeed.value = "2";
  } else if (gameSpeed.value === "2") {
    gameSpeed.value = "4";
  } else if (gameSpeed.value === "4") {
    gameSpeed.value = "8";
  } else if (gameSpeed.value === "8") {
    gameSpeed.value = "0.5";
  }
}

function startGame() {
  game.value.events.subscribe((event) => {
    event.message = `[Day ${game.value.day()}] ${event.message}`;
    logs.value.push(event);
    // Optional: limit log size
    if (logs.value.length > 50) {
      logs.value.shift();
    }
  });

  let i = 0;
  setInterval(() => {
    if (!paused.value) {
      // These values assume MAX_GAME_FPS = 8
      if (gameSpeed.value === "8") {
        tick();
      } else if (gameSpeed.value === "4" && i % 2 === 0) {
        tick();
      } else if (gameSpeed.value === "2" && i % 4 === 0) {
        tick();
      } else if (gameSpeed.value === "1" && i % 8 === 0) {
        tick();
      } else if (gameSpeed.value === "0.5" && i % 16 === 0) {
        tick();
      }
    }
    i++;
    i = i % (MAX_GAME_FPS * 2);
  }, 1000 / MAX_GAME_FPS);
}

function tick() {
  history.value.push({
    wealth: game.value.station.market.wealth,
    population: game.value.station.population,
    hungryPopulation: game.value.station.starvingPopulation,
  });
  game.value.tick();
}

watch(
  () => game.value.visitingMerchants,
  (newMerchants, oldMerchants) => {
    console.log("BRETT", newMerchants);
  },
);

startGame();
</script>
