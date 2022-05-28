



## Redux源码阅读（六）：compose

## 使用案例

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

## 源码分析

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

