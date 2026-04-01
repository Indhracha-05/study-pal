const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/log') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const logs = JSON.parse(body);
                const logLine = `[${new Date().toISOString()}] [${logs.type.toUpperCase()}] ${logs.args.join(' ')}\n`;
                fs.appendFileSync('browser_logs.txt', logLine);
            } catch (e) {
                console.error("Failed to parse log", e);
            }
            res.writeHead(200);
            res.end();
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(5174, () => {
    console.log("Console logger listening on 5174");
});
