// 1.1.1 複数階層コンテンツのルーティング

const http = require('http');
// const path = require('path'); // path変数は必要ない為削除

const pages = [
  { route: '/', output: 'index page' }, // ''だったrouteに'/'を追加 
  { route: '/about/this', output: 'about this page' },
  { route: '/about/node', output: 'about node page' },
  { route: '/another', output: function() { return `これが ${this.route}` }}
];

const head = {
  'Content-Type': 'text/html; charset=utf-8'
}

http.createServer(function (request, response) {
  const lookup = decodeURI(request.url);  // 変更
  pages.forEach(function(page) {
    if (page.route === lookup) {
      response.writeHead(200, head);
      response.end(typeof page.output === 'function' ? page.output(): page.output);
    }
  });
  if (!response.finished) {
    response.writeHead(404, head);
    response.end('ページが見つかりません');
  }
}).listen(8080);