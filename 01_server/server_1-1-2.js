// 1.1.2 クエリストリングを解析する

const http = require('http');
const url = require('url');

const pages = [
  { id: '1', route: '/', output: 'index page' }, // ''だったrouteに'/'を追加 
  { id: '2', route: '/about/this', output: 'about this page' },
  { id: '3', route: '/about/node', output: 'about node page' },
  { id: '4', route: '/another', output: function() { return `これが ${this.route}` }}
];

const head = {
  'Content-Type': 'text/html; charset=utf-8'
}

http.createServer(function (request, response) {
  const id = url.parse(decodeURI(request.url), true).query.id;
  if (id) {
    pages.forEach(function(page) {
      if (page.id === id) {
        response.writeHead(200, head);
        response.end(typeof page.output === 'function' ? page.output(): page.output);
      }
    });
  }
  if (!response.finished) {
    response.writeHead(404, head);
    response.end('ページが見つかりません');
  }
}).listen(8080);