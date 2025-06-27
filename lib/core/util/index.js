const fs = require("fs").promises;
const path = require("path");
const cp = require("child_process");
const net = require("net");
const { exec } = require("child_process");

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
const PORT = 9527;

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

async function checkPort(port, host = "localhost") {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err) => {
      if (["EADDRINUSE"].includes(err.code)) {
        resolve({ port, inUse: true });
      } else {
        resolve({ port, inUse: false, error: err.message });
      }
    });

    server.once("listening", () => {
      server.close(() => {
        resolve({ port, inUse: false });
      });
    });

    server.listen(port, host);
  });
}

function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    let command = "";
    let processRegex = "";

    if (process.platform === "win32") {
      // Windows 系统
      command = `netstat -ano | findstr :${port}`;
      processRegex = /LISTENING\s+(\d+)/;
    } else {
      // Linux 或 macOS 系统
      command = `lsof -i :${port}`;
      processRegex = /\s+(\d+)\s+/;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes("no matching processes")) {
          resolve({ port, killed: false, message: "未找到占用端口的进程" });
        } else {
          reject(new Error(`执行命令失败: ${error.message}`));
        }
        return;
      }

      const match = stdout.match(processRegex);
      if (!match) {
        resolve({ port, killed: false, message: "无法识别占用端口的进程ID" });
        return;
      }

      const pid = match[1];
      const killCommand =
        process.platform === "win32"
          ? `taskkill /F /PID ${pid}`
          : `kill -9 ${pid}`;

      exec(killCommand, (killError) => {
        if (killError) {
          reject(new Error(`终止进程 ${pid} 失败: ${killError.message}`));
        } else {
          resolve({ port, killed: true, pid });
        }
      });
    });
  });
}

module.exports = {
  readImg,
  ALL_EXTNAME,
  PORT,
  dirOpen,
  getImgContentType,
  getFileSrc,
  openBrowser,
  checkPort,
  killProcessOnPort,
};
