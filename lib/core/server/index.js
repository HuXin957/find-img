const initHttp = require('./http')
const initSocket = require('./ws')

module.exports = function () {
    initHttp()
    initSocket()
}
