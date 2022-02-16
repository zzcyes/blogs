# iframe无法访问页面

## 背景

在一些场景下，我们的网站需要通过**iframe标签**嵌入第三方厂家的页面，这时候就得通过**iframe标签**去引入需要嵌入网页的网址了

## 案例

例如，2月15日是元宵节，为了庆祝元宵，我们需要在主站上线活动页，这个活动页刚好是一个[第三方网站](https://www.zzcyes.com/yuaunxiao/ci.html)(欧阳修的一首词)，我们需要把他嵌入到[主站](https://www.zzcyes.com/yuanxiao/)中：

![iframe-load-url-01.png](https://gitee.com/zzcyes/repository/raw/master/images/iframe-load-url-01.png)

主站**设计图**如下:

![iframe-load-url-02.png](https://gitee.com/zzcyes/repository/raw/master/images/iframe-load-url-02.png)

主站**实现代码**如下：

```html
<div class="container">
  <h3>万家灯火，共聚团圆 </h3>
  <p><em>正月十五元宵节</em></p>
  <div class="ad">
    <iframe src="https://www.zzcyes.com/yuanxiao/ci.html"></iframe>
  </div>
</div>
```

## 问题
把代码提交之后，打开我们的主站，效果却变成了这样：

![iframe-load-url-03.png](https://gitee.com/zzcyes/repository/raw/master/images/iframe-load-url-03.png)

查看控制台，有以下**报错信息**：​
_Refused to display '[https://www.zzcyes.com/'](https://www.zzcyes.com/') in a frame because it set 'X-Frame-Options' to 'deny'._

![iframe-load-url-04.png](https://gitee.com/zzcyes/repository/raw/master/images/iframe-load-url-04.png)

控制台说在ifame嵌入的第三方网站拒绝了我们的访问，因为它把`X-Frame-Options`设置成了`deny`。

### X-Frame-Options

MDN对它的解释如下：

>The X-Frame-Options HTTP 响应头是用来给浏览器 指示允许一个页面 可否在 `<frame>`, `<iframe>`, `<embed>` 或者 `<object>` 中展现的标记。站点可以通过确保网站没有被嵌入到别人的站点里面，从而避免 clickjacking 攻击。

换一句话说，如果设置为 `deny`，不光在别人的网站 frame 嵌入时会无法加载，在同域名页面中同样会无法加载。另一方面，如果设置为`sameorigin`，那么页面就可以在同域名页面的`frame`中嵌套。

- `deny`表示该页面不允许在 frame 中展示，即便是在相同域名的页面中嵌套也不允许。
- `sameorigin`表示该页面可以在相同域名页面的 frame 中展示。
- `allow-from _uri_`表示该页面可以在指定来源的 frame 中展示。
- 
## 解决方案

知道`X-Frame-Options`的含义后，那么我们只需将`X-Frame-Options`的值设为`sameorigin`或`allow-from uri`即可。由于第三方页面是通过nginx部署的，因此，我们需要配置 nginx 发送 X-Frame-Options 响应头，把`sameorigin`或`allow-from uri`添加到 "http"，"server"或者 "location"的配置中(保存好配置后记得重启`nginx -s reload`)

### X-Frame-Options：sameorigin

如果主站和嵌入的第三方网页**在同一个域中**，可以把`add_header X-Frame-Options sameorigin`这一行，添加到nginx配置中:
```html
 server {
  #listen       80;
  listen 443 ssl; // 主站是https协议
  server_name www.zzcyes.com;
  add_header X-Frame-Options sameorigin;
	// 省略其它配置
  ...
}
```

### X-Frame-Options：allow-from uri

如果主站和嵌入的第三方网页**不在同一个域中**，可以把`add_header X-Frame-Options "ALLOW-FROM url"`这一行，添加到nginx配置中去。这里的url是指你主站的url，也就是嵌入iframe的网页地址，不是iframe上访问的网址。
​

假设主站网址为`https://www.zzcyes.com`，配置如下:`add_header X-Frame-Options "ALLOW-FROM https://www.zzcyes.com"`
​

若有多个主站需要嵌入第三方网页，则需要用逗号分隔多个主站的网址：
`add_header X-Frame-Options "ALLOW-FROM https://www.zzcyes.com,http://www.zzcyes.com"`

```
 server {
  #listen       80;
  listen 443 ssl; // 主站是https协议
  server_name www.zzcyes.com;
  add_header X-Frame-Options "ALLOW-FROM https://www.zzcyes.com";
  // 多个用逗号分隔
  #add_header X-Frame-Options "ALLOW-FROM https://www.zzcyes.com,http://www.zzcyes.com";
  ...
}
```

注意：当按以上配置允许iframe展示的网站时，控制台打印如下错误：
_Invalid 'X-Frame-Options' header encountered when loading '[https://www.zzcyes.com/':](https://www.zzcyes.com/':) 'ALLOW-FROM [https://www.zzcyes.com'](https://www.zzcyes.com')is not a recognized directive. The header will be ignored._

![iframe-load-url-05.png](https://gitee.com/zzcyes/repository/raw/master/images/iframe-load-url-05.png)

控制台打印说我设置的标头X-Frame-Options不生效，我反复检查了下nginx的配置，确实没有问题。于是想了下会不会浏览器版本的，是不是不支持`allow-from`这个语法，果然，在mdn浏览器兼容性的表上查到了，果然不支持（chrome浏览器）`allow-from`这个语法，那么这种方案（在chrome浏览器上）就行不通了

![iframe-load-url-06.png](https://gitee.com/zzcyes/repository/raw/master/images/iframe-load-url-06.png)

### Content-Security-Policy

如果主站和嵌入的第三方网页**不在同一个域中**，通过设置X-Frame-options的值为`allow-from url`这个方法，显然在大部分浏览器上都不支持（IE和火狐除外）。同样在mdn对X-Frame-Options描述下有这么一段话：

> The added security is only provided if the user accessing the document is using a browser supporting X-Frame-Options. Content-Security-Policy HTTP 头中的 frame-ancestors 指令会替代这个非标准的 header。CSP 的 frame-ancestors 会在 Gecko 4.0 中支持，但是并不会被所有浏览器支持。然而 X-Frame-Options 是个已广泛支持的非官方标准，可以和 CSP 结合使用。

这里引出了`Content-Security-Policy`，具体用法请到MDN查阅。

## 文章

- [X-Frame-Options - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/X-Frame-Options)
- [Content-Security-Policy - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy)
