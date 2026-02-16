<template>
  <div>
    <h1>Red Sun Station</h1>
    <p>Day {{ game.day() }} {{ game.hour() }}:00, Tick: {{ game.tickCount }}</p>
    <h2 v-if="game.state == 'LOSE'">GAME OVER. Refresh to restart</h2>
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
          <th>Graph</th>
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

    <div v-for="[resourceId, market] in game.station.market.resourceMarkets">
      <h3>{{ resourceId.toUpperCase() }} History</h3>
      <h4>Stock</h4>
      <Chart
        :series="[
          resourceHistory.map((p) => {
            const h = p.get(resourceId);
            if (!h) return 0;
            return h.stock;
          }),
        ]"
      />
      <h4>Price</h4>
      <Chart
        :series="[
          resourceHistory.map((p) => {
            const h = p.get(resourceId);
            if (!h) return 0;
            return h.price;
          }),
          resourceHistory.map((p) => {
            const h = p.get(resourceId);
            if (!h) return 0;
            return h.importPrice;
          }),
          resourceHistory.map((p) => {
            const h = p.get(resourceId);
            if (!h) return 0;
            return h.exportPrice;
          }),
        ]"
      />
    </div>

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
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { Game } from "../game";
import { GameLogEvent, Price, Quantity, ResourceID } from "../types";
import MerchantRow from "./MerchantRow.vue";
import { Merchant } from "../merchant";
import ResourceRow from "./ResourceRow.vue";
import { ResourceMarket } from "../market";
import Chart from "./Chart.vue";

const props = defineProps<{ game: Game }>();

interface ResourceHistoryPoint {
  stock: Quantity;
  price: Price;
  importPrice: Price;
  exportPrice: Price;
}

interface HistoryPoint {
  wealth: number;
  population: number;
  hungryPopulation: number;
}

const MAX_GAME_FPS = 8;
// Use props.game instead of creating a new one
const game = props.game;
const logs = ref<GameLogEvent[]>([]);
const history = ref<HistoryPoint[]>([]);
const resourceHistory = ref<Map<ResourceID, ResourceHistoryPoint>[]>([]);

let gameSpeed = ref<"0.5" | "1" | "2" | "4" | "8">("1");
let paused = ref(true);
let intervalId: any = null;

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

onMounted(() => {
  game.events.subscribe((event) => {
    event.message = `[Day ${game.day()}] ${event.message}`;
    logs.value.push(event);
    // Optional: limit log size
    if (logs.value.length > 50) {
      logs.value.shift();
    }
  });

  let i = 0;
  intervalId = setInterval(() => {
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
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

function tick() {
  if (game.state == "LOSE") return;

  // TODO: purge old history points.

  const resourceHistoryPoint = new Map<ResourceID, ResourceHistoryPoint>();
  for (let [resourceId, market] of game.station.market.resourceMarkets) {
    resourceHistoryPoint.set(resourceId, {
      stock: market.stock,
      price: market.price,
      importPrice: market.importPrice(),
      exportPrice: market.exportPrice(),
    });
  }
  resourceHistory.value.push(resourceHistoryPoint);

  history.value.push({
    wealth: game.station.market.wealth,
    population: game.station.population,
    hungryPopulation: game.station.starvingPopulation,
  });

  game.tick();
}

watch(
  () => game.visitingMerchants,
  (newMerchants, oldMerchants) => {
    console.log("BRETT", newMerchants);
  },
);
</script>
