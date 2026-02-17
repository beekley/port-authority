<template>
  <div class="intro-container">
    <div class="intro-box">
      <h2>Welcome to</h2>
      <h1>Red Sun Station</h1>
      <p>
        We are a mining community in the Red Sun Desert. It's pretty
        inhospitable and we don't grow much out here, so the community depends
        on trade to keep us fed and healthy. Fortunately, they say we're
        important part of the global economy and merchants will help keep us fed
        as long as we trade our mining products.
      </p>
      <p>
        With you as our our new Port Authority director, I hope you'll be able
        to do more than that. We dream of self sufficiency and knowing we won't
        go hungry if our output drops.
      </p>
      <p>Good luck.</p>
      <button @click="togglePlay">Start Game</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["start"]);

function togglePlay() {
  console.log("start");
  emit("start");
}
</script>

<style scoped>
.intro-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
}

.intro-box {
  border: 4px solid var(--border-color);
  padding: 40px;
  max-width: 800px;
  background-color: var(--bg-color);
  text-align: center;
  box-shadow: 8px 8px 0px var(--accent-shadow);
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

h2 {
  margin-bottom: 0;
}

p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

button {
  font-size: 1.2rem;
  padding: 1rem 2rem;
  margin-top: 1rem;
}
</style>
