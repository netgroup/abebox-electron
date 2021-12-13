<template>
  <div style="position: relative; height: 100vh;">
    <admin-step-1
      :formdata.sync="formdata"
      @next="handleNext"
      @back="handleBack"
      v-if="step == 1"
    ></admin-step-1>
    <admin-step-2
      :formdata.sync="formdata"
      @next="handleNext"
      @back="handleBack"
      v-else-if="step == 2"
    ></admin-step-2>
    <admin-step-3
      :formdata.sync="formdata"
      @next="handleNext"
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
  created: function() {
    this.step = 1;
    this.formdata = {};
  },
  methods: {
    handleNext: function(data) {
      if (this.step == 1) {
        this.formdata = Object.assign(this.formdata, data);
        this.step = 2;
      } else if (this.step == 2) {
        this.formdata = Object.assign(this.formdata, data);
        this.step = 3;
      } else if (this.step == 3) {
        const all_data = Object.assign(this.formdata, data);
        this.$emit("done", all_data);
      }
      console.log("handleSubmit ", data);
    },
    handleBack: function(data) {
      if (this.step == 1) {
        this.formdata = {};
        this.$emit("reset");
      } else if (this.step == 2) {
        this.step = 1;
      } else if (this.step == 3) {
        this.step = 2;
      }
    },
    handleReset: function() {
      this.formdata = {};
      this.$emit("reset");
    },
  },
};
</script>
