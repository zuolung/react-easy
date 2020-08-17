const htmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./src/index.js",
  mode: 'development',
  optimization: {
    minimize: false
  },
  output: {
    // 打包好的文件存放在哪里，以及怎么命名
    path: path.join(__dirname, '/dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env"],
            plugins: [
              [
                "@babel/plugin-transform-react-jsx",
                { progma: "createElement" }
              ]
            ]
          }
        },
      },
      // {
      //   test: /\.css$/,
      //   loader: ['style-loader', 'css-loader']
      // },
    ],
  },
  plugins: [
    new htmlWebpackPlugin({
      template: './src/index.html',
      filename: './index.html',
    }),
  ]
}