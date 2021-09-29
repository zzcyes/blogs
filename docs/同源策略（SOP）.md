# 同源策略（SOP）

## 概念

**同源策略**（same-origin policy）是指在Web浏览器中，允许某个网页脚本访问另一个网页的数据，但前提是这两个网页必须有相同的**URI**、**主机名**和**端口号**，一旦两个网站满足上述条件，这两个网站就被认定为具有相同来源。

此策略可防止某个网页上的恶意脚本通过该页面的文档对象模型访问另一网页上的敏感数据。同源策略对Web应用程序具有特殊意义，因为Web应用程序广泛依赖于**HTTP cookie来维持用户会话**，所以**必须将不相关网站严格分隔**，以防止丢失数据泄露。

值得注意的是**同源策略仅适用于脚本**，这意味着某网站可以通过相应的HTML标签访问不同来源网站上的图像、CSS和动态加载脚本等资源。而**跨站请求伪造**就是利用同源策略不适用于HTML标签的缺陷。

## 同源的定义

如果两个 URL 的 `protocol`、`host`、`port` 三者都相同的话，则这两个 URL 是同源，即属于同一个域。

- 协议相同
- 域名相同

- 端口相同

## 限制范围

目前，如果非同源，共有三种行为受到限制：

- Cookie、LocalStorage 和 IndexDB 无法读取。
- DOM 无法获得。

- AJAX 请求不能发送。

## 突破限制

