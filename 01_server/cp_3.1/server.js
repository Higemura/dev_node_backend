// 1.3.1 コンテンツの変更を反映する

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


const cacheAndDeliver = (f, cb) => {
  console.log(cb);

  fs.stat(f, (error, stats) => {
    const lastChanged = Date.parse(stats.ctime);
    const isUpdated = (cache[f]) && lastChanged > cache[f].timestamp;
  
    if (!cache[f] || isUpdated) {
      fs.readFile(f, (error, data) => {
        console.log(`${f} をファイルから読み込みます。`);
        if (!error) {
          cache[f] = {
            content: data,
            timestamp: Date.now(),
          };
        }
        cb(error, data);
      });
      return;
    }
    console.log(`${f} をキャッシュから読み込みます。`);
    cb(null, cache[f].content);
  });
}

http.createServer((request, response) => {
  const lookup = path.basename(decodeURI(request.url)) || 'index.html';
  const f = `public/${lookup}`;
  fs.exists(f, (exists) => {
    console.log(exists ? `${lookup}は存在します。` : `${lookup}は存在しません。`);
    if (exists) {
      cacheAndDeliver(f, (error, data) => {
        // この中でコンテンツ配信とエラーハンドリングをする
        cache[f] = {
          content: data,
          timestamp: Date.now()
        }
        if (error) {
          response.writeHead(500);
          response.end('Server Error!');
          return;
        }
        const headers = {'Content-Type': mimeTypes[path.extname(f)]};
        response.writeHead(200, headers);
        response.end(data);
      });
      return; //returnがfs.readFile関数の外に書いてあることの注意する。 fs.existsがtrueだった場合後に続く404などを実行させないようにreturnを入れている。
    }
    response.writeHead(404, head);
    response.end('ページが見つかりません');
  });
}).listen(8080);

// このやり方だとクライアントがサーバーにリクエストを送るたびにI/Oコールが発生してしまい、、ファイルが大きい場合にコストがかかる。