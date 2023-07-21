const path = require("path");

const config = function () {
  const entryPathname = "images";
  return {
    entry: path.resolve(__dirname, entryPathname),
    output: path.resolve(__dirname, entryPathname + "_compressed"),
  };
};

module.exports = config;
