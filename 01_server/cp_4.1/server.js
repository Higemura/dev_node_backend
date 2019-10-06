// 1.4.1 システムをバッファオーバーフローから守る

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
const cache = {
  store: {},
  maxSize: 26214400, // バイト単位 25MB
  maxAge: 5400 * 1000, // ミリ秒単位 1.5時間
  cleanAfter: 7200 * 1000, // ミリ秒単位 2時間
  cleanedAt: 0, // 動的に設定される
  clean: function (now) {
    if (now - this.cleanAfter > this.cleanedAt) {
      this.cleanedAt = now;
      const that = this;
      Object.keys(this.store).forEach(function (file) {
        if (now > that.store[file].timestamp + that.maxAge) {
          delete that.store[file];
        }
      });
    }
  }
};

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
        if (stats.size < cache.maxSize) {
          let bufferOffset = 0;
          cache[f] = {content: new Buffer.alloc(stats.size), timestamp: Date.now() };
          s.on('data', (data) => {
            data.copy(cache.store[f].content, bufferOffset);
            bufferOffset += data.length;
          });
        }
      });
      return;
    }
    response.writeHead(404);
		response.end('ページがみつかりません！');
  });

  cache.clean(Date.now());
}).listen(8080);
