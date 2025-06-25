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

function dirOpen(filePath) {
  const platform = process.platform;
  let openCommand;

  if (platform === "win32") {
    openCommand = `start ${filePath}`;
  } else if (platform === "darwin") {
    openCommand = `open ${filePath}`;
  } else {
    openCommand = `xdg-open ${filePath}`;
  }

  cp.exec(openCommand, (error) => {
    if (error) {
      console.error(`无法打开文件夹: ${error}`);
    }
  });
}

module.exports = {
  readImg,
  ALL_EXTNAME,
  dirOpen,
  getImgContentType,
};
