# Gitee图床失效（防盗链）

## 问题排查

今天打开博客园发现，平时记录的一些文章里边放的图标失效了，如下图：

![gitee-figure-bed-04.png](../images/gitee-figure-bed-04.png)

之前一直用`gitee`当图床，免费又稳定！今天咋回事？

但是在浏览器打开挂掉的[图片](../images/icon-kobe.png)，浏览器又是正常展示，这就很神奇了！

![gitee-figure-bed-01.png](../images/gitee-figure-bed-01.png)

### 302 Moved Temporarily

回到博客园，按下F12键打开开发者工具，看了下这个失效的图标资源的请求。`status code`是 `302 Moved Temporarily`，说明请求重定向了。`Response Headers`中`Location`为`https://assets.gitee.com/favicon.ico`，这是重定向后的链接。

![gitee-figure-bed-02.png](../images/gitee-figure-bed-02.png)

### 403

在网络面板查看这个重定向的链接，点进去看详情，发现`status code` 为`403`。

> 403错误是一种在网站访问过程中，常见的错误提示，表示资源不可用。服务器理解客户的请求，但拒绝处理它，通常由于服务器上文件或目录的权限设置导致的WEB访问错误。

![gitee-figure-bed-03.png](../images/gitee-figure-bed-03.png)

### Referer

接着看到`Request Headers`，其中`referer`标头引起了我的注意，`referer`的值为`http://www.cnblogs.com/`。

![gitee-figure-bed-05.png](../images/gitee-figure-bed-05.png)

MDN对`Referer`的解释如下：

>Referer 请求头包含了当前请求页面的来源页面的地址，即表示当前页面是通过此来源页面里的链接进入的。服务端一般使用 Referer 请求头识别访问来源，可能会以此进行统计分析、日志记录以及缓存优化等。

从上面已知的信息中，我们可以分析出，博客园中失效的图标，经过重定向后，定向到了gitee图标的链接`https://assets.gitee.com/favicon.ico`，但是这个链接请求被服务器拒绝访问了。

## 图像防盗链

在对比**失效的图标**和**在浏览器可以正常访问的图标**的`Request Headers`后，我发现，失效的图标请求头中多了个`referer`标头，是不是意味着，服务端校验了`referer`请求头，发现请求头不是来源于gitee本站，便拒绝访问呢？

这不是就是常见的图像防盗链处理吗？那什么是防盗链呢？

![gitee-figure-bed-06.png](../images/gitee-figure-bed-06.png)

咳咳开个玩笑！一句话总结防盗链就是：**防止未经授权使用图像**。

试想一下，A网站有很多图像资源供给用户访问和下载，B网站把A网站的图像资源链接放到自己网站上。这样既能够让用户浏览到A网站的图像资源，又没有消耗自己服务器的流量。这不是白嫖嘛?

- A网站图像资源

```
https://a.com/icon-kobe.png
```

- B网站盗用A网站的图像链接，用户访问时消耗的是A网站的服务流量

```html
<img src="https://a.com/icon-kobe.png" alt="this is kobe icon"/>  
```

A网站岂能容忍，为了防止他人未经授权使用图像，对图像资源进行了防盗链处理。

## 防盗链的实现方法

经过刚才的分析，不难得出防盗链的实现原理：服务端判断访问来源是否来自本站或白名单站点，当访问来源不符合这些条件时，服务器便可拒绝其操作。

