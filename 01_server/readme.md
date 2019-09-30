## Node.jsの特徴
Webサーバーとアプリケーションの間の垣根がなくWebサーバーに臨む動作を設定ファイルに一つ一つ長々と各ツナ寝る必要がない。


## URLルーティングの設定をする
Nodeで生成したWebサーバーを通じてコンテンツを配信するためにURIでアクセスできるように設定する必要があります。
HTTPサーバーの生成と、サーバーへのリクエストに応じたコンテンツの配信を行います。

### 準備


### サーバー起動する
Webサーバーを起動するためにhttpモジュールをrequireで読み込んでおく。
読み込んだhttpモジュールを呼び出してhttp.createServerメソッドでサーバーを生成し起動できます。
```
// httpモジュール読み込み
const http = require('http');

// サーバー生成
http.createServer(function (request, response) {
  // head要素を生成
  response.writeHead(200, {'Content-Type': 'text/html'});
  // 内容
  response.end('index page');
}).listen(8080);
```

```
$ node server.js
```

localhost:8080 にブラウザでアクセスすると `index page` と表示されます。

## ルーターを設定する
サーバーの起動はできましたが、現状のコードだと localhost:8080/about などの他のパスにアクセスしても同様に `index page` と表示されてしまいます。
リクエストURLに応じて適切なコンテンツを表示するためにURLルーティングを設定する必要があります。


以下の太文字部分を変更していきます。
まずはpathモジュールでパスのbasenameを抽出して、decodeURIを使ってクライアントから送信されたURIをデコードします。

```
const http = require('http');
const path = require('path'); // 追加

const pages = [
    { route: '', output: 'index page' },
    { route: 'about', output: 'about page' },
    { route: 'contact', output: 'contact page' }
]

http.createServer(function (request, response) {
  const lookup = path.basename(decodeURI(request.url)); // 追加
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end('Hello');
}).listen(8080);
```

次に各ルートを設定します。
ページ用の配列を定義しhttp.createServer宣言の手前で宣言します。

```
const pages = [
  { route: '', output: 'index page' },
  { route: 'about', output: 'about page' },
  { route: 'contact', output: function() { return `これが` + this.route; }}
];

http.createServer(function (request, response) {
  ....
```

pages配列の各オブジェクトに設定されている、routeプロパティの値がlookup変数の値（URIのbasename）と一致するかどうかをforeach内で判定します。
一致する要素があればそのオブジェクトのプロパティの値を返します。
マッチしない場合に備えて404 NotFoundコンテンツも設定しておきます。

```
const http = require('http');
const path = require('path');

const pages = [
  { route: '', output: 'index page' },
  { route: 'about', output: 'about page' },
  { route: 'contact', output: function() { return `これが ${this.route}` }}
];

const head = {
  'Content-Type': 'text/html; charset=utf-8'
}

http.createServer(function (request, response) {
  const lookup = path.basename(decodeURI(request.url));
  // 追加
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
  // 追加ここまで
}).listen(8080);
```



### 1.1.1複数階層コンテンツのルーティング
これで/aboutなどのルーティング設定ができました。
しかしこのままだと/about/hogeや/about/fugaなどの複数階層のパスにアクセスすると404に飛んでしまいます。
複数階層のパスに対応させるためには、path.basenameの代わりにrequest.urlを渡します。

```
const http = require('http');
// const path = require('path'); // path変数は必要ない為削除

const pages = [
  { route: '/', output: 'index page' }, // ''だったrouteに'/'を追加 
  { route: '/about/this', output: 'about/this page' },
  { route: '/about/node', output: 'about/node page' },
  { route: '/another', output: function() { return `これが ${this.route}` }}
];

http.createServer(function (request, response) {
  const lookup = decodeURI(request.url);  // 変更
```


