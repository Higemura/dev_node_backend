// 1.2.0 サーバーを起動する

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

http.createServer(function (request, response) {
  const lookup = path.basename(decodeURI(request.url)) || 'index.html';
  const f = `public/${lookup}`;
  fs.exists(f, function (exists) {
    console.log(exists ? `${lookup}は存在します` : `${lookup}は存在しません`);
    if (exists) {
      fs.readFile(f, function (error, data) {
        // この中でコンテンツ配信とエラーハンドリングをする
      });
      return;
    }
    response.writeHead(404, head);
    response.end('ページが見つかりません');
  });
}).listen(8080);