![sop-202109291617734.jpeg](https://gitee.com/zzcyes/repository/raw/master/images/sop-202109291617734.jpeg)

### Cookie

Cookie 是服务器写入浏览器的一小段信息，只有同源的网页才能共享。但是，两个网页一级域名相同，只是二级域名不同，浏览器允许通过设置`document.domain`共享 Cookie（只能获取非 HttpOnly 类型的cookie）。

举例来说，A网页是`http://w1.example.com/a.html`，B网页是`http://w2.example.com/b.html`，那么只要设置相同的`document.domain`，两个网页就可以共享Cookie。

网页A、B设置

```javascript
document.domain = 'example.com';
```

现在，A网页设置一个 Cookie

```javascript
document.cookie = "key=value"
```

在B网页可以读到这个 Cookie

```javascript
document.cookie; // "key=value"
```

注意，这种方法只适用于 Cookie 和 iframe 窗口，LocalStorage 和 IndexDB 无法通过这种方法，规避同源策略，而要使用下文介绍的PostMessage API。

另外，服务器也可以在设置Cookie的时候，指定Cookie的所属域名为一级域名，比如.example.com。

```javascript
Set-Cookie: key=value; domain=.example.com; path=/
```

这样的话，二级域名和三级域名不用做任何设置，都可以读取这个Cookie。

### iframe

如果两个网页不同源，就无法拿到对方的DOM。典型的例子是iframe窗口和window.open方法打开的窗口，它们与父窗口无法通信。

```javascript
document.getElementById("myIFrame").contentWindow.document
// Uncaught DOMException: Blocked a frame from accessing a cross-origin frame.
```

比如，父窗口运行下面的命令，如果iframe窗口不是同源，就会报错。

反之亦然，子窗口获取主窗口的DOM也会报错。

```javascript
window.parent.document.body
// 报错
```

如果两个窗口一级域名相同，只是二级域名不同，那么设置上一节介绍的document.domain属性，就可以规避同源政策，拿到DOM。

对于完全不同源的网站，目前有如下三种方法，可以解决跨域窗口的通信问题。

#### 片段识别符（fragment identifier）

片段标识符（fragment identifier）指的是，URL的#号后面的部分，比如`http://example.com/x.html#fragment`的#fragment。如果只是改变片段标识符，页面不会重新刷新。

父窗口可以把信息，写入子窗口的片段标识符。

```javascript
var src = `${originURL}#${data}`;
document.getElementById('myIFrame').src = src;
// 子窗口通过监听hashchange事件得到通知。
window.onhashchange = checkMessage;
function checkMessage() {
  var message = window.location.hash;
  // ...
}
// 同样的，子窗口也可以改变父窗口的片段标识符。
parent.location.href= `${target}#${hash}`;
```

#### window.name

 浏览器窗口有`window.name`属性。这个属性的最大特点是，无论是否同源，只要在同一个窗口里，前一个网页设置了这个属性，后一个网页可以读取它。

```javascript
// 父窗口先打开一个子窗口，载入一个不同源的网页，该网页将信息写入window.name属性。
window.name = data;
// 接着，子窗口跳回一个与主窗口同域的网址。
location = 'http://parent.url.com/xxx.html';
// 然后，主窗口就可以读取子窗口的window.name了。
var data = document.getElementById('myFrame').contentWindow.name;
```

这种方法的优点是，window.name容量很大，可以放置非常长的字符串；缺点是必须监听子窗口window.name属性的变化，影响网页性能。

#### postMessage-跨文档通信API（Cross-document messaging）

上面两种方法都属于破解，HTML5为了解决这个问题，引入了一个全新的API：跨文档通信 API（Cross-document messaging）。

- otherWindow.postMessage(message, targetOrigin, [transfer]);

- - otherWindow，其他窗口的一个引用
  - message，将要发送到其他 window的数据

- - targetOrigin，通过窗口的origin属性来指定哪些窗口能接收到消息事件
  - transfer，是一串和message 同时传递的 Transferable 对象

- message事件的事件对象event，提供以下三个属性。

- - event.source：发送消息的窗口
  - event.origin: 消息发向的网址

- - event.data: 消息内容

http://localhost:3000/A.html

```html
<html>
<body>
    A.html
    <script>
        const newWindow = window.open('http://127.0.0.1:4000/B', 'B');
        newWindow.postMessage('您好，我是AA', 'http://127.0.0.1:4000/B')//向端口为4000的域发送内容
        window.onmessage = function (e) {
            console.log('A-e：', e)
            console.log('A-e.data：', e.data);
        }
    </script>
</body>
</html>
```

http://localhost:4000/B.html

```html
<html>
<body>
    B.html
    <script type="text/javascript">
        window.onmessage = function (e) {
            console.log('B-e：', e)
            console.log('B-e.data：', e.data);
            //向父级（发射源）发送消息
            window.opener.postMessage('您好，我是BB', 'http://127.0.0.1:3000/A');
            // e.source.postMessage('您好，我是BB', 'http://127.0.0.1:3000/A');
        }
    </script>
</body>
</html>
```

##### LocalStorage

通过`window.postMessage`，读写其他窗口的 LocalStorage 也成为了可能。

http://127.0.0.1:3000/A

```html
<html>
<body>
    A.html
    <script>
      const newWindow = window.open('http://127.0.0.1:4000/B', 'B');
      newWindow.postMessage({
        name: 'AA',
        message: '您好，我是AA'
      }, 'http://127.0.0.1:4000/B')//向端口为4000的域发送内容
      window.onmessage = function (e) {
        console.log('A-e：', e)
        console.log('A-e.data：', e.data);
        const { name, message } = e.data;
        localStorage.setItem(name, message);
      }
		</script>
</body>
</html>
```

http://127.0.0.1:4000/B

```html
<html>
<body>
    B.html
    <script type="text/javascript">
        window.onmessage = function (e) {
            console.log('B-e：', e)
            console.log('B-e.data：', e.data);
            //向父级（发射源）发送消息
            window.opener.postMessage({
                name: 'BB',
                message: '您好，我是BB'
            }, 'http://127.0.0.1:3000/A');
            // e.source.postMessage('您好，我是BB', 'http://127.0.0.1:3000/A');
        }
    </script>
</body>
</html>
```

### AJAX

同源策略规定，AJAX请求只能发给同源的网址，否则就报错。除了架设服务器代理（浏览器请求同源服务器，再由后者请求外部服务），有三种方法规避这个限制。

#### CORS

CORS是跨源资源分享（Cross-Origin Resource Sharing）的缩写。它是W3C标准，是跨源AJAX请求的根本解决方法。相比JSONP只能发GET请求，CORS允许任何类型的请求。

#### JSONP

JSONP是服务器与客户端跨源通信的常用方法。**最大特点就是简单适用，老式浏览器全部支持，服务器改造非常小。**

它的基本思想是，网页通过添加一个<script>元素，向服务器请求JSON数据，这种做法不受同源政策限制；服务器收到请求后，将数据放在一个指定名字的回调函数里传回来。

首先，网页动态插入<script>元素，由它向跨源网址发出请求。

```javascript
function addScriptTag(src) {
  var script = document.createElement('script');
  script.setAttribute("type", "text/javascript");
  script.src = src;
  document.body.appendChild(script);
}
window.onload = function () {
  addScriptTag('http://localhost:3000/name?callback=foo');
}
function foo(message) {
  console.log(`message is: ${message.name}!`);
};
```

上面代码通过动态添加<script>元素，向服务器example.com发出请求。注意，该请求的查询字符串有一个callback参数，用来指定回调函数的名字，这对于JSONP是必需的。

```javascript
const http = require('http')
const url = require('url')
const port = 3000
const server = http.createServer((req, res) => {
    const { query } = url.parse(req.url, true);
    const { callback } = query;
    console.log('req.query', query);
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain')
    res.end(`${callback}({ "name": "JSONP!" })`)
})
server.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}/`)
})
```

