const { version } = require("../../../package.json");

module.exports = function (program) {
  program
    .version(version, "-v, --version", "版本号")
    .name("findImg")
    .usage("[global options] command")
    .helpOption("-h, --help", "帮助")
    .option("start, run", "启动")
    .option("stop, kill", "停止")
    .option("author", "作者信息");
};
