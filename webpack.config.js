//webpack.config.js
const path = require('path');

module.exports = {
    mode: "development",
    devtool: "inline-source-map",
    entry: {
        main: "./src/client/client.ts",
    },
        output: {
            path: path.resolve(__dirname, './build/client'),
            filename: "client.js"
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