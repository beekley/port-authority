<template>
  <td>{{ merchant.name }}</td>
  <td>
    <span v-for="[resourceId, count] in merchant.cargo"
      >{{ resourceId.toUpperCase() }}: {{ count }}</span
    >
  </td>
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
  // setup(props) {
  //   const { merchant } = props;
  //   return {};
  // },
});
</script>
