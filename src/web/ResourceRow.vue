<template>
  <tr>
    <td>{{ market.resourceId.toUpperCase() }}</td>
    <td>{{ market.stock.toFixed(0) }} {{ unit }}</td>
    <td>${{ market.price.toFixed(2) }} / {{ unit }}</td>
    <td>
      ${{ market.importPrice().toFixed(2) }} / {{ unit }}
      <button @click="setPolicy('BANNED', 'import')">Ban</button>
      <button @click="setPolicy('NEUTRAL', 'import')">Allow</button>
      <button @click="setPolicy('SUBSIDY', 'import')">Subsidize</button>
    </td>
    <td>
      ${{ market.exportPrice().toFixed(2) }} / {{ unit }}
      <button @click="setPolicy('BANNED', 'export')">Ban</button>
      <button @click="setPolicy('NEUTRAL', 'export')">Allow</button>
      <button @click="setPolicy('SUBSIDY', 'export')">Subsidize</button>
    </td>
    <td>
      <!-- TODO: make this toggle the graph -->
      <button @click="$emit('toggleGraph', market.resourceId)">Toggle</button>
    </td>
  </tr>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ResourceMarket } from "../market";
import { resourceDefs } from "../market.data";

const SUBSIDY_FRACTION = 0.5;
type policy = "SUBSIDY" | "NEUTRAL" | "BANNED";

export default defineComponent({
  props: {
    market: {
      type: Object as () => ResourceMarket,
      required: true,
    },
  },
  setup(props) {
    const resourceDef = resourceDefs.get(props.market.resourceId);
    const unit = resourceDef ? resourceDef.unit : "";
    return {
      unit,
      importPolicy: "NEUTRAL",
      exportPolicy: "NEUTRAL",
    };
  },
  methods: {
    setPolicy(newPolicy: policy, direction: "import" | "export") {
      console.log(newPolicy, direction);
      if (direction === "import") {
        this.importPolicy = newPolicy;
        console.log(this.importPolicy);
        if (newPolicy === "SUBSIDY") {
          this.market.tradePolicy.importForbidden = false;
          // Increase price station is willing to pay to import.
          this.market.tradePolicy.importPriceModifier = SUBSIDY_FRACTION;
        } else if (newPolicy === "NEUTRAL") {
          this.market.tradePolicy.importForbidden = false;
          this.market.tradePolicy.importPriceModifier = 0;
        } else if (newPolicy === "BANNED") {
          this.market.tradePolicy.importForbidden = true;
        }
      } else if (direction === "export") {
        this.exportPolicy = newPolicy;
        if (newPolicy === "SUBSIDY") {
          this.market.tradePolicy.exportForbidden = false;
          // Decrease price station is charging to export.
          this.market.tradePolicy.exportPriceModifier = -SUBSIDY_FRACTION;
        } else if (newPolicy === "NEUTRAL") {
          this.market.tradePolicy.exportForbidden = false;
          this.market.tradePolicy.exportPriceModifier = 0;
        } else if (newPolicy === "BANNED") {
          this.market.tradePolicy.exportForbidden = true;
        }
      }
    },
    toggleAllow(market: ResourceMarket, direction: "import" | "export") {
      if (!market) return;
      if (direction === "import") {
        market.tradePolicy.importForbidden =
          !market.tradePolicy.importForbidden;
      } else if (direction === "export") {
        market.tradePolicy.exportForbidden =
          !market.tradePolicy.exportForbidden;
      }
    },
  },
});
</script>
