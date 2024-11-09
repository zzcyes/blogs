const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const getConfig = require(path.resolve(__dirname, "../sharp.config"));
const config = getConfig();

const defaultQuality = 70;

const shouldLogger = !!process.env.LOGGER;

function moveFile(entry, output) {
  fs.writeFileSync(output, fs.readFileSync(entry));
}

function sharpPNG(entry, output) {
  sharp(entry)
    .png({ quality: defaultQuality, adaptiveFiltering: true })
    .toFile(output);
}

function sharpJPG(entry, output) {
  sharp(entry).jpeg({ quality: defaultQuality }).toFile(output);
}

const initTime = performance.now();

async function batchCompress() {
  if (!fs.existsSync(config.output)) {
    fs.mkdirSync(config.output);
  }
  const libs = fs.readdirSync(config.entry);
  for (let i = 0; i < libs.length; i++) {
    const filename = libs[i];
    await compress(filename, shouldLogger);
  }

  fs.writeFileSync("./sharp.images.log", JSON.stringify(stat.log, null, 4));

  console.debug(
    "compress count:",
    shouldLogger ? stat.log.length : libs.length
  );
  console.debug(
    "compress const:",
    (performance.now() - initTime).toFixed(2) + "ms"
  );
}

const stat = {
  log: [],
};

async function compressHooks(filename, before, after) {
  const extension = path.extname(filename).toLowerCase();
  const entry = path.join(config.entry, filename);
  const output = path.join(config.output, filename);
  const [originStats, originTime] = before?.(entry) ?? [];
  try {
    switch (extension) {
      case ".ico":
        await moveFile(entry, output);
        break;
      case ".png":
        await sharpPNG(entry, output);
        break;
      case ".jpg":
      default:
        await sharpJPG(entry, output);
        break;
    }
  } catch (err) {
    console.log(err);
    await moveFile(entry, output);
  } finally {
    after?.(originStats, originTime, output);
  }
}

async function compress(filename, log) {
  const before = (entry) => {
    // 记录压缩前的文件大小和质量
    return [fs.statSync(entry), performance.now()];
  };
  const after = (originStats, originTime, output) => {
    // 记录压缩后的文件大小和质量
    const compressedStats = fs.statSync(output);
    const compressedSize = compressedStats.size;
    const compressedEndTime = performance.now();
    // 计算压缩比例和压缩时间
    const compressionRatio = (compressedSize / originStats.size) * 100;
    const compressionTime = compressedEndTime - originTime;
    const file = path.basename(output);

    stat.log.push({
      name: file,
      ratio: compressionRatio,
      time: compressionTime,
      originStats,
      compressedStats,
    });

    // 打印压缩信息
    console.log(`${file} - Compression Ratio: ${compressionRatio.toFixed(2)}%`);
    console.log(
      `${file} - Compression Time: ${compressionTime.toFixed(2)} ms\n`
    );
  };
  log ? compressHooks(filename, before, after) : compressHooks(filename);
}

batchCompress();
