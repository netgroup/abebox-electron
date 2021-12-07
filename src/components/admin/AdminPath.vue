<template>
  <div style="position: relative; height: 100vh;">
    <admin-step-1
      @submit="handleSubmit"
      @back="handleBack"
      v-model="formdata"
      v-if="step == 1"
    ></admin-step-1>
    <admin-step-2
      @submit="handleSubmit"
      @back="handleBack"
      v-else-if="step == 2"
    ></admin-step-2>
    <admin-step-3
      @submit="handleSubmit"
      @back="handleBack"
      v-else-if="step == 3"
    ></admin-step-3>
  </div>
</template>

<script>
import AdminStep1 from "./AdminStep1.vue";
import AdminStep2 from "./AdminStep2.vue";
import AdminStep3 from "./AdminStep3.vue";

export default {
  name: "AdminPath",
  components: {
    AdminStep1,
    AdminStep2,
    AdminStep3,
  },
  data: () => ({
    step: 1,
    formdata: {},
  }),
  methods: {
    handleSubmit: function(data) {
      console.log("handleSubmit ", data);
      if (this.step == 1) {
        this.formdata = Object.assign(this.formdata, data);
        this.step = 2;
      } else if (this.step == 2) {
        this.formdata = Object.assign(this.formdata, data);
        this.step = 3;
      }
    },
    handleBack: function(data) {
      if (this.step == 1) {
        this.$emit("reset");
      }
    },
  },
};
</script>
