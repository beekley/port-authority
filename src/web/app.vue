<template>
  <div id="intro" v-if="game.state == 'INTRO'">
    <Intro @start="startGame" />
  </div>
  <div id="game" v-if="game.state == 'PLAY' || game.state == 'LOSE'">
    <Game :game="game" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Game as GameClass } from "../game";
import { getSeed } from "../util";
import Game from "./Game.vue";
import Intro from "./Intro.vue";

const game = ref(new GameClass(getSeed()));

function startGame() {
  game.value.state = "PLAY";
}
</script>
