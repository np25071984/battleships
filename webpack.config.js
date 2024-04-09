//webpack.config.js
const path = require('path');

module.exports = {
    mode: "development",
    devtool: "inline-source-map",
    entry: {
        game: "./src/client/client.ts",
        ships: "./src/client/ships-placement.ts",
        tooltips: "./src/client/tooltips.ts"
    },
    output: {
        path: path.resolve(__dirname, './build/client'),
        filename: "[name].js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    module: {
        rules: [
        {
            test: /\.tsx?$/,
            loader: "ts-loader"
        }
    ]
    }
};