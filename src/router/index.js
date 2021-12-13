import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import Users from "../views/Users.vue";
import Attributes from "../views/Attributes.vue";
import Documents from "../views/Documents.vue";
import Repository from "../views/Repository.vue";

Vue.use(VueRouter);

const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch((error) => {});
};

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/docs",
    name: "Documents",
    component: Documents,
  },
  {
    path: "/attrs",
    name: "Attributes",
    component: Attributes,
  },
  ,
  {
    path: "/users",
    name: "Users",
    component: Users,
  },
];

const router = new VueRouter({
  mode: process.env.IS_ELECTRON ? "hash" : "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
