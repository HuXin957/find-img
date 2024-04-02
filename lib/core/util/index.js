const fs = require('fs').promises;
const path = require('path')
const cp = require('child_process');

const pathSpilt = process.cwd().split(path.sep)
const imgTag = pathSpilt[pathSpilt.length - 1]
const ALL_EXTNAME = ['.UFO', '.EPS', '.AI', '.PNG', '.HDRI', '.RAW', '.WMF', 'GIF', '.FLIC', '.EMF', '.ICO', '.WEBP', '.BMP', '.PCX', '.TIF', '.GIF', '.JPEG', '.JPG', 'MP4', '.TGA', '.EXIF', '.FPX', '.SVG', '.PSD', '.CDR', '.PCD', '.DXF']

function getImgContentType(extname) {
    switch (extname.toUpperCase()) {
        case '.SVG':
            return 'image/svg+xml'
        default:
            return 'image/wpng'
    }
}

async function genImg(imgPath, currentDir) {
    const basename = path.basename(imgPath)
    const extname = path.extname(imgPath)
    const isImgFile = ALL_EXTNAME.includes(extname.toUpperCase())

    if (!isImgFile) {
        return
    }

    const {size} = await fs.lstat(imgPath)
    const splitPath = imgPath.split(imgTag)

    return {
        size,
        currentDir,
        name: basename,
        path: encodeURIComponent(imgTag + splitPath[1]),
    }
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
                callBack(await genImg(filePath, dir))
            }
        }
        return true;
    } catch (e) {
        console.log('readImg - error', e)
    }
}


function dirOpen(filePath) {
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
    dirOpen,
    getImgContentType
}
