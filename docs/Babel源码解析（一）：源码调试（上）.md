# Babel源码解析（一）：源码调试（上）

## Versions
开发环境、npm包版本信息：

| 名称 | 版本 |
| --- | --- |
| babel | v7.20.6 |
| node | v16.16.0 |
| npm | v8.11.0 |
| OS | macOS 13.1 (22C65) |

### Fork Babel 

首先，打开 babel 在 Github 上的链接 [https://github.com/babel/babel](https://github.com/babel/babel)，把 babel 项目 Fork 到自己的仓库

![babel-source-debugger-001.png](../images/babel-source-debugger-001.png)

仓库名字自己设置，这里勾选了只保留 main 分支

![babel-source-debugger-002.png](../images/babel-source-debugger-002.png)


Fork 成功之后，把 forked 的项目 clone 到本地环境 

![babel-source-debugger-003.png](../images/babel-source-debugger-003.png)


```powershell
git clone https://github.com/zzcyes/babel-forked-v7.20.6.git
```

## Babel 环境准备

### 构建 lib 包

clone 项目成功之后，先进入到 CONTRIBUTING.md 文档中，根据提示安装 babel 的环境

```powershell
# Then, run:
make bootstrap 
# Then you can either run:
make build 
# to build Babel once or:
make watch 
# to have Babel build itself and incrementally build files on change.
# You can access the built files for individual packages from packages/<package-name>/lib.
# If you wish to build a copy of Babel for distribution, then run:
make build-dist
```

首先进行一次编译，把 packages 下的 babel 分别构建到自己目录下的 lib 中  

```powershell
make bootstrap
# or
make build 
```

![babel-source-debugger-004.png](../images/babel-source-debugger-004.png)

在这里，babel 默认构建出来的 lib 包是 CmmonJS 类型的，而如果本地是在是在 node 环境下调试 babel， 那么，可以直接使用构建出来 lib 包。如果不是，则需要切换到 ECMAScript Modules 规范。

![babel-source-debugger-005.png](../images/babel-source-debugger-005.png)

### 切换 lib 包输出的规范

babel 提供了以下命令去切换构建出来的包的规范

```powershell
# ECMAScript modules
make use-esm 

# CommonJS
make use-cjs
```

### Babel Watch

通过运行 make watch 命令后，如果修改了相应 packages 下 babel 的文件，监听之后会重新 build 一份所修改文件的 lib 输出

```powershell
make watch
```

来到 packages/babel-generator/src/index.ts 文件下， 在 Generator 的构造函数内加了一段 console.log

![babel-source-debugger-006.png](../images/babel-source-debugger-006.png)

回到控制台，会发现，已经监听到了当前文件下的改动，并重新对该文件进行了 build

![babel-source-debugger-007.png](../images/babel-source-debugger-007.png)

进入到对应的 lib 下，可以看到刚刚新增的 console.log 已经 build 出来了

![babel-source-debugger-008.png](../images/babel-source-debugger-008.png)

## Babel Link

为了方便在本地调试 babel, 可以使用 npm 提供的 link 方法。

### Link Babel 到全局

这里以 babel-generator 为例， 首先进入到 babe-generator 的目录下：babel-forked-v7.20.6/packages/babel-generator/
通过运行 npm link 命令，可以把当前 babel-generator 链接到全局 npm 包下

```shell
npm link
```

![babel-source-debugger-009.png](../images/babel-source-debugger-009.png)

查看 npm 全局安装路径

```shell
 npm prefix --location=global
```

在本机上拿到的全局安装路径为 /Users/zhongzichen/.nvm/versions/node/v16.16.0 

![babel-source-debugger-010.png](../images/babel-source-debugger-010.png)


拿到路径后，接着进入到 node_modules 下，可以看到刚刚 link 的 babel-generator 包出现了，只不过目录结构是 @babel/generator，这是因为 npm link 默认是根据 package.json 的 name 名字来链接的。 

![babel-source-debugger-011.png](../images/babel-source-debugger-011.png)

### 引用全局 babel 

在本地调试 babel 的项目路径下，输入 npm link @babel/generator 可以把当前项目的 @babel/generator  包的引用指向 npm 的全局下。
在本地有个 babel-particle 的项目，在 src/babel-generator/index.js 下，写了一段代码

![babel-source-debugger-012.png](../images/babel-source-debugger-012.png)

这段代码的功能是，把 code.ast.json 文件的 ast 通过 @babel/generator 提供的 generator 解析为 code：var a = 1；

index.js

```shell
const generator = require("@babel/generator").default;
const ast = require("./code.ast.json");
const code = generator(ast).code;

console.log('code is:', code);
```

在 babel-parctice 目录下，输入命令 npm link @babel/generator ，把当前项目下的引用的 @babel/generator 链接到 npm 全局模块下了。

![babel-source-debugger-013.png](../images/babel-source-debugger-013.png)

为了验证项目中引用的  @babel/generator  是否成功链接到全局目录下，可以通过以下两种方法检验：

1. package-lock.json

通过查看，package-lock.json, 会发现 "node_modules/@babel/core/node_modules/@babel/generator" 下多了 resolved 属性，对应的值恰为刚刚 link 到全局目录下 @babel/generator  的真实链接路径  "file:../babel-forked-v7.20.6/packages/babel-generator"

![babel-source-debugger-014.png](../images/babel-source-debugger-014.png)

如果使用的是 yarn 的话，需要在 yarn.lock 文件下查看

![babel-source-debugger-015.png](../images/babel-source-debugger-015.png)

1. 打印日志

在链接的 @babel/generator 全局模块下打印日志
在 packages/babel-generator/index.ts 中，对 Generator 的构造函数添加 console.log ，并输入命令 make build 重新构建 lib。

![babel-source-debugger-016.png](../images/babel-source-debugger-016.png)

接着，输入 node index.js 命令,运行 babel-practice/src/babel-generator 目录下的 index.js 文件，会看到控制台中，输出了刚刚我们在全局模块包中打印的日志，这意味着当前项目已经成功链接到 npm 全局模块中了。 

![babel-source-debugger-017.png](../images/babel-source-debugger-017.png)
