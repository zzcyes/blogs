# node读取csv格式文件

## 文本内容

.csv文件内容

```plain
姓名,配音,简介
伍六七,何小疯,热血、贱、内心柔软故事男主角，没有记忆，身世是个谜，在大保健发廊做理发师，能够以气御剪，为了寻找自己的过去，走上了刺客之路。
鸡大保,姜广涛,社会、拜金、讲义气聪明的蓝羽鸡，大保健发廊老板兼伍六七的刺客经理人，为了赚大钱怂恿伍六七当刺客，实际身份不明。
小飞鸡,赵寒,蠢萌鸡大保的养子，是一只擅长飞行的鸡，负责运送伍六七到任务地点。愤怒时会激发他的隐藏能力，进入另外一个形态。
梅花十三,段艺璇,冷酷、果断，故事女主角，玄武国女刺客，排名37位，擅长使用双刀流和梅花镖，发辫上的短刃可以用于攻击。
```

excel展示

![image.png](https://gitee.com/zzcyes/repository/raw/master/images/node-csv-202109291707062.png)

## 读取文本内容

- 方法一

```javascript
const file = fs.readFileSync('./data.csv', 'utf8');
console.log(file);
```

- 方法二

```javascript
const rs = fs.createReadStream('./data.csv');
rs.on('data', function(chunk) {
  console.log(chunk.toString());
});
```

打印文件内容如下：

![image.png](https://gitee.com/zzcyes/repository/raw/master/images/node-csv-202109291710033.png)

## 插件

### csvtojson

#### 安装

```shell
npm install csvtojson
```

#### 引入

```javascript
const csv = require('csvtojson')
```

#### 使用

```javascript
csv()
	.fromFile('./data.csv')
	.then((res) => {
  	console.log(res);
	})
```

#### 实例

```javascript
const csv = require('csvtojson')
const fs = require('fs');

csv()
  .fromFile('./data.csv')
  .then((res) => {
    console.log(res);
    // 保存内容到index.json文件
    fs.writeFileSync('./index.json', JSON.stringify(res, null, 4))
  });
```

- index.json

```javascript
[
  {
    '姓名': '伍六七',
    '配音': '何小疯',
    '简介': '热血、贱、内心柔软故事男主角，没有记忆，身世是个谜，在大保健发廊做理发师，能够以气御剪，为了寻找自己的过去，走上了刺客之路。'
  },
  {
    '姓名': '鸡大保',
    '配音': '姜广涛',
    '简介': '社会、拜金、讲义气聪明的蓝羽鸡，大保健发廊老板兼伍六七的刺客经理人，为了赚大钱怂恿伍六七当刺客，实际身份不明。'
  },
  {
    '姓名': '小飞鸡',
    '配音': '赵寒',
    '简介': '蠢萌鸡大保的养子，是一只擅长飞行的鸡，负责运送伍六七到任务地点。愤怒时会激发他的隐藏能力，进入另外一个形态。'
  },
  {
    '姓名': '梅花十三',
    '配音': '段艺璇',
    '简介': '冷酷、果断，故事女主角，玄武国女刺客，排名37位，擅长使用双刀流和梅花镖，发辫上的短刃可以用于攻击。'
  }
]
```

#### 核心原理

- 插件入口：./v2/index.js

```javascript
"use strict";
var Converter_1 = require("./Converter");
var helper = function(param, options) {
    return new Converter_1.Converter(param, options);
};
helper["csv"] = helper;
helper["Converter"] = Converter_1.Converter;
module.exports = helper;
//# sourceMappingURL=index.js.map
```

- ./v2/Converter.js

```javascript
// ...
Converter.prototype.fromFile = function(filePath, options) {
  var _this = this;
  var fs = require("fs");
  // var rs = null;
  // this.wrapCallback(cb, function () {
  //   if (rs && rs.destroy) {
  //     rs.destroy();
  //   }
  // });
  fs.exists(filePath, function(exist) {
    if (exist) {
      var rs = fs.createReadStream(filePath, options);
      rs.pipe(_this);
    } else {
      _this.emit('error', new Error("File does not exist. Check to make sure the file path to your csv is correct."));
    }
  });
  return this;
};
// ... 
```

## 资源

- [csv和excel读取和下载 - 掘金](https://juejin.cn/post/6844903619846897672)
- [Keyang/node-csvtojson: Blazing fast and Comprehensive CSV Parser for Node.JS / Browser / Command Line.](https://github.com/Keyang/node-csvtojson)
