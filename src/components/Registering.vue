<template>
  <div style="position: relative; height: 100vh;">
    <v-progress-circular
      style="position: absolute; top: 30%; left:40%;"
      :size="70"
      :width="9"
      color="red"
      indeterminate
      v-if="!success"
    ></v-progress-circular>
    <div>Successo <v-btn @click="$emit('start')">Start</v-btn></div>
  </div>
</template>

<script>
export default {
  props: ["success"],
  name: "Registering",
  data: () => ({}),
};
</script>
