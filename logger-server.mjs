import http from 'http';
http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    console.log("BROWSER ERROR:", decodeURIComponent(url.searchParams.get('msg') || req.url));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end('ok');
}).listen(9999, () => console.log('Listening on 9999'));
