const path = require("path");

module.exports = {
  /*  configureWebpack: {
    target: 'electron-renderer',
    node: {
      __dirname: false,
    },
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: 'node-loader',
        },
      ],
    }, 
  }, */
  configureWebpack: {
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: "native-ext-loader",
          options: {
            rewritePath: path.resolve(__dirname, "src/abebox-core/rabejs"),
          },
        },
      ],
    },
  },

  /*
  chainWebpack: config => {
    config.module  
	.rule('node')
        .test(/\.node$/)
        .use('node-loader')
          .loader('node-loader')
          .end()
 }, */
  pluginOptions: {
    electronBuilder: {
      /*directories: {
        buildResources: "build",
      },*/
      nodeIntegration: true,
      //files: ["build/**/*"],
      /*mac: {
        target: [
          {
            target: "dmg",
            arch: ["x64", "arm64", "universal"],
          },
        ],
        category: "public.app-category.utilities",
      },*/
      dmg: {
        icon: "build/icons/icon.icns",
      },

      chainWebpackMainProcess: (config) => {
        config.module
          .rule("node")
          .test(/\.node$/)
          .use("node-loader")
          .loader("node-loader")
          .end();
      },
    },
  },
};
