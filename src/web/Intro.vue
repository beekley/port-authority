<template>
  <div>
    <h2>Welcome to</h2>
    <h1>Red Sun Station</h1>
    <p>
      We are a mining community in the Red Sun Desert. It's pretty inhospitable
      and we don't grow much out here, so the community depends on trade to keep
      us fed and healthy. Fortunately, they say we're important part of the
      global economy and merchants will help keep us fed as long as we trade our
      mining products.
    </p>
    <p>
      With you as our our new Port Authority director, I hope you'll be able to
      do more than that. We dream of self sufficiency and knowing we won't go
      hungry if our output drops.
    </p>
    <p>Good luck.</p>
    <button @click="togglePlay">Start Game</button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["start"]);

function togglePlay() {
  console.log("start");
  emit("start");
}
</script>
