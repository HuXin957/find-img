
const { PORT,checkPort, killProcessOnPort} = require("../util");

async function stop() {
  try {
    const { inUse } = await checkPort(PORT, "127.0.0.1");

    if (inUse) {
      const result = await killProcessOnPort(PORT);

      if (result.killed) {
        console.log(`终止进程`);
      } else {
        console.log(`释放失败: ${result.message}`);
      }
    }
  } catch (error) {
    console.error(`操作失败: ${error.message}`);
  }
}

module.exports = stop;
