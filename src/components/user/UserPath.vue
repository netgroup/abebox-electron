<template>
  <div style="position: relative; height: 100vh;">
    <user-step-1
      @next="handleNext"
      @back="handleBack"
      v-model="formdata"
      v-if="step == 1"
    ></user-step-1>
    <user-step-2
      @next="handleNext"
      @back="handleBack"
      v-else-if="step == 2"
    ></user-step-2>
    <user-step-3
      :saveddata.sync="formdata"
      @next="handleNext"
      @back="handleBack"
      v-else-if="step == 3"
    ></user-step-3>
  </div>
</template>

<script>
import UserStep1 from "./UserStep1.vue";
import UserStep2 from "./UserStep2.vue";
import UserStep3 from "./UserStep3.vue";

export default {
  name: "UserPath",
  components: {
    UserStep1,
    UserStep2,
    UserStep3,
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
        this.$emit("reset");
      }
    },
  },
};
</script>
