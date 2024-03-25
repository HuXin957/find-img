const fs = require('fs')
const path = require('path')
const http = require('http')
const cp = require('child_process');
const url = require('url');
const querystring = require('querystring');
const {imgTag, dirOpen, getImgContentType} = require('../util')

const PORT = 9527


module.exports = function initHttp() {
    const server = http.createServer((req, res) => {
        if (req.url === '/') {
            const pagePath = path.join(__dirname, '../', '/public/index.html');

            fs.readFile(pagePath, (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Server Error');
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                    res.end(data);
                }
            });
        }

        if (req.url === '/getDirInfo') {
            res.writeHead(200, {'Content-Type': 'application/json'});

            res.end(JSON.stringify({
                currentPath: process.cwd()
            }));
        }

        if (req.url.indexOf('/delImg') === 0) {
            const parsedUrl = url.parse(req.url);
            const queryParams = querystring.parse(parsedUrl.query);
            const imgPath = decodeURIComponent(queryParams.imgPath)
            const delPath = path.join(process.cwd(), '../', imgPath)

            if (fs.existsSync(delPath)) {
                const err = fs.unlinkSync(delPath)
                if (err) {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end('Server Error');
                } else {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        code: 200,
                        msg: '删除成功'
                    }));
                }
            } else {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    code: 500,
                    msg: '文件不存在'
                }));
            }
        }

        if (req.url.indexOf('/open') === 0) {
            const parsedUrl = url.parse(req.url);
            const queryParams = querystring.parse(parsedUrl.query);
            const openPath = path.join(process.cwd(), '../', queryParams.imgPath)
            dirOpen(openPath)

            res.writeHead(200);
            res.end('打开成功');
        }


        //图片请求
        if (req.url.includes(imgTag)) {
            const deCodeUrl = decodeURIComponent(req.url)
            const imgPath = path.join(process.cwd(), '../', deCodeUrl)
            const extname = path.extname(imgPath)
            const contentType = getImgContentType(extname)

            res.writeHead(200, {'Content-Type': contentType});
            fs.readFile(imgPath, (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Server Error');
                }
                res.end(data)
            })
        }
    })

    server.listen(PORT, '127.0.0.1', () => {
        cp.exec('start http://127.0.0.1:9527');
    })
}
