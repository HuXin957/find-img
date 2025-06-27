const startAction = require("./start");
const stopAction = require("./stop");
const author = require("./author");

module.exports = function (program) {
  program.command("start").alias("run").action(startAction);
  program.command("stop").alias("kill").action(stopAction);
  program.command("author").action(author);
};
