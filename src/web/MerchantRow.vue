<template>
  <tr>
    <td>{{ merchant.name }}</td>
    <td>
      <span v-for="[resourceId, count] in merchant.cargo"
        >{{ resourceId.toUpperCase() }}: {{ count }}</span
      >
    </td>
  </tr>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Merchant } from "../merchant";

export default defineComponent({
  props: {
    merchant: {
      type: Object as () => Merchant,
      required: true,
    },
  },
});
</script>
