const ws = require('nodejs-websocket')
const {readImg} = require('../util')

const PORT = 8848
const WS_EVENT_TYPE = {
    GET_IMAGE: 'GET_IMAGE'
}

//返参
//requestId, eventType, data, done

async function handleGetImage(eventType, requestId, send) {
    const isDone = await readImg(process.cwd(), (data) => {
        if (data) {
            const res = {
                eventType,
                requestId,
                data: [data],
            }
            send(JSON.stringify(res))
        }
    })
    if (isDone) {
        console.log('搜索完成')
        send(JSON.stringify({eventType, requestId, data: [], done: true}))
    }
}

function onMessage(msg, send) {
    const {eventType, requestId} = JSON.parse(msg)

    if (eventType === WS_EVENT_TYPE.GET_IMAGE) {
        handleGetImage(eventType, requestId, send)
    }
}

module.exports = function initSocket() {
    const server = ws.createServer(function (socket) {
        const send = (text) => {
            socket.sendText(text)
        }
        // 接收到消息时候的数据
        socket.on('text', (msg) => {
            onMessage(msg, send)
        })

        // 进入ws
        socket.on('connect', (code) => {
            // console.log('已经链接上ws服务------' + code)
        })

        // 异常关闭
        socket.on('error', (code) => {
            // console.log('异常关闭------' + code)
        })

        // 关闭
        socket.on('close', (code) => {
            // console.log('退出ws链接服务----' + code)
        })

    })


    server.on('error', (err) => {
        console.log('socket error', err)
    })

    server.listen(PORT, () => {
        // console.log('socket server start');
    })
}
