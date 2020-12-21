const path = require("path"),
  ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

function fileLoader() {
  return {
    limit: 1,
    context: "src",
    name: "[path][name].[ext]",
    publicPath(url) {
      return "/" + url;
    },
  };
}

module.exports = function baseConfig(entry) {
  return {
    mode: "development",
    entry: {
      "mipp~ApiList": entry,
    },
    output: {
      filename: "[name].js",
      path: path.join(process.cwd(), "node_modules/.tmp/apiTypes"),
      libraryTarget: "umd",
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
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          loader: "url-loader",
          options: fileLoader(),
        },
        {
          test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
          loader: "url-loader",
          options: fileLoader(),
        },
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
          loader: "url-loader",
          options: fileLoader(),
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
