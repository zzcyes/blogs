# CORS errors: The 'Access-Control-Allow-Origin' header contains multiple values '*, *', but only one is allowed.

## 背景

今天在调试项目的时候，碰到了一个跟跨域相关的问题——`CORS errors`。

场景如下：前端向第三方平台发起一个请求，使用了 Nginx 做代理转发去处理跨域问题。

但是，在经过Nginx代理转发后，虽然`status code` 为200，但是请求报错 `CORS errors`，并且没有没有返回响应结果。

![cors-multiple-values-02.png](https://www.zzcyes.com/images/cors-multiple-values-02.png)

打开浏览器控制台发现报了以下错误：

![cors-multiple-values-01.png](https://www.zzcyes.com/images/cors-multiple-values-01.png)

```
Access to fetch at 'http://47.115.13.227:3004/cors/test' from origin 'http://127.0.0.1:5500' has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header contains multiple values '*, *', but only one is allowed. Have the server send the header with a valid value, or, if an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
```

大致意思是 `Access-Control-Allow-Origin` 请求头包含了多个值，但是只有一个是被允许的！

接着观察了下响应头，果然有两个 `Access-Control-Allow-Origin` 标头。

![cors-multiple-values-04.png](https://www.zzcyes.com/images/cors-multiple-values-04.png)


## 解决方法

错误提示只有一个 `Access-Control-Allow-Origin` 的值是被允许的，那么我们去除Nginx或者服务端的 `Access-Control-Allow-Origin` 配置即可。

## 验证想法

为了验证想法，在本地用VSCODE起了一个前端页面 `http://127.0.0.1:5500/cors.html` ，发起请求的路径为 `http://47.115.13.227:3004/cors/test` ，经过Nginx配置转发到真实的服务器 `http://47.115.13.227:8004/cors/test` 中。

- http://127.0.0.1:5500/cors.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>cors</title>
</head>
<body>
    <h1 class="title"></h1>
    <script>
        fetch('http://47.115.13.227:3004/cors/test', {
            method: 'POST',
        }).then(res => {
            return res.text();
        }).then(res => {
            console.debug(res);
            if (res) {
                const h = document.querySelector('.title');
                h && (h.innerText = res);
            }
        })
    </script>
</body>
</html>
```

- Nginx 

```
server {
  listen       3004;
  server_name www.zzcyes.com; 
  add_header Access-Control-Allow-Origin *;

  root  /var/www/;
  index index.html index.htm;

  location /{
      proxy_pass http://47.115.13.227:8004;	
  }
}
```

- Node.js服务

```javascript
const http = require('http');
const corsServer = http.createServer(function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-type,Content-Length,Authorization,Accept,X-Requested-Width");
    res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.writeHead(200, { 'Content-type': 'text/plain;charset=UTF8' });
    res.end('8004: succesed get test word!');
});
corsServer.listen('8004', function() {
    console.log((new Date()) + ' Server is listening on port:', 8004);
})
```

### 去除Nginx配置的"Access-Control-Allow-Origin"

- Nginx 

```
server {
  listen       3004;
  server_name www.zzcyes.com; 
  #add_header Access-Control-Allow-Origin http://47.115.13.227:3004;

  root  /var/www/;
  index index.html index.htm;

  location /{
      proxy_pass http://47.115.13.227:8004;	
  }
}
```

去除Nginx中配置的 `Access-Control-Allow-Origin` 标头后，成功接收到了服务端的响应结果，并且响应头只保留了一个来自 Node.js 服务端配置的 `Access-Control-Allow-Origin` 标头。

![cors-multiple-values-03.png](https://www.zzcyes.com/images/cors-multiple-values-03.png)

### 去除服务端配置的"Access-Control-Allow-Origin"

- Node.js服务

```javascript
const http = require('http');
const corsServer = http.createServer(function(req, res) {
    //  res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-type,Content-Length,Authorization,Accept,X-Requested-Width");
    res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.writeHead(200, { 'Content-type': 'text/plain;charset=UTF8' });
    res.end('8004: succesed get test word!');
});
corsServer.listen('8004', function() {
    console.log((new Date()) + ' Server is listening on port:', 8004);
})
```

去除 Node.js 服务中配置的 `Access-Control-Allow-Origin` 标头后，成功接收到了服务端的响应结果，并且响应头只保留了一个来自 Nginx 配置的 `Access-Control-Allow-Origin`标头。

![cors-multiple-values-03.png](https://www.zzcyes.com/images/cors-multiple-values-03.png)

## 总结

因为 Nginx 和服务端均对 `Access-Control-Allow-Origin` 标头设置了值，导致请求未通过浏览器的 CORS 策略，从而被浏览器拦截了响应结果。在平时项目开发中，尽量协调好一端去配置跨域策略，避免因重复设置标头而造成请求失败的问题。

如果再碰到类似的 CORS errors 问题，先从控制台的提示查看错误信息，再根据MDN的文档 [CORS errors](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS/Errors) 去查找错误原因再确定解决方案！


## 链接

- [CORS errors - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS/Errors)

- [Reason: Multiple CORS header 'Access-Control-Allow-Origin' not allowed](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSMultipleAllowOriginNotAllowed)