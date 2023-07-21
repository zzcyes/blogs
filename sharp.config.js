const path = require("path");

const config = function () {
  const entryPathname = "images";
  return {
    entry: path.resolve(__dirname, entryPathname),
    output: path.resolve(__dirname, entryPathname + "_"),
  };
};

module.exports = config;
