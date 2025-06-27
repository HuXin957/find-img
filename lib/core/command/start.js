const server = require("../server");
const { checkPort, killProcessOnPort, PORT } = require("../util");

async function start() {
  try {
    const { inUse } = await checkPort(PORT, "127.0.0.1");

    if (inUse) {
      const result = await killProcessOnPort(PORT);

      if (result.killed) {
        server();
      } else {
        console.log(`终止进程失败: ${result.message}`);
      }
    } else {
      server();
    }
  } catch (e) {
    console.log("启动失败: ", e);
  }
}

module.exports = start;