服务器收到这个请求以后，会将数据放在回调函数的参数位置返回。

```javascript
foo({
  "name": "JSONP!"
});
```

由于<script>元素请求的脚本，直接作为代码运行。这时，只要浏览器定义了foo函数，该函数就会立即调用。作为参数的JSON数据被视为JavaScript对象，而不是字符串，因此避免了使用JSON.parse的步骤。

#### Nginx

Nginx 是一种高性能的`反向代理`服务器，可以用来轻松解决跨域问题。 

![sop-202109291617805.png](https://gitee.com/zzcyes/repository/raw/master/images/sop-202109291617805.png)

**正向代理**帮助客户端**访问**客户端自己访问不到的服务器，然后将结果返回给客户端。

**反向代理**拿到客户端的请求，将请求转发给其他的服务器，主要的场景是维持服务器集群的**负载均衡**，换句话说，反向代理帮**其它的服务器**拿到请求，然后选择一个合适的服务器，将请求转交给它。

比如说现在客户端的域名为`client.com`，服务器的域名为`server.com`，客户端向服务器发送 Ajax 请求，当然会跨域了，那这个时候让 Nginx 登场了，通过下面这个配置:

```javascript
server {
  listen  80;
  server_name  client.com;
  location /api {
    proxy_pass server.com;
  }
}
```

Nginx 相当于起了一个跳板机，这个跳板机的域名也是`client.com`，让客户端首先访问` client.com/api`，这当然没有跨域，然后 Nginx 服务器作为反向代理，将请求转发给`server.com`，当响应返回时又将响应给到客户端，这就完成整个跨域请求的过程。

#### WebSocket

WebSocket是一种通信协议，使用ws://（非加密）和wss://（加密）作为协议前缀。该协议不实行同源政策，只要服务器支持，就可以通过它进行跨源通信。

下面是一个例子，浏览器发出的WebSocket请求的头信息（摘自维基百科）。

```javascript
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==
Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Version: 13
Origin: http://example.com
```

上面代码中，有一个字段是Origin，表示该请求的请求源（origin），即发自哪个域名。

正是因为有了Origin这个字段，所以WebSocket才没有实行同源政策。因为服务器可以根据这个字段，判断是否许可本次通信。如果该域名在白名单内，服务器就会做出如下回应。

```javascript
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: HSmrc0sMlYUkAGmm5OPpG2HaGWk=
Sec-WebSocket-Protocol: chat
```

### 补充

通常，允许嵌入跨域资源，而阻止读取跨域资源

| iframes    | 通常允许跨域嵌入（取决于`X-Frame-Options`指令），但不允许跨域读取（例如使用JavaScript访问iframe中的文档）。 |
| ---------- | ------------------------------------------------------------ |
| CSS        | 跨域CSS可以使用`<link>`元素或`@import`在CSS文件中嵌入。`Content-Type`可能需要正确的标题。 |
| forms      | 跨域URL可以用作`action`表单元素的属性值。Web应用程序可以将表单数据写入跨域目标。 |
| images     | 允许嵌入跨域图像。但是，`canvas`将禁止读取跨域图像（例如，使用JavaScript将跨域图像加载到元素中）。 |
| multimedia | 跨域视频和音频可以使用`<video>`和`<audio>`元素嵌入。         |
| script     | 可以嵌入跨域脚本；但是，可能会阻止对某些API（例如跨域提取请求）的访问。 |

## 资源

- [浏览器同源政策及其规避方法 - 阮一峰的网络日志](https://www.ruanyifeng.com/blog/2016/04/same-origin-policy.html)
- [浏览器的同源策略 - Web 安全 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)

- [same-origin-policy - web.dev](https://web.dev/same-origin-policy/)
- [一文带你看懂cookie，面试前端不用愁](https://zhuanlan.zhihu.com/p/52091630)

- [【9大跨域解决方案】window.name解决跨域的原理](https://blog.csdn.net/qq_17175013/article/details/89007334)