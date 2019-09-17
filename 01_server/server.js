// 1.1.0 サーバーを起動する

const http = require('http');
const path = require('path');

const pages = [
  { route: '', output: 'index page' },
  { route: 'about', output: 'about page' },
  { route: 'another', output: function() { return `これが ${this.route}` }}
];

const head = {
  'Content-Type': 'text/html; charset=utf-8'
}

http.createServer(function (request, response) {
  const lookup = path.basename(decodeURI(request.url));
  pages.forEach(function(page) {
    console.log(page.route);
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