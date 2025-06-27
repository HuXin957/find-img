const fs = require("fs");
const path = require("path");
const http = require("http");
const url = require("url");
const querystring = require("querystring");
const trash = require("trash").default;

const {
  dirOpen,
  getImgContentType,
  ALL_EXTNAME,
  getFileSrc,
  openBrowser,
  PORT,
} = require("../util");

module.exports = function initHttp() {
  const server = http.createServer((req, res) => {
    if (req.url === "/") {
      const pagePath = path.join(__dirname, "../", "/public/index.html");

      fs.readFile(pagePath, (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end("Server Error");
        } else {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(data);
        }
      });
      return;
    }

    if (req.url === "/getDirInfo") {
      res.writeHead(200, { "Content-Type": "application/json" });

      res.end(
        JSON.stringify({
          currentPath: process.cwd(),
        }),
      );
      return;
    }

    if (req.url.indexOf("/delImg") === 0) {
      const parsedUrl = url.parse(req.url);
      const queryParams = querystring.parse(parsedUrl.query);
      const fileSrc = getFileSrc(queryParams.imgPath);

      if (fs.existsSync(fileSrc)) {
        // 移动文件到回收站
        trash([fileSrc])
          .then(() => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                code: 200,
                msg: "删除成功",
              }),
            );
          })
          .catch(() => {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end("Server Error");
          });
      } else {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: 500,
            msg: "文件不存在",
          }),
        );
      }
      return;
    }

    if (req.url.indexOf("/open") === 0) {
      const parsedUrl = url.parse(req.url);
      const queryParams = querystring.parse(parsedUrl.query);
      const fileSrc = getFileSrc(queryParams.imgPath);

      dirOpen(path.join(fileSrc, "../"));

      res.writeHead(200);
      res.end("打开成功");
      return;
    }

    //图片请求
    const ext = `.${req.url.split(".")[1]?.toUpperCase()}`;

    if (ALL_EXTNAME.includes(ext)) {
      const fileSrc = getFileSrc(req.url);
      const extname = path.extname(fileSrc);
      const contentType = getImgContentType(extname);

      fs.readFile(fileSrc, (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end("Server Error");
          return;
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      });
    }
  });

  server.listen(PORT, "127.0.0.1", () => {
    openBrowser("http://127.0.0.1:9527");
    console.log("正在访问：http://127.0.0.1:9527");
  });
};
