<template>
  <div style="position: relative; height: 100vh;">
    <start v-if="status == 0" @select="handlePathSelection"></start>
    <user-path
      v-else-if="status == 1"
      @done="handleRegistrationDone"
      @reset="handleReset"
    ></user-path>
    <admin-path
      v-else-if="status == 2"
      @done="handleRegistrationDone"
    ></admin-path>
  </div>
</template>

<script>
import Start from "./StartPage.vue";
import UserPath from "../components/user/UserPath.vue";
import AdminPath from "../components/admin/AdminPath.vue";

export default {
  data: () => ({
    formdata: {},
    status: 0,
  }),
  name: "Registration",
  components: {
    UserPath,
    AdminPath,
    Start,
  },
  mounted() {
    console.log("APP: MLOUNTED");
  },
  methods: {
    handlePathSelection(path) {
      console.log("handlePathSelection", path);
      if (path == "admin") {
        this.status = 2;
      } else {
        this.status = 1;
      }
    },
    handleRegistrationDone(conf) {
      console.log("handleRegistrationDone ", conf); // the full configurqtion submitted
      this.$emit("registered", conf);
    },
    handleReset() {
      console.log("handleReset ", handleReset); // the full configurqtion submitted
      this.status = 0;
    },
  },
};
</script>
