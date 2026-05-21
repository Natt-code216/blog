#!/usr/bin/env node
import net from 'node:net';

const PORTS = [
  { port: 5173, label: '前端 Vite' },
  { port: 1337, label: '后端 Strapi' },
];

function checkPort(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve(false);
        else resolve(false);
      })
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '127.0.0.1');
  });
}

(async () => {
  let allFree = true;
  for (const { port, label } of PORTS) {
    const free = await checkPort(port);
    if (free) {
      console.log(`  [OK]   ${label} :${port} 可用`);
    } else {
      console.log(`  [BUSY] ${label} :${port} 被占用`);
      allFree = false;
    }
  }
  if (!allFree) {
    console.log('\n请释放被占用的端口后重试。');
    process.exit(1);
  }
  console.log('\n端口检查通过，可以启动服务。');
})();