### 1.1.2 クエリストリングを解析する
urlモジュールとquerystringモジュールという有用なNodeコアモジュールがあります。
urlモジュールには、URL文字列を解析してURLオブジェクトを返すurl.parseメセッドがあります。
このメソッドは3つのパラメーターを持っています。
よく利用する先頭2つのパラメーターのうち1つめURL文字列、parseQueryStringというBooleanパラメーターでtrueが設定されているとurl.parseの実行時にqueryStringモジュールが自動的に呼び出されてクエストリングをオブジェクトに格納できます。

```
const http = require('http');
const url = require('url');　// urlモジュール読み込み追加

const pages = [
  { id: '1', route: '/', output: 'index page' }, // idをそれぞれ追加
  { id: '2', route: '/about/this', output: 'about this page' },
  { id: '3', route: '/about/node', output: 'about node page' },
  { id: '4', route: '/another', output: function() { return `これが ${this.route}` }}
];

const head = {
  'Content-Type': 'text/html; charset=utf-8'
}

http.createServer(function (request, response) {
  const id = url.parse(decodeURI(request.url), true).query.id; // 追加
  if (id) { // idが存在していたら
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
```

これでlocalhost:8080/?id=2 のようにURLにリクエストURLにクエストリングを追加することによって該当するidプロパティを持ったコンテンツにアクセスすることができます。



### 1.2.0 スタティックファイルを配信する
サーバーのファイルシステムに格納されて居る情報をコンテンツとして配信したい場合にはfsモジュールを利用してコンテンツを取得し、createServerのコールバックを通して配信できます。

まずはserver.jsというファイルを作成しておきます。
そしてserver.jsと同じディレクトリにpublicというディレクトリを作成し以下の3つのファイルを作成しておきます。

#### ファイル配置図
```
server.js
public
∟ index.html
∟ style.css
∟ script.js
```

```
// public/index.html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>ページタイトル！</title>
  <link rel="stylesheet" href="style.css">
  <script src="script.js"></script>
</head>
<body>
  <h1 id="title">表示されたよ！</h1>
</body>
</html>
```

```
// public/style.css
#title {
  font-size: 5em;
  background-color: #000;
  color: #fff;
}
```

```
// public/script.js
window.onload = function() { alert('ページタイトル！') };
```

##### server.js
```
const http = require('http');
const path = require('path');
const fs = require('fs');

const head = {
  'Content-Type': 'text/html; charset=utf-8'
}

http.createServer(function (request, response) {
  const lookup = path.basename(decodeURI(request.url)) || 'index.html';
  const f = `public/${lookup}`;
  fs.exists(f, function (exists) {
    console.log(exists ? `${lookup}は存在します` : `${lookup}は存在しません`);
  });
}).listen(8080);
```

ここでWebブラウザからlocalhost:8080/script.js にアクセスしてみると、ブラウザ側には「このページは動作していません」と表示されますが、
node server.jsで起動したターミナル上に「script.jsは存在します」と表示されればOKです。
またlocalhost:8080/fooなどpublic内に作成していないファイル名などでアクセスすると、当然ファイルは存在しないため「fooは存在しません」とコンソールに表示されます。


実際にファイルを配信する前に、クライアントにContent-Typeを知らせる必要があります。
Content-Typeはファイルの拡張子から判断することができるのでマッピング用のオブジェクトを作ります。

```
const mimeTypes = {
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.css': 'text/css'
}
```


```
http.createServer((request, response) => {
  const lookup = path.basename(decodeURI(request.url)) || 'index.html';
  const f = `public/${lookup}`;
  fs.exists(f, (exists) => {
    console.log(exists ? `${lookup}は存在します` : `${lookup}は存在しません`);
    if (exists) {
      fs.readFile(f, (error, data) => {
        // この中でコンテンツ配信とエラーハンドリングをする
      });
      return;
    }
    response.writeHead(404, head);
    response.end('ページが見つかりません');
  });
}).listen(8080);
```

上記でコンテンツを配信する下準備が整いました。
コンテンツ配信をするためにfs.readFileのコールバック関数にレスポンスの生成を入れ込み、コールバック関数に渡されたデータをレスポンスに渡します。