而识别访问来源，可通过请求头中的`Referer`标头字段去区分。当然只要是能够识别访问来源是否为本站或白名单站点的方法，都能够用来实现防盗链。更多实现方法可参考这篇文章[《如何选择适合自己网站的防盗链》 - 掘金](https://juejin.cn/post/6875562790543687693)

Nginx常用来做静态资源的代理转发，我们可以用Nginx提供的一些配置参数和规则去限制实现防盗链的功能。

![gitee-figure-bed-07.png](../images/gitee-figure-bed-07.png)


查阅文档之后，了解到`ngx_http_referer_module`这个模块可以让我们实现防盗链的功能。

- Example Configuration

```
valid_referer none blocked server_names
               *.example.com example.* www.example.org/galleries/
               ~\.google\.;

if ($invalid_referer) {
    return 403;
}
```

### 只放行指定站点

如下是一个配置案例,只放行`referer`标头为`*.zzcyes.com`的站点。更多配置请[查阅文档](http://nginx.org/en/docs/http/ngx_http_referer_module.html)

```
location /images/ {  
  valid_referer *.zzcyes.com;   
    if ($invalid_referer) {
      rewrite ^/ http://www.zzcyes.com/wangwangwang.jpg;
    }
  }
}
```

假设我们需要访问的图片为24号紫金球衣`http://www.zzcyes.com/images/icon/icon-kobe.png`

![gitee-figure-bed-10.png](../images/gitee-figure-bed-10.png)

如果访问源不是`*.zzcyes.com`，则重定向到狗子的照片

![gitee-figure-bed-11.jpg](../images/gitee-figure-bed-11.jpg)


接下进行验证，在浏览器输入图片链接，可以看到，浏览器直接重定向到了狗子的照片。

![gitee-figure-bed-08.gif](../images/gitee-figure-bed-08.gif)

### 放行空referer和指定站点

放行空`referer`标头和`referer`标头为`*.zzcyes.com`的站点。

```
location /images/ {  
  valid_referer valid_referer none  *.zzcyes.com; 
    if ($invalid_referer) {
      rewrite ^/ http://www.zzcyes.com/wangwangwang.jpg;
    }
  }
}
```

在浏览器中输入图片链接直接访问，是能正常显示图片的，因为浏览器不会在请求头添加`referer`标头。

![gitee-figure-bed-12.png](../images/gitee-figure-bed-12.png)

而在第三方站点访问图片时，`referer`标头的值为第三站点，根据nginx配置的规则，会重定向到狗子的照片。

![gitee-figure-bed-13.png](../images/gitee-figure-bed-13.png)


## 防盗链的破解方法: 只放行指定站点

在前边的案例中，nginx只配置了**只放行指定站点**这一规则，那么只有在指定站点才能够访问到图像资源。

但在一般情况下，网站是不会这样去限制访问来源必须是本站或者指点站点的。

试想有这么一个场景：用户在浏览器的搜索栏中输入网站的图像资源。

- 期望：浏览器能够正常显示图像资源的。

- 结果：无法正常展示（服务端只放行指定站点，对于那些非指定站点和空referer标头，都会被服务段拒绝访问或者重定向。）

这样用户期望看到的图像资源无法正常展示，这样不合常理。

接下来的破解均以访问科比24号紫金球衣`http://www.zzcyes.com/images/icon/icon-kobe.png`的图片为例，nginx配置如下：

```
location /images/ {  
  valid_referer valid_referer  *.zzcyes.com; 
    if ($invalid_referer) {
      rewrite ^/ http://www.zzcyes.com/wangwangwang.jpg;
    }
  }
}
```

用vscode起了一个本地服务`http://127.0.0.1:5500/index.html`，去加载球衣图片资源。

```html
<!-- index.html -->
<img src="http://www.zzcyes.com/images/icon/icon-kobe.png" alt="this is kobe icon"/>  
```

因为nginx配置的规则只允许放行`*.zzcyes.com`，本地起的服务加载图像资源失败，会重定向到狗子的照片。

![gitee-figure-bed-13.png](../images/gitee-figure-bed-13.png)


对于只放行指定站点这一规则，我们可以从伪造referer标头入手。因为服务端只是验证referer标头是否是指定站点，那么只要我们伪造请求的referer为相对应的站点，便可破解防盗链了。

### 谷歌浏览器插件

谷歌应用商店有很多这类的插件，这里推荐**Referer Control**。

![gitee-figure-bed-19.png](../images/gitee-figure-bed-19.png)

我用这个插件配置了一个自定义规则，用`http://www.zzcyes.com`作为访问来源的地址，即请求头的referer标头的值为`http://www.zzcyes.com`。

![gitee-figure-bed-20.png](../images/gitee-figure-bed-20.png)

接着，刷新本地服务启动的`http://127.0.0.1:5500/index.html`页面，可以看到，球衣图片加载出来了，并且Referer标头被篡改成了`http://www.zzcyes.com`。

![gitee-figure-bed-21.png](../images/gitee-figure-bed-21.png)

### 终端访问下载

在终端输入curl语句，并设置referer标头为`http://www.zzcyes.com`，这样我们可以正常下载图像资源。

```shell 
curl -o icon-kobe.png -H "referer":"http://www.zzcyes.com"  http://www.zzcyes.com/images/icon/icon-kobe.png
```

![gitee-figure-bed-22.png](../images/gitee-figure-bed-22.png)

![gitee-figure-bed-23.png](../images/gitee-figure-bed-23.png)

## 防盗链的破解方法: 放行空referer和指定站点

在nginx配置**放行空referer和指定站点**的这一规则，是实现防盗链的常用方式。

如果想快速验证网站的图像资源是否采用了这种防盗链的实现规则，可以把图像资源的链接输入进浏览器的搜索栏中，回车后如果图片能正常显示，说明服务器是允许放行空的referer标头的这类请求。

要破解这类防盗链，可以从服务段允许放行空referer标头入手了。

接下来还是以访问科比24号紫金球衣`http://www.zzcyes.com/images/icon/icon-kobe.png`的图片为例，nginx配置如下：

```
location /images/ {  
  valid_referer valid_referer none  *.zzcyes.com; 
    if ($invalid_referer) {
      rewrite ^/ http://www.zzcyes.com/wangwangwang.jpg;
    }
  }
}
```

### 浏览器直接输入url

浏览器输入图片地址后回车，是能正常显示图片的。因为在浏览器直接输入地址发起请求，请求头不携带referer标头，这样一来就能通过服务器的校验了。

![gitee-figure-bed-14.png](../images/gitee-figure-bed-14.png)


### 终端访问下载

同样，在终端输入curl语句，这时请求头也是不携带referer标头的，我们可以正常下载图像资源。

```shell 
curl -o icon-kobe.png http://www.zzcyes.com/images/icon/icon-kobe.png
```

![gitee-figure-bed-15.png](../images/gitee-figure-bed-15.png)

### HTTP升级为HTTPS（仅限请求页面为非安全协议）

为了方便对比，这里用vscode的liveServer插件起了一个HTTP服务和一个HTTPS服务。

```html
<!-- index.html -->
<img src="http://www.zzcyes.com/images/icon/icon-kobe.png" />
```

- HTTP

可以看到，请求的图像资源携带的referer标头为`http://127.0.0.1:5500/`，与nginx配置的`*.zzcyes.com`不匹配，因此重定向到狗子的图片了。

![gitee-figure-bed-16.png](../images/gitee-figure-bed-16.png)
  
- HTTPS

可以看到，请求的图像资源携带的referer标头为`https://127.0.0.1:5500/`，与nginx配置的`*.zzcyes.com`不匹配，但是图片资源却成功返回了。

![gitee-figure-bed-17.png](../images/gitee-figure-bed-17.png)

带着这个疑惑查了下MDN的资料:

>在以下两种情况下，Referer 不会被发送：
>- 来源页面采用的协议为表示本地文件的 "file" 或者 "data" URI；
>- 当前请求页面采用的是非安全协议，而来源页面采用的是安全协议（HTTPS）。

这里请求的资源图片`http://www.zzcyes.com/images/icon/icon-kobe.png`是非安全协议，来源页面是`https://127.0.0.1:5500/index.html`安全协议。

也就是说，其实服务端接收到的请求，请求头中并不会携带Referer标头！所以，我们能利用安全协议的页面去访问非安全协议页面中的图片。

那么，当来源页面和请求页面均是HTTPS协议时，会有什么效果呢？根据MDN文档描述，Referer标头是能够正常发送的，于是我去HTTPS服务的nginx配置了下相同的规则，允许**放行空referer和referer标头为*.zzcyes.com站点**，然后再用HTTPS协议的页面去请求图像资源！

![gitee-figure-bed-18.png](../images/gitee-figure-bed-18.png)

可以看到，这里图片资源已经不能正常访问了，重定向到狗子的照片了。也就说Referer标头是能够被服务端接受到的，并且nginx配置的Referer校验规则生效了，拒绝放行非*.zzcyes.com站点的请求，并重定向到狗子的照片了。

## 文章链接

- [你已经是个成熟的前端了，应该学会破解防盗链了 - 掘金](https://juejin.cn/post/7079705713781506079)

- [如何选择适合自己网站的防盗链 - 掘金](https://juejin.cn/post/6875562790543687693)

- [Module ngx_http_referer_module](http://nginx.org/en/docs/http/ngx_http_referer_module.html)

<!-- - [valid_referer nginx http and https](https://stackoverflow.com/questions/55802613/valid-referer-nginx-http-and-https) -->

<!-- - [nginx - restrict direct URL access to https but can be redirected from http](https://stackoverflow.com/questions/28595588/nginx-restrict-direct-url-access-to-https-but-can-be-redirected-from-http) -->
