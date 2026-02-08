<template>
  <tr>
    <td>{{ market.resourceId.toUpperCase() }}</td>
    <td>{{ market.stock.toFixed(0) }}</td>
    <td>${{ market.price.toFixed(2) }}</td>
    <td>
      <button @click="toggleAllow(market, 'import')">
        {{ market.tradePolicy.importForbidden ? "Banned" : "Allowed" }}
      </button>
    </td>
    <td>
      <button @click="toggleAllow(market, 'export')">
        {{ market.tradePolicy.exportForbidden ? "Banned" : "Allowed" }}
      </button>
    </td>
  </tr>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ResourceMarket } from "../market";
import { resourceDefs } from "../market.data";
import { ResourceID } from "../types";

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
    };
  },
  methods: {
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
