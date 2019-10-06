// 1.4.0 ストリーミングによりパフォーマンスを最適化する

const http = require('http');
const path = require('path');
const fs = require('fs');

const head = {
  'Content-Type': 'text/html; charset=utf-8'
}

const mimeTypes = {
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.css': 'text/css'
}

// キャッシュ格納用オブジェクト
const cache = {};

http.createServer((request, response) => {
  const lookup = path.basename(decodeURI(request.url)) || 'index.html';
  const f = `public/${lookup}`;

  fs.exists(f, (exists) => {
    if (exists) {
      const headers = { 'Content-Type': `${mimeTypes[path.extname(f)]}; charset=utf-8` };
      if (cache[f]) {
        response.writeHead(200, headers);
        response.end(cache[f].content);
        return;
      }

      const s = fs.createReadStream(f).once('open', function(f) {
        response.writeHead(200, headers);
        this.pipe(response);
      })
      .once('error', (e) => {
        console.log(e);
        response.writeHead(500);
        response.end('サーバーエラー！');
      });

      fs.stat(f, (error, stats) => {
        let bufferOffset = 0;
        cache[f] = {content: new Buffer.alloc(stats.size)};
        s.on('data', (data) => {
          data.copy(cache[f].content, bufferOffset);
          bufferOffset += data.length;
        });
      });
      return;
    }
    response.writeHead(404);
		response.end('ページがみつかりません！');
  });
}).listen(8080);
