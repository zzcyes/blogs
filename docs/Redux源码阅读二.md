



## Redux 源码阅读（二）

## 源码目录

redux 源码目录如下：

```
|-- redux
    |-- dist                      # 打包后的 redux、source map 文件
    |-- docs                      # 官方文档说明
    |-- es                        # 打包后支持 ES Modules 的 redux、source map 文件 
    |-- examples                  # 官方案例包括 counter、todomvs等等
    |-- lib                       # 打包后支持 CommonJS 的 redux、source map 文件   
    |-- logo                      # logo图标
    |-- scripts                   # 存放 js 文件
        |-- mangleErrors.js           # babel 插件，记录错误信息到 errors.json 文件
    |-- src                       # 核心 API 代码
        |-- types                     # 部分核心类的 ts 类型
        |-- utils                     # 工具类
    |-- test                      # 单元测试
    |-- types                     # 核心代码
        |-- types                     # 部分核心类的声明
        |-- utils                     # 工具类的声明
    |-- website                   # 使用 docusaurus 搭建官方文档的静态网站
```

我们主要关注 src 和 types 这两个目录。

- redux/src

  核心 API 都在 src 的根目录下，除此外，src/utils 目录下放的是一些工具函数类，types 是核心类的 ts 类型。

```
|-- redux
    |-- src
    |   |-- applyMiddleware.ts
    |   |-- bindActionCreators.ts
    |   |-- combineReducers.ts
    |   |-- compose.ts
    |   |-- createStore.ts
    |   |-- index.ts
    |   |-- types
    |   |   |-- actions.ts
    |   |   |-- middleware.ts
    |   |   |-- reducers.ts
    |   |   |-- store.ts
    |   |-- utils
    |       |-- actionTypes.ts
    |       |-- formatProdErrorMessage.ts
    |       |-- isPlainObject.ts
    |       |-- kindOf.ts
    |       |-- symbol-observable.ts
    |       |-- warning.ts
    
```

- redux/types

  types 目录下都是核心 API 和工具类的声明文件，并且文件结构与 redux/src 是一一对应的。

```
|-- redux
    |-- types
        |   |-- applyMiddleware.d.ts
        |   |-- bindActionCreators.d.ts
        |   |-- combineReducers.d.ts
        |   |-- compose.d.ts
        |   |-- createStore.d.ts
        |   |-- index.d.ts
        |   |-- types
        |   |   |-- actions.d.ts
        |   |   |-- middleware.d.ts
        |   |   |-- reducers.d.ts
        |   |   |-- store.d.ts
        |   |-- utils
        |       |-- actionTypes.d.ts
        |       |-- formatProdErrorMessage.d.ts
        |       |-- isPlainObject.d.ts
        |       |-- kindOf.d.ts
        |       |-- symbol-observable.d.ts
        |       |-- warning.d.ts
```

## 源码入口

我们阅读源码的时候可以直接看 redux/src  目录下的 ts 文件，这样方便阅读。碰到有疑惑的点，则可以通过打包构建后的 redux.js 文件进行 debugger 调试，并且在 redux.js 文件末尾加上一行注释  `//# sourceMappingURL=redux.js.map` ，可以映射到 sourece map 文件，进而在我们 debugger 调试的时候访问到 redux/src 目录下的 ts 文件。

- redux/src/index.ts

  index.ts 是源码入口文件，在这个文件可以划分为两个部分。

  第一部分是从 redux/src/types 目录下导出 ts 类型。

  ```typescript
  // ...
  
  // types
  // store
  export {
    CombinedState,
    PreloadedState,
    Dispatch,
    Unsubscribe,
    Observable,
    Observer,
    Store,
    StoreCreator,
    StoreEnhancer,
    StoreEnhancerStoreCreator,
    ExtendState
  } from './types/store'
  // reducers
  export {
    Reducer,
    ReducerFromReducersMapObject,
    ReducersMapObject,
    StateFromReducersMapObject,
    ActionFromReducer,
    ActionFromReducersMapObject
  } from './types/reducers'
  // action creators
  export { ActionCreator, ActionCreatorsMapObject } from './types/actions'
  // middleware
  export { MiddlewareAPI, Middleware } from './types/middleware'
  // actions
  export { Action, AnyAction } from './types/actions'
  
  // ...
  ```

  第二部分则是通过 export 导出了 redux 的五个核心 API：createStore、combineReducers、bindActionCreators、applyMiddleware 和 compose。

  ```typescript
  // ...
  
  export {
    createStore,
    combineReducers,
    bindActionCreators,
    applyMiddleware,
    compose,
    __DO_NOT_USE__ActionTypes
  }
  ```

### compose

compose 是函数式编程中的方法，为了方便被放到了 Redux 里边。 compose 函数返回值是从右到左把接收到的函数合成后的最终函数。官方给的 demo 如下：

```diff
// ...
const store = createStore(
  reducer,
- applyMiddleware(thunk),
- DevTools.instrument(),
+ compose(applyMiddleware(thunk), DevTools.instrument())
)
```

- redux/src/compose.ts

  可以看到 compose.ts 文件下，通过 export default 导出了 compose 函数，其中前七个导出是 ts 的类型声明，最后一个才是 compose 的具体实现。

```typescript
// ...
export default function compose(): <R>(a: R) => R

export default function compose<F extends Function>(f: F): F

/* two functions */
export default function compose<A, T extends any[], R>(
  f1: (a: A) => R,
  f2: Func<T, A>
): Func<T, R>

/* three functions */
export default function compose<A, B, T extends any[], R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func<T, A>
): Func<T, R>

/* four functions */
export default function compose<A, B, C, T extends any[], R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func<T, A>
): Func<T, R>

/* rest */
export default function compose<R>(
  f1: (a: any) => R,
  ...funcs: Function[]
): (...args: any[]) => R

export default function compose<R>(...funcs: Function[]): (...args: any[]) => R

export default function compose(...funcs: Function[]) {
    if (funcs.length === 0) {
    // infer the argument type so it is usable in inference down the line
    return <T>(arg: T) => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce(
    (a, b) =>
      (...args: any) =>
        a(b(...args))
  )
}
```

compose 具体实现如下：

```typescript
export default function compose(...funcs: Function[]) {
  // 若没有传参，则直接返回一个默认函数，该函数的返回值为默认函数的第一个传参 
  // compose()("a","b","c") => "a"
  if (funcs.length === 0) {
    // infer the argument type so it is usable in inference down the line
    return <T>(arg: T) => arg
  }
  // 传入参数只有一个时，则直接返回这个传参
  // 疑问：当传参只有一个的时，其实调用funcs.reduce...也会直接返回funcs[0]
  // 这里判断 funcs.length === 1 是为了方便理清函数逻辑吗？
  if (funcs.length === 1) {
    return funcs[0]
  }
  
  return funcs.reduce(
    (a, b) =>
      (...args: any) =>
        a(b(...args))
  )
}
```

#### Redux compose Hisrory

## 链接

- [compose | Redux](https://redux.js.org/api/compose)
- [Redux之compose - 掘金](https://juejin.cn/post/6844903853721124872)

- [feat(compose): optimize one function case (#1701) · reduxjs/redux@050d425](https://github.com/reduxjs/redux/commit/050d42517330f9bbed73d37c13de84ea83a87230)

- [Simplify composer · reduxjs/redux@44dfc39](https://github.com/reduxjs/redux/commit/44dfc39c3f8e5e8b51eeab7c44057da6c1086752)

