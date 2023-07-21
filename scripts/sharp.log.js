const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const getConfig = require(path.resolve(__dirname, "../sharp.config"));
const config = getConfig();

// 压缩图片函数
async function compressImage(inputPath, outputPath) {
  await sharp(inputPath).jpeg({ quality: 70 }).toFile(outputPath);
}

// 获取图片质量信息函数
async function getImageQuality(imagePath) {
  const start = Date.now();
  const info = await sharp(imagePath).toBuffer();
  const end = Date.now();
  return { time: end - start, size: info.length };
}

async function main() {
  if (!fs.existsSync(config.output)) {
    fs.mkdirSync(config.output);
  }
  const stat = {
    log: [],
  };
  // 获取目录下的所有图片文件名
  const files = fs.readdirSync(config.entry);

  // 遍历每个图片文件
  for (const file of files) {
    const inputPath = path.join(config.entry, file);
    const outputPath = path.join(config.output, file);

    if (file.slice(-4) === ".ico") {
      fs.writeFileSync(inputPath, fs.readFileSync(outputPath));
      continue;
    }

    // 记录压缩前的文件大小和质量
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;
    const originalQuality = await getImageQuality(inputPath);

    // 压缩图片
    await compressImage(inputPath, outputPath);

    // 记录压缩后的文件大小和质量
    const compressedStats = fs.statSync(outputPath);
    const compressedSize = compressedStats.size;
    const compressedQuality = await getImageQuality(outputPath);

    // 计算压缩比例和压缩时间
    const compressionRatio = (compressedSize / originalSize) * 100;
    const compressionTime = compressedQuality.time - originalQuality.time;

    stat.log.push({
      name: file,
      ratio: compressionRatio,
      time: compressionTime,
      originalStats,
      compressedStats,
    });

    // 打印压缩信息
    console.log(`${file} - Compression Ratio: ${compressionRatio.toFixed(2)}%`);
    console.log(
      `${file} - Compression Time: ${compressionTime.toFixed(2)} ms\n`
    );
  }

  fs.writeFileSync("./sharp.images.log", JSON.stringify(stat.log, null, 4));
}

main();
