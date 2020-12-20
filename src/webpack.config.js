const path = require("path"),
  ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = function baseConfig(entry) {
  return {
    mode: "development",
    entry: {
      "mipp~ApiList": entry,
    },
    output: {
      filename: "[name].js",
      path: path.join(process.cwd(), "node_modules/.tmp/apiTypes"),
    },
    devtool: false,
    resolve: {
      mainFields: ["module", "main"],
      aliasFields: ["module", "main"],
      extensions: [".ts", ".tsx", ".js", ".json"],
    },
    target: "node",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
                compilerOptions: {
                  module: "es2015",
                  lib: ["es6", "es7"],
                  target: "esnext",
                },
              },
            },
          ],
          exclude: /(node_modules)/,
        },
      ],
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: path.resolve(process.cwd(), "./tsconfig.json"),
        },
      }),
    ],
  };
};
