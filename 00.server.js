const http = require('http');

const server = http.createServer((req, res) => {
    // 检查请求方法是否为 POST
    if (req.method === 'POST') {
        // 设置响应头，允许跨域请求（可选）
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        // 忽略请求体，因为我们不接收参数
        let body = [];
        req.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            // 返回一个数组
            const responseData = {
                data: [1, 2, 3, 4, 5] // 示例数组
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(responseData));
        });
    } else {
        // 处理其他请求方法
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});