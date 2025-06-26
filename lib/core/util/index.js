const fs = require("fs").promises;
const path = require("path");
const cp = require("child_process");

const ALL_EXTNAME = [
  ".UFO",
  ".EPS",
  ".AI",
  ".PNG",
  ".HDRI",
  ".RAW",
  ".WMF",
  ".GIF",
  ".FLIC",
  ".EMF",
  ".ICO",
  ".WEBP",
  ".BMP",
  ".PCX",
  ".TIF",
  ".GIF",
  ".JPEG",
  ".JPG",
  ".MP4",
  ".TGA",
  ".EXIF",
  ".FPX",
  ".SVG",
  ".PSD",
  ".CDR",
  ".PCD",
  ".DXF",
];

function getImgContentType(extname) {
  switch (extname.toUpperCase()) {
    case ".SVG":
      return "image/svg+xml";
    default:
      return "image/wpng";
  }
}

async function handleSVG(imgPath) {
  const fileStr = await fs.readFile(imgPath, "utf8");

  if (!fileStr.includes("<symbol")) {
    return;
  }
  const regex = /<symbol\s+[^>]*id="([^"]+)"[^>]*>/g;
  let match;
  const symbolIds = [];

  while ((match = regex.exec(fileStr)) !== null) {
    symbolIds.push(match[1]);
  }

  return { symbolIds, fileStr };
}

async function genImg(imgPath, currentDir) {
  const basename = path.basename(imgPath);
  const extname = path.extname(imgPath);
  const upExtname = extname.toUpperCase();
  const isImgFile = ALL_EXTNAME.includes(upExtname);

  if (!isImgFile) {
    return;
  }

  const { size } = await fs.lstat(imgPath);

  if (upExtname === ".SVG") {
    const { symbolIds, fileStr } = (await handleSVG(imgPath)) ?? {};

    if (fileStr) {
      return {
        size,
        currentDir,
        name: symbolIds,
        path: encodeURIComponent(imgPath),
        type: "SYMBOL_SVG",
        svgNode: encodeURIComponent(fileStr),
      };
    }
  }

  return {
    size,
    currentDir,
    name: basename,
    path: encodeURIComponent(imgPath),
  };
}

async function readImg(dir, callBack) {
  try {
    const files = await fs.readdir(dir);
    for (let file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.lstat(filePath);

      if (stats.isDirectory()) {
        await readImg(filePath, callBack);
      } else {
        callBack(await genImg(filePath, dir));
      }
    }
    return true;
  } catch (e) {
    console.log("readImg - error", e);
  }
}

function getOpenFileManagerOrder(platform) {
  switch (platform) {
    case "win32":
      return "explorer";
    case "darwin":
      return "open";
    default:
      return "xdg-open";
  }
}

function getOpenAppOrder(platform) {
  switch (platform) {
    case "win32":
      return "start";
    case "darwin":
      return "open";
    default:
      return "xdg-open";
  }
}

function dirOpen(filePath) {
  const openCommand = `${getOpenFileManagerOrder(process.platform)} ${filePath}`;

  cp.exec(openCommand, (error) => {
    if (error) {
      console.error(`无法打开文件夹: ${error}`);
    }
  });
}

function openBrowser(url) {
  const openCommand = `${getOpenAppOrder(process.platform)} ${url}`;

  cp.exec(openCommand, (error) => {
    if (error) {
      console.error(`打开浏览器失败: ${error}`);
    }
  });
}

function getFileSrc(requestUrl) {
  const deCodeUrl = decodeURIComponent(requestUrl);

  return ["/", "\\"].includes(deCodeUrl[0])
    ? deCodeUrl.substring(1)
    : deCodeUrl;
}

async function deleteToRecycleBin(filePath) {
  try {
    await trash([filePath]);
    console.log(`文件已移动到系统回收站: ${filePath}`);
  } catch (err) {
    console.error("删除到回收站失败:", err);
  }
}

module.exports = {
  readImg,
  ALL_EXTNAME,
  dirOpen,
  getImgContentType,
  getFileSrc,
  openBrowser,
  deleteToRecycleBin,
};
