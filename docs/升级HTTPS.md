# HTTPS升级过程

## 购买SSL证书（免费）

打开阿里云，搜索[SSL证书](https://www.aliyun.com/product/cas)

![](https://www.zzcyes.com/images/update-https-202110151010462.png)

选购SSL证书

![](https://www.zzcyes.com/images/update-https-202110151010766.png)

接下来选择如下配置，要注意配置费用为0

![](https://www.zzcyes.com/images/update-https-202110151011586.png)

选完配置点**立即购买**，然后跳到确认订单页，**点击支付**

![image-20211015101154412](https://www.zzcyes.com/images/update-https-202110151011545.png)

支付成功会跳到支付完成页面，此时证书申请完毕

![image-20211015101226507](https://www.zzcyes.com/images/update-https-202110151012639.png)

## 创建证书

进入证书控制台（SSL证书），选择**免费证书**标签栏，先**创建证书**

![image-20211015101426516](https://www.zzcyes.com/images/update-https-202110151014665.png)

## 申请证书

创建成功后，表格会出现证书的信息，此时在表格的**操作栏**点击**证书申请**

![image-20211015101619365](https://www.zzcyes.com/images/update-https-202110151016513.png)

![image-20211015102147933](https://www.zzcyes.com/images/update-https-202110151021100.png)

![image-20211015102636943](https://www.zzcyes.com/images/update-https-202110151026112.png)

先把**专有验证文件**下载下来，是一个txt文件，然后创建如下目录`.well-known/pki-validation/fileauth.txt`

![image-20211015105354836](https://www.zzcyes.com/images/update-https-202110151053892.png)

此时再把整个`.well-known`文件夹扔进服务器指定目录（网站访问目录），本人用的是阿里云服务器（`ubuntu`），之前已经配置好`nginx`

![image-20211015105727580](https://www.zzcyes.com/images/update-https-202110151057650.png)
网站访问目录在`/var/www/`下，所以直接把整个`.well-known`文件夹扔进服务器就行
![image-20211015103902205](https://www.zzcyes.com/images/update-https-202110151039279.png)

接下来**点击验证**

![image-20211015105950110](https://www.zzcyes.com/images/update-https-202110151059271.png)

验证成功后会有成功的提示

![image-20211015110146583](https://www.zzcyes.com/images/update-https-202110151101741.png)

此时**提交验证**

![image-202110151103801](https://www.zzcyes.com/images/update-https-202110151103801.png)

## 证书下载

![image-20211015110655799](https://www.zzcyes.com/images/update-https-202110151106962.png)

点击下载，根据自己的服务器类型选择证书下载，这里本人使用的是`nginx`

![image-20211015110753328](https://www.zzcyes.com/images/update-https-202110151107492.png)

下载好证书后，创建一个目录`.ssl`（名称无要求）,把下载证书文件解压之后，上传到该目录

![image-20211015111141005](https://www.zzcyes.com/images/update-https-202110151111058.png)

## 配置nginx

![image-20211015154212101](https://www.zzcyes.com/images/update-https-202110151542334.png)

`nginx`的`server`配置如下

```
server {
  #listen       80;
  listen 443 ssl;
  server_name www.xxx.com; 

  ssl_certificate	 /var/www/.ssl/www.xxx.com.pem;
  ssl_certificate_key	 /var/www/.ssl/www.xxx.com.key;
 
  #ssl_session_cache	 shared:SSL:1m;
  #ssl_session_timeout 	 5m;

  # 指定密码为openssl支持的格式
  ssl_protocols  SSLv2 SSLv3 TLSv1.2;

  ssl_ciphers  HIGH:!aNULL:!MD5;  # 密码加密方式
  ssl_prefer_server_ciphers  on;   # 依赖SSLv3和TLSv1协议的服务器密码将优先于客户端密码

  root  /var/www/;
  index index.html index.htm;
}
```

## 链接

- [HTTP升级HTTPS全过程记录 - SegmentFault 思否](https://segmentfault.com/a/1190000022597768)

- [HTTPS 升级指南 - 阮一峰的网络日志](https://www.ruanyifeng.com/blog/2016/08/migrate-from-http-to-https.html)