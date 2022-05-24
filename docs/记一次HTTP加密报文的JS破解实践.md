# 记一次HTTP加密报文的JS破解实践

最近在玩一款被称为“天”的游戏——塞尔达传说：旷野之息，在网上搜索攻略的时候意外发现了一个网站，该网站包含了游戏里所有的武器装备、材料和道具的数据资料，见下图：

![decipher-https-message-01.png](https://www.zzcyes.com/images/decipher-https-message-01.png)

看到这么全的数据库，哪个海拉鲁老流氓不心动？

我二话不说打开了开发者工具，正当我准备把网站的请求数据copy下来的时候，下面一幕让海拉鲁老流氓愣了几秒钟：

![decipher-https-message-04.png](https://www.zzcyes.com/images/decipher-https-message-04.png)

这......数据是看到了，但是`data`和`items`是什么鬼，是个人就看不懂啊，这明显被加密过了。

这里只放上`data`的原始数据(items过长):

```
wSrc2z7sj%2BnlXfsQZXMXyF6oPlYLbVXWO%2BfZXgod4qfQvuHbcMJpjIGPE0H2pdXUTZ4TUcA93YzihbfoTq6iuv3762j%2B9hfLAZcEQPuDkthVrHOsZhq5VfYnM7FXIcWR9KjmYRO2MtmnI%2BQkFB3bBNOUb9BVgd7vtJZmgjaAI16EfoBsuwjtrJ66R6gpIHJejp5DU6RWWcoUV%2B1Ipp98NPEwYdGYCPAxovl8fd1NUaXK7ut3Op3IZ3yeOKpSNuhH%2FVLGmOy8wa8lA9JreGxrR8%2B0IsmjvMt3IgTGW0i2wse9Xc51qxNLld1SH5G6khEZx05JjiAWLSbKIQMLkf2Bob6C8LQpaFtRTMQLeWrIPY6Av0FVddqMf5xgjTghPOSIIyKdzw5CwWPeSWJfi7S8YAv9JkqwmbC1S2Zi7m0WpbLm6xpPyXMw1GBi8QeRM1DoBnhlwdodEl9Bvc6tFIbmTu9%2B32%2FqSCDujx4CUYSER9Ly4hO8%2B%2Fkzlbwwu2COotL2o4fczBhQyERt1szEXl33QwP3SX1ayJOrPJZSdMK8Unmoth1eFZL0H1Ncle3YyuLemplIOL2UeBq43%2B8WpXBEfHzqVrry6bohHIf1wjSsPNOo5N9MNn8BMlvVRrbOmUWbWs00j%2F%2BwuLF7xp51dVXhmlTAhKh1nV1VpyiCwZqaK5YEdh0WkMnxGRL8pwhEeY9u09DIm5EYVEjANANyh7xY6RZw5c7eUeq%2FRphhqlKkbDrlHfd0UM%2B1j1XklD5mGY2cz4RZdOiiM1A1aTQfSrwduAWoMDH9VnxTnGeE6%2FmZxL9EV6bhr9%2FfhnNsExb8ixTTyGRC4Js2w4pcT4tFHe25mkDood9VpCseurJxK66BHPubG1jKtHkWgcP8UwHLXHaC1E%2BIXppLRW3hrEr0r%2Bg7fw%3D%3D
```

作为时长50+小时的海拉鲁老流氓，字典里是没有“放弃”这两个字的！为了救公主都解了这么多神庙，解个加密的报文岂不是分分钟的事情？

## 过程

为了解密更清晰，可以列出大概的流程：

1. 确定加密协议：既然要解密，那么我们首先得确定加密协议
   
2. 破解密钥：确定了加密协议后，此时我们就要破解密钥了
   
3. 解密报文：有了密钥后，我们根据加密的规则，对报文解密，最终就能得到报文的明文了

其实这跟解神庙（为了救公主，林克的智力蹭蹭上涨）是一样的：

进入神庙后，我们首先得观察神庙的地形和构造，确定是通过磁力、制冰器、静止器亦或是其它道具来辅助解密，确定辅助道具后，接着就是去破解如何使用这些道具去触发机关了，我们只要触发了机关，就算解密成功了。

### 确定加密协议

既然要解密，我们就先得确定加密的协议，但光从报文上我们根本获取不到任何对解密有用的信息了，这个时候我们只能从前端着手了。

我们根据请求的URL路径名`/api/getByItems`,可以确定，页面上装备和材料展示的数据，都是从这个请求返回的报文中获取到的，经过了前端JS的解密处理后，再渲染到界面上的。

这个时候我们就可以从`前端JS解密报文`这一步找突破口，此时海拉鲁老流氓嘴角微微上扬，手指熟练的按下了`F12`键，并把光标移动到`sources`面板

![decipher-https-message-05.png](https://www.zzcyes.com/images/decipher-https-message-05.png)

此时，老流氓表示遭到同行的鄙视

```html
<noscript>
 <strong>看个什么玩意儿?</strong>
</noscript>
```

看完页面结构后，很容易判断出这是`vue`框架编写的页面，并且使用了`webpack`打包构建工具。这时我们只要从`chunk-vendors.d9052322.js`、`app.567b1880.js`两个js文件入手就行了。

先来看到`chunk-vendors.d9052322.js`这个文件的文件名，从名字上可以初步判断，这是一个第三方模块或供应商模块的文件集合，通常，我们会将所有`/node_modules`中的第三方包打包到`chunk-vendors.js`中。

因此，网站的业务逻辑肯定是在`app.567b1880.js`这个文件里边了，我们只需要重点关注这个文件就行了。对其代码格式化后，我们可以看到，以下又是我们不容易理解的一大段代码：

![decipher-https-message-06.png](https://www.zzcyes.com/images/decipher-https-message-06.png)

这很明显是被开发者混淆了代码，但是，混淆不混淆的没关系，我们只要找到我们关心的代码关键字就行，在js文件里搜索接口路径名的关键字`getByItems`:

![decipher-https-message-07.png](https://www.zzcyes.com/images/decipher-https-message-07.png)

我们聚焦到`then`里边的函数，当成功返回接口数据后，有以下两个操作：`JSON.parse(a(decodeURIComponent(t.data)))`和`JSON.parse(a(decodeURIComponent(t.items)))`，可以看出，这里对`t.data`和`t.items`都进行了相同的转化。

```js
"jx" !== g && "pt" !== g || O.dispatch("getByItems", {
    orderid: v,
    mode: g,
    language: O.state.currlanguage
}).then((function(t) {
    if (0 !== t.errCode)
        return d["a"].error(t.errMsg).then((function() {
            s.push("/")
        }
        ));
    t.data = JSON.parse(a(decodeURIComponent(t.data))),
    O.state.items = JSON.parse(a(decodeURIComponent(t.items))),
    e.value = t.data,
    m.value = !1
}
))
```

`JSON.parse`和`decodeURIComponent`这两个都是js自带的两个函数，我们需要把重心放在`a`这个被混淆的函数上，那么问题来了，我们怎么查看这个`a`函数呢，全局搜索吗？肯定不是啦，这时候就要用到谷歌浏览器自带的`Overrides`调试功能了。

通过`Overrides`功能，我们能将网站的`app.567b1880.js`文件替换成本地文件并进行调试，在这里，我们把原有的`app.567b1880.js`文件复制一份放到本地，然后在`Overrides`面板出添加本地文件路径，启用`Enable Local Overrides`选项

![decipher-https-message-08.png](https://www.zzcyes.com/images/decipher-https-message-08.png)

接着，我们在回到刚刚找到的接口路径名的关键字`getByItems`所在行，点击左侧行数添加断点调试

![decipher-https-message-09.png](https://www.zzcyes.com/images/decipher-https-message-09.png)

此时刷新网页，就能进入到`debugger`的断点调试了。此外，按`F10`或者“下一步”的按钮，可以执行下一步的断点

![decipher-https-message-10.png](https://www.zzcyes.com/images/decipher-https-message-10.png)

```js
t.data = JSON.parse(a(decodeURIComponent(t.data))),
O.state.items = JSON.parse(a(decodeURIComponent(t.items))),
```

到这里，其实我们只要关注`t.data`和`O.state.items`的值，就能解出加密报文中`data`和`items`的值了

![decipher-https-message-11.png](https://www.zzcyes.com/images/decipher-https-message-11.png)

至此，报文就被破解成功了！但是......还记得我们之前说的解密流程么，我们首先得确定加密协议，才可以解密。

刚刚我们也看到了`a`这个被混淆的函数时解密的关键，那么我们现在继续深入它，通过断点调试进入到`a`函数，我们可以看到`a`函数的构造

![decipher-https-message-12.png](https://www.zzcyes.com/images/decipher-https-message-12.png)

```js
function a(e) {
    var t = Ot.a.enc.Utf8.parse(st)
      , c = Ot.a.AES.decrypt(e, t, {
        mode: Ot.a.mode.ECB,
        padding: Ot.a.pad.Pkcs7
    });
    return Ot.a.enc.Utf8.stringify(c).toString()
}
```

在这里，我们提取几个关键字：`enc`、`AES`、`ECB`和`Pkcs7`，重点在`AEC`，这很明显用的是`AES加密算法(Advanced Encryption Standard)`。

再仔细观察，这里的`decrypt`的函数传参中有`mode: Ot.a.mode.ECB,`、`Ot.a.pad.Pkcs7`，再结合`AES加密算法`，又可以确定，这里的加密算法采用的是`ECB`的工作模式，如下图

![decipher-https-message-13.png](https://www.zzcyes.com/images/decipher-https-message-13.png)

这张图的关键字是`相同的输入产生相同的输出`，可以理解为，如果密钥不变，每次加密相同的报文，那么最后加密得到的密文块是一样的。我们也可以对比下每次的请求返回的加密报文数据，可以发现，其实每次返回的`data`和`items`都是相同的，那么我们就可以确定，在这里的密钥也是固定的，既然密钥是固定的，那么对于前端来说，要想解密报文把数据展示在页面上，这个密钥必然是绕不开前端的。因此，我们可以从前端出发，把密钥找出来。

### 破解密钥

再聚焦到刚才打断点的`a`函数的内容

```js
 function a(e) {
  var t = Ot.a.enc.Utf8.parse(st) 
    , c = Ot.a.AES.decrypt(e, t, { 
      mode: Ot.a.mode.ECB,
      padding: Ot.a.pad.Pkcs7
  });
  return Ot.a.enc.Utf8.stringify(c).toString()
}
```

我们把函数中的变量都标出来（在这里是`a(t.data)`的执行上下文）

![decipher-https-message-14.png](https://www.zzcyes.com/images/decipher-https-message-14.png)

![decipher-https-message-15.png](https://www.zzcyes.com/images/decipher-https-message-15.png)


我们先看到`Ot.a`，这是一个加密库包，加上该加密算法为`AES加密算法`，我们很容易联想到前端常用的一个加密库`crypto-js.js`，既然知道了前端加解密用的是`crypto-js.js`，我们接下来只要用这个库包去验证即可。

```html
<!DOCTYPE html>
<html>
<head>
    <title>crypto-js</title>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
</head>
<body>
    <script type="text/javascript">
        console.log('CryptoJS', CryptoJS);
    </script>
</body>

</html>
```

打开浏览器控制台，可以看到这里引入的库包`CryptoJS`构造和`Ot.a`是一样的，那么我们解密的时候就可以根据库包来判断解密函数中的每个变量的含义了。

![decipher-https-message-16.png](https://www.zzcyes.com/images/decipher-https-message-16.png)

`CryptoJS`文档描述

![decipher-https-message-17.png](https://www.zzcyes.com/images/decipher-https-message-17.png)

```js
// 混淆函数
function a(e) {
  var t = Ot.a.enc.Utf8.parse(st) 
    , c = Ot.a.AES.decrypt(e, t, { 
      mode: Ot.a.mode.ECB,
      padding: Ot.a.pad.Pkcs7
  });
  return Ot.a.enc.Utf8.stringify(c).toString()
}
```

既然`Ot.a`对应的是`CryptoJS`，那我们就根据`CryptoJS`文档描述把混淆的函数稍作修改以下

```js
// 优化
function decrypt(encryptText) {
  var passphrase = CryptoJS.enc.Utf8.parse(passphraseText) 
    , decryptText = CryptoJS.AES.decrypt(encryptText, passphrase, { 
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
  });
  return CryptoJS.enc.Utf8.stringify(decryptText).toString()
}
```

在这里我们可以暂时忽略`CryptoJS.enc.Utf8.parse`和`CryptoJS.enc.Utf8.stringify`这两个函数，我们只要知道它是一个编码转换的函数即可。

```js
// CryptoJS can convert from encoding formats such as Base64, Latin1 or Hex to WordArray objects and vice-versa.
var words = CryptoJS.enc.Utf8.parse(" ");
var utf8 = CryptoJS.enc.Utf8.stringify(words);
```

现在我们需要重点关心的是`passphraseText`，根据文档描述可以确定`passphraseText`是密钥了。而`passphraseText`在混淆函数中对应的又是`st`了，我们只需要在`app.567b1880.js`文件中搜索`st`的来源，就能得到密钥了

![decipher-https-message-18.png](https://www.zzcyes.com/images/decipher-https-message-18.png)

通过查找，我们可以看到`Object(ft["MD5"])("by ilil").toString().substring(0, 16)`的值赋给了`st`

```js
st = Object(ft["MD5"])("by ilil").toString().substring(0, 16)
```

我们从这段函数表达式中提取关键的信息`Object(ft["MD5"])("by ilil")`，可以推测出这里是用了`MD5`对`by ilil`进行了加密，然后把得到的值字符串化后截取了0~16位。此时我们如果继续在`app.567b1880.js`文件中搜索`ft`函数会得到如下内容

```js
ft = c("3452")
```

而`c(3452)`又在`chunk-vendors.d9052322.js`文件中，之前也提到过，`chunk-vendors.d9052322.js`是个第三方依赖的库包

![decipher-https-message-19.png](https://www.zzcyes.com/images/decipher-https-message-19.png)

我们可以看到`3452`标识的匿名函数中的内容是被混淆过的，此时我们继续追溯下去会难查到源头。

既然是通过`MD5`去对密钥做了一层加密，那么，我们可以可以用`CryptoJS`自带的`MD5`函数去验证，最后得到`st`即`passphraseText`密钥为`a1b15f44ab22f260`

```js
Object(CryptoJS.MD5("by ilil")).toString().substring(0, 16); // a1b15f44ab22f260
```

### 解密报文

我们有了密钥`a1b15f44ab22f260`，再继续看到之前我们优化过的混淆函数

```js 
function decrypt(encryptText) {
  var passphrase = CryptoJS.enc.Utf8.parse(passphraseText) 
    , decryptText = CryptoJS.AES.decrypt(encryptText, passphrase, { 
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
  });
  return CryptoJS.enc.Utf8.stringify(decryptText).toString()
}
```

现在`encryptText`和`passphraseText`这两个变量我们都确定了，那么接下来只要解密就行了，把这两个参数带入进函数中，最终就能返回我们想要的解密后的报文了。

![decipher-https-message-20.png](https://www.zzcyes.com/images/decipher-https-message-20.png)

```json 
'{"HartCheck":false,"HartCombo":120,"StaminaCheck":false,"StaminaCombo":3000,"RupeeCheck":false,"RupeeBox":999999,"MamoCheck":false,"MamoBox":999999,"KorokCheck":false,"KorokBox":900,"RebornCheck":false,"RebornBox":999,"MotoCheck":false,"MotoDisabled":false,"MasterOpenCheck":false,"MasterOpenDisabled":false,"StockCheck":false,"StockDisabled":false,"RelicCheck":false,"RelicDisabled":false,"BossCheck":false,"BossDisabled":false,"MapCheck":false,"MapDisabled":false,"TransferShowCheck":false,"TransferShowDisabled":false,"TransferCheck":false,"TransferDisabled":false,"Item":{"weapons":[],"bows":[],"arrow":[],"shields":[],"clothes":[],"materials":[],"food":[],"other":[],"horse":[]}}'
```

## 文章

- [浅谈前端JS加密报文的几种破解方法 - Curz0n's Blog](https://curz0n.github.io/2019/12/24/js-decrypt/#0x00-前言)

- [AES加解密-CBC ECB - 独孤剑—宇枫 - 博客园](https://www.cnblogs.com/xzj8023tp/p/12970790.html)

- [分组对称加密模式:ECB/CBC/CFB/OFB缺CTR - Ady Lee - 博客园](https://www.cnblogs.com/adylee/archive/2007/09/14/893438.html)

- [塞尔达传说：荒野之息](https://botw.ilil.me/pt/0)