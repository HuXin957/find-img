const fs = require('fs').promises;
const path = require('path')
const cp = require('child_process');
const os = require('os');

const pathSpilt = process.cwd().split(path.sep)
const imgTag = pathSpilt[pathSpilt.length - 1]
const ALL_EXTNAME = ['.UFO', '.EPS', '.AI', '.PNG', '.HDRI', '.RAW', '.WMF', 'GIF', '.FLIC', '.EMF', '.ICO', '.WEBP', '.BMP', '.PCX', '.TIF', '.GIF', '.JPEG', '.JPG', 'MP4', '.TGA', '.EXIF', '.FPX', '.SVG', '.PSD', '.CDR', '.PCD', '.DXF']

async function genImg(imgPath) {
    const basename = path.basename(imgPath)
    const extname = path.extname(imgPath)

    const isImgFile = ALL_EXTNAME.includes(extname.toUpperCase())

    if (!isImgFile) {
        return
    }
    const {size} = await fs.lstat(imgPath)
    const splitPath = imgPath.split(imgTag)

    return {
        path: encodeURIComponent(imgTag + splitPath[1]),
        name: basename,
        size
    }
}


async function readImg(dir, callBack) {
    let files = await fs.readdir(dir);
    for (let file of files) {
        let filePath = path.join(dir, file);
        let stats = await fs.lstat(filePath);
        if (stats.isDirectory()) {
            await readImg(filePath, callBack);
        } else {
            callBack(await genImg(filePath))
        }
    }
    return true;
}



function dirOpen(filePath){
    const normalizedPath = path.normalize(filePath);
    const platform = process.platform;
    let openCommand;

    if (platform === 'win32') {
        openCommand = `start ${normalizedPath}`;
    } else if (platform === 'darwin') {
        openCommand = `open ${normalizedPath}`;
    } else {
        openCommand = `xdg-open ${normalizedPath}`;
    }

    cp.exec(openCommand, (error) => {
        if (error) {
            console.error(`无法打开文件夹: ${error}`);
            return;
        }
        console.log('文件夹已打开');
    });
}



module.exports = {
    imgTag,
    readImg,
    ALL_EXTNAME,
    dirOpen
}