module.exports = {
  transpileDependencies: ["vuetify"],
  configureWebpack: {
    devtool: "source-map",
  },
  pluginOptions: {
    electronBuilder: {
      // List native deps here if they don't work
      externals: ["chokidar"],
    },
  },
};