### 1.2.1 予期しないFaviconリクエストに対応する
ブラウザを使用してサーバースクリプトをテストする際、予期ないリクエストが送られる場合がある。
このような場合の多くはブラウザがfavicon.icoのアイコンファイルをリクエストしているもので通常は問題ない。
もしfaviconが存在しないことで何らかの問題を引き起こす場合は以下のコードを入れる

```
if (request.url === '/favicon.ico') {
  response.end();
  return;
}
```
このコードは空のレスポンスを返すが、ブラウザに対してより礼儀正しく振る舞う場合はresponse.writeHead(404)をresponse.endの前に記述して、404エラーを返すようにする。



### 1.3 コンテンツキャッシュによる高速配信
クライアントがサーバーにアクセスするたびにストレージから直接ファイルを読み込む方法は最適とは言えません。
今回は、最初のリクエスト時のみストレージに直接アクセスし、メモリにデータをキャッシュすることによって、2回目以降のリクエストに対するコンテンツをメモリから配信する方法を実装します。

コンテンツをメモリ領域に記憶するためのcacheオブジェクトと、cacheAndDliver関数を宣言しておきます。
cacheAndDliver関数にはfs.readFileと同じパラメーターを設定しておきます。
こうすることでhttp.createServerの中身のfs.readFileの関数名をcacheAndDliverに変えるだけで他はそのままの状態で置き換えられます。

```
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

// キャッシュ生成
const cacheAndDeliver = (f, cb) => {
  console.log(cb);
  if (!cache[f]) {
    fs.readFile(f, (error, data) => {
      if (!error) {
        cache[f] = { content: data };
      }
      cb(error, data);
    });
    return;
  }
  console.log(`${f} をキャッシュから読み込みます。`);
  cb(null, cache[f].content);
}

http.createServer((request, response) => {
  const lookup = path.basename(decodeURI(request.url)) || 'index.html';
  const f = `public/${lookup}`;
  fs.exists(f, (exists) => {
    console.log(exists ? `${lookup}は存在します。` : `${lookup}は存在しません。`);
    if (exists) {
      cacheAndDeliver(f, (error, data) => { // 書き換え
        // この中でコンテンツ配信とエラーハンドリングをする
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
```


上記の修正をしたら node server.js でサーバーを起動してみます。
初回のアクセスは「〜が存在します。」とコンソールに出力されるが、2回目以降のアクセスは「〜をキャッシュから読み込みます。」とコンソールに出力されます。

### 解説
ファイル名とコールバック関数をパラメーターに持つcacheAndDeliver関数を定義しました。
関数にfs.readFileと同じパラメーターを設定することにより、fs.readFileのコールバック関数がcacheAndDeliverでもそのまま利用できます。
したがってコードの体裁を大きく変えずにキャッシュのロジックをそのまま利用できます。
cacheAndDeliver関数はまずリクエストされたコンテンツがすでにキャッシュに存在するかどうかを確認します。
最初のリクエストはまだキャッシュに存在しないため、fs.readFileで直接ファイルにアクセスしデータを取得します。
このデータはレスポンスとしてクライアントに配信されますが、同時にお明日と関連づけられてcacheオブジェクトに格納されます。
次回誰かが同じコンテンツにリクエストを送った場合、cacheAndDeliverはサイドcacheオブジェクトの中身を確認し、コンテンツがすでにキャッシュされていないかどうかを確認します。
今度はキャッシュされたコンテンツが存在するため、コールバック関数にキャッシュから取得したコンンテンツを渡します。
新しいコンテンツを取得するたびにcache[f]にオブジェクト型でコンテンツを格納していることに注目してください。
こうすることにより将来cache[f]オブジェクトに新しいプロパティを追加することができます。
そして、新しいプロパティのデータを必要に応じて処理するロジックを追加するだけで、キャッシュの機能を自由に拡張できます。

