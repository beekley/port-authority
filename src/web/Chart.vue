<template>
  <pre><code v-html="chart()"></code></pre>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as chart from "../chart";

export default defineComponent({
  props: {
    series: {
      type: Object as () => number[][],
      required: true,
    },
  },
  methods: {
    chart() {
      if (
        !this.$props.series ||
        this.$props.series.length === 0 ||
        this.$props.series[0].length === 0
      ) {
        return "";
      }
      const raw = chart.plot(this.$props.series, {
        min: 0,
        height: 10,
        colors: [chart.Color.DarkGray, chart.Color.Red],
      });
      return chart.ansiToHtml(raw);
    },
  },
});
</script>
