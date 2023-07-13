const http = require('http');
const url = require('url');
const MotdBE = require('./MotdBEAPI').default;
const MotdJE = require('./MotdJEAPI').default;

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const query = parsedUrl.query;

  // 处理 /api/be 路由
  if (path === '/api/be') {
    const host = query.host || '';

    // 检查 host 中的 IP 地址和端口号是否有效
    let [hostAddress, hostPort] = host.split(':');

    if (isNaN(hostPort)) {
      hostPort = 19132; // 默认端口号 19132
    }

    if (parseInt(hostPort) < 1 || parseInt(hostPort) > 65535) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid port number');
      return;
    }

    // 设置超时时间（单位：毫秒）
    const timeout = 5000; // 5秒

    // 调用 MotdBE 函数获取 MotdBE 信息
    const motdPromise = MotdBE(`${hostAddress}:${hostPort}`);

    // 设置超时定时器
    const timeoutTimer = setTimeout(() => {
      res.writeHead(504, { 'Content-Type': 'text/plain' });
      res.end('Request timed out');
    }, timeout);

    // 处理 MotdBE 信息获取成功的情况
    motdPromise
      .then((motdInfo) => {
        clearTimeout(timeoutTimer); // 清除超时定时器

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(motdInfo));
      })
      .catch((err) => {
        clearTimeout(timeoutTimer); // 清除超时定时器

        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error: ${err}`);
      });
  } else if (path === '/api/je') {
    const host = query.host || '';

    // 检查 host 中的 IP 地址和端口号是否有效
    let [hostAddress, hostPort] = host.split(':');

    if (isNaN(hostPort)) {
      hostPort = 25565; // 默认端口号 25565
    }

    if (parseInt(hostPort) < 1 || parseInt(hostPort) > 65535) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid port number');
      return;
    }

    // 设置超时时间（单位：毫秒）
    const timeout = 5000; // 5秒

    // 调用 MotdJE 函数获取 MotdJE 信息
    const motdPromise = MotdJE(`${hostAddress}:${hostPort}`);

    // 设置超时定时器
    const timeoutTimer = setTimeout(() => {
      res.writeHead(504, { 'Content-Type': 'text/plain' });
      res.end('Request timed out');
    }, timeout);

    // 处理 MotdJE 信息获取成功的情况
    motdPromise
      .then((motdInfo) => {
        clearTimeout(timeoutTimer); // 清除超时定时器

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(motdInfo));
      })
      .catch((err) => {
        clearTimeout(timeoutTimer); // 清除超时定时器

        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error: ${err}`);
      });
  } else {
    // 未知路由
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

// 启动服务器监听指定端口
const port = 3000;

// 检查端口号是否在有效范围内
if (port < 1 || port > 65535) {
  console.error('Invalid port number. Please specify a port between 1 and 65535.');
} else {
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
