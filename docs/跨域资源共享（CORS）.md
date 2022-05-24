## 概念
**跨源资源共享** (Cross-origin resource sharing，简称CORS) （或通俗地译为**跨域资源共享**）是一种基于HTTP头的机制，该机制通过允许服务器标示除了它自己以外的其它**orgin（域，协议和端口）**，这样浏览器可以访问加载这些资源。跨源资源共享还通过一种机制来检查服务器是否会允许要发送的真实请求，该机制通过浏览器发起一个到服务器托管的跨源资源的"预检"请求。在预检中，浏览器发送的头中标示有HTTP方法和真实请求中会用到的头。

## 支持
现代浏览器支持在 API 容器中（例如 XMLHttpRequest 或 Fetch ）使用 CORS，以降低跨源 HTTP 请求所带来的风险。

CORS需要浏览器和服务器同时支持

- 整个CORS通信过程，都是浏览器自动完成，不需要用户参与（浏览器一旦发现请求跨源，就会自动添加一些附加的头信息，有时还会多出一次附加的请求，但用户不会有感觉）
- 只要服务器实现了CORS接口，便可以实现跨源通信

目前，所有浏览器都支持该功能，IE浏览器不能低于IE10。
![cors-202109291625064.png](https://www.zzcyes.com/images/cors-202109291625064.png)
## 两种请求
浏览器将CORS请求分成两类：简单请求（simple request）和非简单请求（not-so-simple request）。
### 简单请求
简单请求不会触发 CORS 预检请求。请注意，该术语并不属于 Fetch （其中定义了 CORS）规范。
#### 条件
若请求满足所有下述条件，则该请求可视为**简单请求**：

- 使用下列方法之一：
   - GET
   - HEAD
   - POST
- 除了被用户代理自动设置的首部字段（例如 Connection ，User-Agent）和在 Fetch 规范中定义为禁用首部名称 的其他首部，允许人为设置的字段为 Fetch 规范定义的 对 CORS 安全的首部字段集合。该集合为：
   - Accept
   - Accept-Language
   - Content-Language
   - Content-Type （需要注意额外的限制）
   - DPR
   - Downlink
   - Save-Data
   - Viewport-Width
   - Width
- Content-Type 的值仅限于下列三者之一：
   - text/plain
   - multipart/form-data
   - application/x-www-form-urlencoded
- 请求中的任意XMLHttpRequestUpload 对象均没有注册任何事件监听器；XMLHttpRequestUpload 对象可以使用 XMLHttpRequest.upload 属性访问。
- 请求中没有使用 ReadableStream 对象。
#### 特点
对于简单请求，浏览器直接发出CORS请求。具体来说，就是在头信息之中，增加一个Origin字段。
#### 实例
```javascript
// 客户端：http://127.0.0.1:3000
fetch("http://127.0.0.1:4000/simple", {
  method: 'GET',
  headers: {
    'Content-Type': 'text/plain',
  },
}).then(result => {
  return result.text();
}).then(res => {
  console.log('getRequest is succeed:', res);
}).catch(err => {
  console.error('getRequest is faild:', err)
})

// 服务端：http://127.0.0.1:3000
const http = require("http");
http.createServer((request,response)=>{
	if(pathname==='/simple'){
    response.writeHead(200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin":"http://127.0.0.1:3000"
    })
    response.write("simple request is succeed!");
  }
  response.end();
}).listen(4000);
```
为了清楚的看到简单请求和非跨域请求的区别，分别在`http://127.0.0.1:3000`下以GET方法调用服务地址`http://127.0.0.1:3000/simple`、`http://127.0.0.1:4000/simple`

- 调用`http://127.0.0.1:3000/simple`（非跨域请求）

![cors-202109291625979.png](https://www.zzcyes.com/images/cors-202109291625979.png)

- 调用`http://127.0.0.1:4000/simple`（简单请求）

![cors-202109291625180.png](https://www.zzcyes.com/images/cors-202109291625180.png)
对比两张图可以发现，简单请求的响应头部多了`Origin:http//127.0.0.1:3000`
### 非简单请求
#### 条件
不同时满足简单请求条件的，即属于非简单请求。非简单请求会触发CORS预检请求。
#### 预检请求
与前述简单请求不同，“需预检的请求”要求必须首先使用 `OPTIONS`   方法发起一个预检请求到服务器，以获知服务器是否允许该实际请求。"预检请求“的使用，可以避免跨域请求对服务器的用户数据产生未预期的影响。
#### 实例
```javascript
// 客户端：http://127.0.0.1:3000
fetch("http://127.0.0.1:4000/no-simple", {
  method: 'POST',
  body: JSON.stringify({
    name: 'zzcyes',
    birth: '1997'
  }),
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: "include"
}).then(result => {
  return result.text();
}).then(res => {
  console.log('cookie:', document.cookie);
  console.log('getRequest is succeed:', res);
}).catch(err => {
  console.error('getRequest is faild:', err)
})

// 服务端：http://127.0.0.1:4000
// 服务端：http://127.0.0.1:3000
const http = require("http");
http.createServer((request,response)=>{
	if(pathname==='/no-simple'){
    response.writeHead(200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin":"http://127.0.0.1:3000",
  		"Access-Control-Allow-Headers":"Content-Type,My-Cookie",
      "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
      "Set-Cookie":"name=zzcyes",
    	"Access-Control-Allow-Credentials":true,
      "Access-Control-Max-Age":"10",
    })
    response.write("no simple CORS request is succeed!");
  }
  response.end();
}).listen(4000);
```
为了清楚的看到简单请求和非跨域请求的区别，分别在`http://127.0.0.1:3000`下以POST方法调用服务地址`http://127.0.0.1:3000/no-simple`、`http://127.0.0.1:4000/no-simple`

- 调用`http://127.0.0.1:3000/no-simple`（非跨域请求）

![cors-202109291625250.png](https://www.zzcyes.com/images/cors-202109291625250.png)

- 调用`http://127.0.0.1:4000/no-simple`（非简单请求）

预检请求
![cors-202109291625409.png](https://www.zzcyes.com/images/cors-202109291625409.png)

POST请求（这里请求与响应头部均与非跨域的POST别无二致）

![cors-202109291627460.png](https://www.zzcyes.com/images/cors-202109291627460.png)
#### 响应首部字段
| **字段**                         | **说明**                                                     |
| -------------------------------- | ------------------------------------------------------------ |
| Access-Control-Allow-Origin      | 该字段是必须的。它的值要么是请求时`Origin`字段的值，要么是一个`*`，表示接受任意域名的请求。 |
| Access-Control-Allow-Methods     | 该字段必需，它的值是逗号分隔的一个字符串，表明服务器支持的所有跨域请求的方法。注意，返回的是所有支持的方法，而不单是浏览器请求的那个方法。这是为了避免多次"预检"请求。 |
| Access-Control-Expose-Headers    | 在跨源访问时，XMLHttpRequest对象的getResponseHeader()方法只能拿到一些最基本的响应头，Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma，如果要访问其他头，则需要服务器设置本响应头。 |
| Access-Control-Allow-Headers     | 如果浏览器请求包括`Access-Control-Request-Headers`字段，则`Access-Control-Allow-Headers`字段是必需的。它也是一个逗号分隔的字符串，表明服务器支持的所有头信息字段，不限于浏览器在"预检"中请求的字段。 |
| Access-Control-Allow-Credentials | `Access-Control-Allow-Credentials` 头指定了当浏览器的`credentials`设置为true时是否允许浏览器读取response的内容。当用在对preflight预检测请求的响应中时，它指定了实际的请求是否可以使用`credentials`。请注意：简单 GET 请求不会被预检；如果对此类请求的响应中不包含该字段，这个响应将被忽略掉，并且浏览器也不会将相应内容返回给网页。 |
| Access-Control-Max-Age           | 用来指定本次预检请求的有效期（秒）                           |

#### 请求首部字段
| **字段**                       | **说明**                                                     |
| ------------------------------ | ------------------------------------------------------------ |
| Origin                         | `Origin` 首部字段表明预检请求或实际请求的源站。              |
| Access-Control-Request-Method  | `Access-Control-Request-Method` 首部字段用于预检请求。其作用是，将实际请求所使用的 HTTP 方法告诉服务器。 |
| Access-Control-Request-Headers | `Access-Control-Request-Headers` 首部字段用于预检请求。其作用是，将实际请求所携带的首部字段告诉服务器。 |

#### 
#### 附带身份凭证的请求
一般而言，对于跨源 `XMLHttpRequest` 或 Fetch 请求，浏览器不会发送身份凭证信息。如果要发送凭证信息，需要设置 `XMLHttpRequest`的某个特殊标志位。
## 资源

- [跨域资源共享 CORS 详解 - 阮一峰的网络日志](http://www.ruanyifeng.com/blog/2016/04/cors.html)
- [跨源资源共享（CORS） - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [跨域（CORS）产生原因分析与解决方案，这一次彻底搞懂它](https://zhuanlan.zhihu.com/p/210244307)