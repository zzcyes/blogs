# React动态切换本地代理地址(devServer.proxy)

## 背景需求
在本地跑React项目时，调用的接口往往是跨域的，一般常用的是`webpack-dev-server`提供的`prxoy`代理功能。然而在每次切换代理环境后，都需要重新跑项目，对于开发人员来说太麻烦了。如果能够在切换代理环境后，不用重跑项目，岂不是提升了开发体验和减少了项目编译的时间呢？

● webpack.devServer.config.js
```json

'use strict';
const fs = require('fs');
// ...
module.exports = function(proxy, allowedHost) {
    return {
        // ...
        proxy: {
          '/test': {
              target: 'http://47.115.13.227:8001',
              changeOrigin: true,
          },
          '/user': {
              target: 'http://47.115.13.227:8002',
              changeOrigin: true,
          },
        },
    };
};
```

## 需求分析

根据项目的背景需求，分析了一下原因，之所以需要重跑项目，是因为修改配置后，webpack不会重新读取我们修改后的代理配置文件（webpack.devServer.config.js）。

那么，这么一分析下来话，想要解决这个问题，有两种思路：

1. 让webpack监听我们代理的配置文件（webpack.devServer.config.js），一旦文件有修改就重新热加载；
2. 让webpack实时读取配置文件中的`proxy`配置，能够在每次代理的时候实时读取，不用每次重新加载。

基于这两种思路，我去查阅了下webpack的官方文档。

## 查阅文档

### devServer.proxy

