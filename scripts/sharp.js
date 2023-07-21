const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const getConfig = require(path.resolve(__dirname, "../sharp.config"));

const config = getConfig();

function compress(filename) {
  const enrty = path.join(config.entry, filename);
  const output = path.join(config.output, filename);
  sharp(enrty).jpeg({ quality: 80 }).toFile(output);
}

async function batchCompress() {
  if (!fs.existsSync(config.output)) {
    fs.mkdirSync(config.output);
  }
  const libs = fs.readdirSync(config.entry);
  for (let i = 0; i < libs.length; i++) {
    compress(libs[i]);
  }
}

batchCompress();
