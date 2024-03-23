const startAction = require('./start')
const stopAction = require('./stop')

module.exports = function (program) {
    program.command('start').alias('run').action(startAction)
    program.command('stop').alias('kill').action(stopAction)
}