在查阅了webpack官网中[devServer.proxy](https://webpack.js.org/configuration/dev-server/#devserverproxy)的内容后，发现这个`devServer`是用了[http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)包去实现的，并且给出了它的[官方文档](https://github.com/chimurai/http-proxy-middleware#options)


![devs-server-proxy-01.png](https://gitee.com/zzcyes/repository/raw/master/images/devs-server-proxy-01.png)


### http-proxy-middleware

在`http-proxy-middleware`中发现了这样一个`router`配置参数，意思是可以针对特殊的一些请求重新定位/代理

- **option.router**: object/function, re-target option.target for specific requests.

```javascript
// Use `host` and/or `path` to match requests. First match will be used.
// The order of the configuration matters.
router: {
  'integration.localhost:3000' : 'http://localhost:8001',  // host only
  'staging.localhost:3000'     : 'http://localhost:8002',  // host only
  'localhost:3000/api'         : 'http://localhost:8003',  // host + path
  '/rest'                      : 'http://localhost:8004'   // path only
}

// Custom router function (string target)
router: function(req) {
  return 'http://localhost:8004';
}

// Custom router function (target object)
router: function(req) {
  return {
    protocol: 'https:', // The : is required
    host: 'localhost',
    port: 8004
  };
}

// Asynchronous router function which returns promise
router: async function(req) {
  const url = await doSomeIO();
  return url;
}
```

其中`router`可以传递函数并且支持async函数，那么意味着，是不是webpack能够实时读取`proxy`的配置呢。

## 验证想法

为了验证这个API，我先搭建了两个node服务，再通过配置webpack.devServer.config.js中的proxy中动态的请求代理地址参数去验证想法。

### 服务端口8001

如下，搭建端口为`8001`的node服务有以下功能：

- `/getRouterProxyUrl`随机返回`8001`和`8002`端口的代理地址，
- `/test`,返回`8001 succesed get test word！`

```javascript
const http = require('http');
const server8001 = http.createServer(function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-type,Content-Length,Authorization,Accept,X-Requested-Width");
    res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");

    let proxyUrl = '';

    if (req.url == "/getRouterProxyUrl") {
        if (Math.random() * 10 > 5) {
            proxyUrl = 'http://47.115.13.227:8001';
        } else {
            proxyUrl = 'http://47.115.13.227:8002';
        }
        res.writeHead(200, {
            'Content-type': 'text/plain;charset=UTF8',
        });
        res.end(proxyUrl);
    } else if (req.url == "/test") {
        res.writeHead(200, { 'Content-type': 'text/plain;charset=UTF8' });
        res.end('8001 succesed get test word!');
    } else {
        res.writeHead(200, { 'Content-type': 'text/plain;charset=UTF8' });
        res.end(`8001 hello,your request url is ${req.url}`);
    }
    console.debug(new Date(), `8001 req.url:${req.url}`);
    console.debug(new Date(), `8001 proxyUrl:${proxyUrl}`);
});

server8001.listen('8001', function() {
    console.log((new Date()) + 'Server is listening on port:', 8001);
})
```

### 服务端口8002
如下，端口为`8002`的node服务有以下功能：

- `/test`返回`8002 succesed get test word!`
  
```javascript
const http = require('http');

const server8002 = http.createServer(function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-type,Content-Length,Authorization,Accept,X-Requested-Width");
    res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");

    if (req.url == "/test") {
        res.writeHead(200, { 'Content-type': 'text/plain;charset=UTF8' });
        res.end('8002 succesed get test word!');
    } else {
        res.writeHead(200, { 'Content-type': 'text/plain;charset=UTF8' });
        res.end(`8002 hello,your request url is ${req.url}`);
    }
    console.debug(new Date(), `8002 req.url:${req.url}`);

});

server8002.listen('8002', function() {
    console.log((new Date()) + 'Server is listening on port:', 8002);
})
```

### 配置proxy

webpack.devServer.config.js文件如下，通过`getFecth`去请求动态的代理地址，`router`中拿到`getFecth`中请求到的代理地址再返回

```javascript
'use strict';
const fs = require('fs');
const http = require('http');
// ...
const getFetch = () => {
    return new Promise((resolve, reject) => {
        http.get('http://47.115.13.227:8001/getRouterProxyUrl', res => {
            let todo = '';
            res.on('data', chunk => {
                todo += chunk;
            });
            res.on('end', () => {
                resolve(todo);
            });
            res.on('error', (error) => {
                reject(error);
            });
        });
    });
};

module.exports = function(proxy, allowedHost) {
    return {
        // ...
       proxy: {
          '/test': {
              target: 'http://localhost:3000',
              changeOrigin: true,
              router: async function() {
                  const url = await getFetch();
                  return url;
              },
          },
      }
    };
};
```

### 前端请求

```javascript
fetch('/test')
  .then(response => {
    if (!response.ok) {
      throw 'Error';
    }
    return response.text();
  })
  .then(res => console.debug(res))
  .catch(err => console.error(err));
```

#### 请求报错500 Internal Server Error 

前端请求后，发现报了500 Internal Server Error 的错误

![devs-server-proxy-02.png](https://gitee.com/zzcyes/repository/raw/master/images/devs-server-proxy-02.png)

为了排除服务端的错误，使用postman对`8001`端口的`/getRouterProxyUrl`和`/test`，还有8002端口的`/test`，均发起请求验证了下，都能正常返回正常的响应数据！

![devs-server-proxy-03.png](https://gitee.com/zzcyes/repository/raw/master/images/devs-server-proxy-03.png)

这就很纳闷，可能还是在router代理地址这里除了问题，但是通过打`console.log`，发现`getFetch`是能正常返回数据的。再根据错误提示，可以大致判断是在`router`里边调用接口导致出错的。

```javascript
TypeError: Cannot read property 'split' of undefined
    at required (D:\workspace\Web\react-app\node_modules\requires-port\index.js:13:23)
    at Object.common.setupOutgoing (D:\workspace\Web\react-app\node_modules\http-proxy\lib\http-proxy\common.js:101:7)
    at Array.stream (D:\workspace\Web\react-app\node_modules\http-proxy\lib\http-proxy\passes\web-incoming.js:127:14)
    at ProxyServer.<anonymous> (D:\workspace\Web\react-app\node_modules\http-proxy\lib\http-proxy\index.js:81:21)
    at middleware (D:\workspace\Web\react-app\node_modules\http-proxy-middleware\lib\index.js:46:13)
    at handle (D:\workspace\Web\react-app\node_modules\webpack-dev-server\lib\Server.js:322:18)
    at D:\workspace\Web\react-app\node_modules\webpack-dev-server\lib\Server.js:330:47
    at Layer.handle_error (D:\workspace\Web\react-app\node_modules\express\lib\router\layer.js:71:5)
    at trim_prefix (D:\workspace\Web\react-app\node_modules\express\lib\router\index.js:315:13)
    at D:\workspace\Web\react-app\node_modules\express\lib\router\index.js:284:7
```

再回到[http-proxy-middleware的官方文档](https://github.com/chimurai/http-proxy-middleware#options)

- option.router: object/function, re-target option.target for specific requests.

```javascript
// Asynchronous router function which returns promise
router: async function(req) {
    const url = await doSomeIO();
    return url;
}
```

这里 `await doSomeIO()`引起了我的注意，这个函数命名是不是意味着这里异步的路由函数只能是做一些I/O操作，并不支持调用接口呢？抱着这个疑问，我再查了下资料

- [TypeError: Cannot read property 'split' of undefined #1028](https://github.com/http-party/node-http-proxy/issues/1028)

![devs-server-proxy-04.png](https://gitee.com/zzcyes/repository/raw/master/images/devs-server-proxy-04.png)

有没有可能是router返回的参数不正确，异步函数中不应该是返回string字符串。
于是代码改为如下，在router函数中调用异步接口，测试后是不报错的。

```javascript
router: function() {
    getFetch();
    return {
        protocol: 'http:', // The : is required
        host: '47.115.13.227',
        port: 8001,
    };
},
```

然后再把router改为异步函数，在里边调用`getFetch`，测试后是报错的！难道`router`不支持异步函数？？？离离原上谱！

```javascript
router: async function() {
    getFetch();
    return {
        protocol: 'http:', // The : is required
        host: '47.115.13.227',
        port: 8001,
    };
},
```

#### http-proxy-middleware版本问题

我再去查了下资料[https://github.com/chimurai/http-proxy-middleware/issues/153](https://github.com/chimurai/http-proxy-middleware/issues/153)

![devs-server-proxy-05.png](https://gitee.com/zzcyes/repository/raw/master/images/devs-server-proxy-05.png)

发现http-proxy-middleware是在0.21.0版本才支持`async router`，那么我们再检查下webpack中webpack-dev-server的版本

![devs-server-proxy-06.png](https://gitee.com/zzcyes/repository/raw/master/images/devs-server-proxy-06.png)

好家伙，`webpack-dev-server`里边引用的`http-proxy-middleware`中间件是0.19.1版本，我说试了半天咋没有用。那这个`async router`在咱们项目里就不能用了，要用还得升级下中间件的版本。

#### 支持I/O操作

正当想放弃的时候，刚刚中间件文档提到的router一个用法`async doSomeIO`，要不试试`I/O`操作，看下在router里边调用文件流能否成功。

- test.env.json
```json
{
  "protocol": "http:",
  "host": "47.115.13.227",
  "port": 8002
}
```

- proxy

```javascript
'/test': {
    target: 'http://47.115.13.227:8001',
    changeOrigin: true,
    router: function() {
        const envStr = fs.readFileSync('./test.env.json', 'utf-8');
        const { protocol, host, port } = JSON.parse(envStr);
        return {
            protocol,
            host,
            port,
        };
    },
}
```

在页面里点击调用`fetch("/test")`，发现请求通了，并且是从端口为`8002`的服务器返回的结果！

![devs-server-proxy-07.png](https://gitee.com/zzcyes/repository/raw/master/images/devs-server-proxy-07.png)

果然可以做`I/O`操作，那如果在不重启项目的情况下，修改`test.env.json`的代理配置，把`port`改为`8001`，再继续调用`fetch("/test")`，请求的结果会变成`8001`端口服务器返回的吗？

```json
{
  "protocol": "http:",
  "host": "47.115.13.227",
  "port": 8001
}
```

修改完`test.env.json`的配置后，继续调用`fetch("/test")`，发现请求的结果变成了`8001`端口服务器返回的了！

![devs-server-proxy-08.png](https://gitee.com/zzcyes/repository/raw/master/images/devs-server-proxy-08.png)

到这一步，就验证了咱们最初的想法——“希望能够在修改代理环境后，不用重新跑项目即可”，是可行的！

## 实现代码

- test.env.json

```json
{
  "protocol": "http:",
  "host": "47.115.13.227",
  "port": 8001
}
```

- webpack.devServer.config.js

```json
'use strict';
const fs = require('fs');
// ...
const getEvnFilesJSON = (context) =>{
  // const = {req,url,methods } = context;
  // ...可根据req,url,methods来获取不同的代理环境
  const envStr = fs.readFileSync('./test.env.json, 'utf-8');
  const { protocol, host, port } = JSON.parse(envStr);
  return { protocol, host, port } 
};

module.exports = function(proxy, allowedHost) {
    return {
        // ...
        proxy: {
            '/test': {
                target: 'http://47.115.13.227:8001',
                changeOrigin: true,
                router: getEvnFilesJSON
            },
        },
    };
};
```
## 总结

1. webpack的web-dev-server是基于http-proxy-middleware实现的
2. http-proxy-middleware中 `options.router`的`async router`功能是在0.21.0版本开始支持的
3. http-proxy-middleware中`options.router`功能支持I/O操作

后续有时间可以用Electron开发一个管理React本地devServer.Proxy的工具！像[SwitchHosts](https://swh.app/)一样！

## 链接

- [devServer.proxy](https://webpack.js.org/configuration/dev-server/#devserverproxy)

- [http-proxy-middleware options](https://github.com/chimurai/http-proxy-middleware#options)

- [option.router with callback in arguments #153](https://github.com/chimurai/http-proxy-middleware/issues/153)
