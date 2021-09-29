# 内容安全策略（CSP）

## 概念

**内容安全策略**（英语：Content Security Policy，简称CSP）是一种计算机安全标准，旨在防御跨站脚本、点击劫持等代码注入攻击，阻止恶意内容在受信网页环境中执行。[[1\]](https://zh.wikipedia.org/zh-hans/内容安全策略#cite_note-Stamm_2009-1)这一标准是W3C网络应用安全工作组的候选推荐标准，被现代网页浏览器广泛支持。

CSP 是一个额外的安全层，用于检测并削弱某些特定类型的攻击，包括跨站脚本 (XSS) 和数据注入攻击等。无论是数据盗取、网站内容污染还是散发恶意软件，这些攻击都是主要的手段。

为使CSP可用, 你需要配置你的网络服务器返回  `Content-Security-Policy`  HTTP头部 ( 有时你会看到一些关于`X-Content-Security-Policy`头部的提法, 那是旧版本，你无须再如此指定它)。

除此之外, `<meta>` 元素也可以被用来配置该策略:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src https://*; child-src 'none';">
```

## 使用CSP

你可以用`Content-Security-Policy` HTTP 头部来指定你的策略，像这样：

```plain
Content-Security-Policy: policy
```

policy参数是一个包含了各种描述你的CSP策略指令的字符串。

### CSP: default-src

- `child-src`
- `connect-src`

- `font-src`
- `frame-src`

- `img-src`
- `manifest-src`

- `media-src`
- `object-src`

- `script-src`
- `style-src`

- `worker-src`

## 语法

`default-src` 策略允许指定一个或多个源：

```plain
Content-Security-Policy: default-src <source>;
Content-Security-Policy: default-src <source> <source>;
```

## 资源

- [内容安全策略( CSP ) - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP)
- [CSP: default-src - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy/default-src)