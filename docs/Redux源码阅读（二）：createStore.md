# Redux 源码阅读（二）：createStore

## 使用案例

把用于计数器的 counterReducer 传入 createStore 中生成 一个 counterStore，最后通过 console.debug 打印出来。

```typescript
const { createStore } = require('redux');
const { counterReducer } = require('./reducer')
const counterStore = createStore(counterReducer);
console.debug('counterStore', counterStore)
```

输出结果如下，可以看到通过 createStore 函数生成返回的是一个对象，该对象包含了 `dispatch`、`subscribe`、`getState`、`replaceReducer` 和 `@@observable` 属性，并且它们的值都是函数对象。

```typescript
counterStore {
  dispatch: [Function: dispatch],
  subscribe: [Function: subscribe],
  getState: [Function: getState],
  replaceReducer: [Function: replaceReducer],
  '@@observable': [Function: observable]
}
```

## 源码概览

- redux/src/createStore.ts

  通过 export default 导出了 createStore 函数，其中前两个导出是 ts 的类型声明，最后一个才是 createStore 的具体实现。

  ```typescript
  export default function createStore<
    S,
    A extends Action,
    Ext = {},
    StateExt = never
  >(
    reducer: Reducer<S, A>,
    enhancer?: StoreEnhancer<Ext, StateExt>
  ): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  
  export default function createStore<
    S,
    A extends Action,
    Ext = {},
    StateExt = never
  >(
    reducer: Reducer<S, A>,
    preloadedState?: PreloadedState<S>,
    enhancer?: StoreEnhancer<Ext, StateExt>
  ): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  
  export default function createStore<
    S,
    A extends Action,
    Ext = {},
    StateExt = never
  >(
    reducer: Reducer<S, A>,
    preloadedState?: PreloadedState<S> | StoreEnhancer<Ext, StateExt>,
    enhancer?: StoreEnhancer<Ext, StateExt>
  ): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext {
    // ...
    return store
  }
  ```
  
  createStore 函数的精简代码如下：
  
  ```typescript
  export default function createStore<
    S,
    A extends Action,
    Ext = {},
    StateExt = never
  >(
    reducer: Reducer<S, A>,
    preloadedState?: PreloadedState<S> | StoreEnhancer<Ext, StateExt>,
    enhancer?: StoreEnhancer<Ext, StateExt>
  ): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext {
    // part one
    if (
      (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
      (typeof enhancer === 'function' && typeof arguments[3] === 'function')
    ) { // ...}
    if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') { // ...}
    if (typeof enhancer !== 'undefined') { //...}
    if (typeof reducer !== 'function') { // ...}
    
    // part two
    let currentReducer = reducer
    let currentState = preloadedState as S
    let currentListeners: (() => void)[] | null = []
    let nextListeners = currentListeners
    let isDispatching = false
    
    // part three
    function ensureCanMutateNextListeners() { // ...}
    function getState() { // ...}
    function subscribe() { // ...}
    function dispatch() { // ...}
    function replaceReducer() { // ...}
    function observable() { // ...}
  
    // part four    
    dispatch({ type: ActionTypes.INIT } as A)
   
    // part five
    const store = {
      dispatch: dispatch as Dispatch<A>,
      subscribe,
      getState,
      replaceReducer,
      [$$observable]: observable
    } as unknown as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
    return store
  }
  ```
  

createStore 函数可分为五个部分：

1. 对校验函数传参、异常处理等操作
2. 声明变量：currentReducer、currentState 等
3. 声明函数：ensureCanMutateNextListeners、getState 等
4. dispacth 初始化
5. 声明 store ，return store


## createStore 传参

```typescript
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S> | StoreEnhancer<Ext, StateExt>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext { 
    // ...
    return store
}
```

### reducer

一个 reducer 函数，它返回下一个 state tree ，给定当前 state tree 和要处理的 action。

### preloadedState

preloadedState 是预加载的 state，即为 state 的初始化值，可选参数。

### enhancer

store 增强器，可选参数。可以选择指定它以使用第三方功能（例如中间件、时间旅行、持久性等）来增强存储。Redux 附带的唯一 store 增强器是 `applyMiddleware()` 。

## createStore 返回值

createStore 函数的返回值是一个 store 对象

```typescript
const store = {
    dispatch: dispatch as Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
} as unknown as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
```

### dispatch

```typescript
function dispatch(action: A) {
  if (!isPlainObject(action)) {
    throw new Error(
      `Actions must be plain objects. Instead, the actual type was: '${kindOf(
        action
      )}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
    )
  }

  if (typeof action.type === 'undefined') {
    throw new Error(
      'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.'
    )
  }

  if (isDispatching) {
    throw new Error('Reducers may not dispatch actions.')
  }

  try {
    isDispatching = true
    currentState = currentReducer(currentState, action)
  } finally {
    isDispatching = false
  }

  const listeners = (currentListeners = nextListeners)
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i]
    listener()
  }

  return action
}
```

dipatch 函数内部做了什么？可以分为三个部分: 校验传参、执行 reducer 和触发订阅事件

1. 校验传参

```typescript
  // action 必须为一个对象且不能为 Object
  if (!isPlainObject(action)) {
    throw new Error(
      `Actions must be plain objects. Instead, the actual type was: '${kindOf(
        action
      )}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
    )
  }
  // action 必须包含 type
  if (typeof action.type === 'undefined') {
    throw new Error(
      'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.'
    )
  }
  // 如果有正在执行的 actions，抛出异常
  if (isDispatching) {
    throw new Error('Reducers may not dispatch actions.')
  }
```

2. 执行reducer

```typescript
  try {
    isDispatching = true
    currentState = currentReducer(currentState, action)
  } finally {
    isDispatching = false
  }
```

这段代码主要是通过执行 currentReducer 来更新当前 state 的值。在创建 createStore 函数时，会通过 `let currentState = preloadedState`，把 createStore 函数传参 preloadedState 的值赋给 currentState 去初始化 state 的值。

此外，在 createStore 函数返回 store 前，会执行 `dispatch({ type: ActionTypes.INIT } as A)` 这段方法来初始化 currentState 默认值。为什么这里也有一个初始化 state 值的操作呢。可看如下案例:

```typescript
  const { createStore } = require('redux');
  const initState = { value: 0 };
  const counterReducer = (state = initState, action) => {
      switch (action.type) {
          case "counter/incremented":
              return {...state, value: state.value + 1 };
          case "counter/decremented":
              return {...state, value: state.value - 1 };
          default:
              return state;
      }
  };
  const store = createStore(counterReducer);
```

在这段案例中，通过 createStore 函数创建 store 时，这里并没有传递 state 的初始值 initState。意味着通过 `let currentState = preloadedState` 初始化 state 的值时，currentState 变成了 `undefined`。接着，在执行 `dispatch({ type: ActionTypes.INIT } as A)` 时，会触发 `currentState = currentReducer(currentState, action)` 这段代码的执行，我们把当前的 reducer 和 state 套上去会变成 `currentState = counterReducer(undefined, { type: ActionTypes.INIT })`，而在 counterReducer 函数的定义中，如果 state 未传参或未定义，便会初始化 state 的值为 initState。

到这里我们已经了解到了 state 初始化的两个方法。

3. 触发订阅事件

```typescript
  const listeners = (currentListeners = nextListeners)
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i]
    listener()
  }
```

这段代码主要逻辑是遍历订阅的事件, 并依次触发事件。

在这里把 nextListeners 值赋给 currentListeners，是因为在 unsubscribe 过程中，有 `nextListeners.splice(index, 1)` 操作，因此需要把 currentListeners 更新为最新值。如下：

```typescript
  return function unsubscribe() {
    // ...
    ensureCanMutateNextListeners()
    const index = nextListeners.indexOf(listener)
    nextListeners.splice(index, 1)
    currentListeners = null
  }
```

###  subscribe 和 unsubscribe

```typescript
function subscribe(listener: () => void) {
    // listener 必须为函数
    if (typeof listener !== 'function') {
      throw new Error(
        `Expected the listener to be a function. Instead, received: '${kindOf(
          listener
        )}'`
      )
    }

    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api/store#subscribelistener for more details.'
      )
    }

    let isSubscribed = true

    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    return function unsubscribe() {
      // 防止多次触发 unsubscribe
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api/store#subscribelistener for more details.'
        )
      }

      isSubscribed = false

      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
      currentListeners = null
    }
  }
```

subscribe 函数内部做了什么？可以分为三个部分: 校验传参、订阅事件和返回 unsubscribe 函数（取消订阅）。

1. 校验传参

```typescript
  // listener 必须为函数
  if (typeof listener !== 'function') {
    throw new Error(
      `Expected the listener to be a function. Instead, received: '${kindOf(
        listener
      )}'`
    )
  }
  // 如果正在执行 dispatch 抛出异常
  if (isDispatching) {
    throw new Error(
      'You may not call store.subscribe() while the reducer is executing. ' +
        'If you would like to be notified after the store has been updated, subscribe from a ' +
        'component and invoke store.getState() in the callback to access the latest state. ' +
        'See https://redux.js.org/api/store#subscribelistener for more details.'
    )
  }
```

2. 订阅事件

```typescript
  let isSubscribed = true

  ensureCanMutateNextListeners()
  nextListeners.push(listener)
```

这里有一段 `ensureCanMutateNextListeners` 函数，实现如下：

```typescript
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }
```

在这段代码中 `nextListeners === currentListeners`，nextListeners 和 currentListeners 都是数组，那么这段代码的作用其实就是对比他们的引用，当他们引用一致时，把 currentListeners 的值浅拷贝给 nextListeners ，消除相同引用下修改值时带来的影响。

3. 返回 unsubscribe 函数（取消订阅）

```typescript
  return function unsubscribe() {
    // 防止多次触发 unsubscribe
    if (!isSubscribed) {
      return
    }
    // 如果正在执行 dispatch 抛出异常
    if (isDispatching) {
      throw new Error(
        'You may not unsubscribe from a store listener while the reducer is executing. ' +
          'See https://redux.js.org/api/store#subscribelistener for more details.'
      )
    }

    isSubscribed = false

    ensureCanMutateNextListeners()
    const index = nextListeners.indexOf(listener)
    nextListeners.splice(index, 1)
    currentListeners = null
  }
```

unsubscribe 函数主要逻辑是查找需要取消订阅的事件，然后将其从事件列表中删除。


### getState

```typescript
  function getState(): S {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState as S
  }
```

getState 函数是一个闭包，返回 createStore 函数内部定义的 currentState 的值。

### replaceReducer

Redux store 暴露出一个 replaceReducer 函数，该函数使用新的 root reducer 替代当前活动的 root reducer。调用该函数将替换内部 reducer 的引用，并 dispatch 一个 action 以初始化新加入的 reducer：

```typescript
const newRootReducer = combineReducers({
  existingSlice: existingSliceReducer,
  newSlice: newSliceReducer
})

store.replaceReducer(newRootReducer)
```

replaceReducer 源码：

```typescript
  function replaceReducer<NewState, NewActions extends A>(
    nextReducer: Reducer<NewState, NewActions>
  ): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext {
    // nextReducer 必须为函数
   if (typeof nextReducer !== 'function') {
      throw new Error(
        `Expected the nextReducer to be a function. Instead, received: '${kindOf(
          nextReducer
        )}`
      )
    }

    // TODO: do this more elegantly
    ;(currentReducer as unknown as Reducer<NewState, NewActions>) = nextReducer

    dispatch({ type: ActionTypes.REPLACE } as A)
   
    return store as unknown as Store<
      ExtendState<NewState, StateExt>,
      NewActions,
      StateExt,
      Ext
    > &
      Ext
  }
```

replaceReducer 函数只接受一个传参 nextReducer，即为新引入的 reducer。

核心代码为这一行 `;(currentReducer as unknown as Reducer<NewState, NewActions>) = nextReducer`，把新的 reducer 赋值给 currentReducer 。在这段代码中，`;` 引起了我的注意，因为此前并没有见过这样的函数表达式，我们都知道在 JavaScript 语法中 `;` 标志着一段代码的结束。

待着疑惑我去查了下资料，`;` 放在行头是因为自动分号补齐 ( auto semicolon insertion，简称ASI ) 一个常见的坑：

```typescript
a = b
(function () { ... }())
```

会被解析成

```typescript
a = b(function () {...}());
```

像下面这样写便可以避免：

```typescript
a = b
;(function () { ... }())
```

此外，在这段核心代码的上一行有 `// TODO: do this more elegantly` 的注释。在 [7 really good reasons not to use TypeScript | by Michael Krasnov | JavaScript in Plain English](https://javascript.plainenglish.io/7-really-good-reasons-not-to-use-typescript-166af597c466) 这篇吐槽 typescript 文章也提到这段代码 `It is messy`。

在 repalceReducer return store 前，执行了这段代码 `dispatch({ type: ActionTypes.REPLACE } as A)`，其实这里跟之前 createStore 函数里边执行 ``dispatch({ type: ActionTypes.INIT } as A)` 是一样的道理，都是为了初始化 state。

最后 repalaceReducer 返回当前最新的 store。

### [$$observable]


```typescript
  const store = {
    dispatch: dispatch as Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  } as unknown as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
```

在 store 中, `$$observable` 是一个纯函数，源码如下：

```typescript
const $$observable = /* #__PURE__ */ (() =>
  (typeof Symbol === 'function' && Symbol.observable) || '@@observable')()
```

这里优先判断了 Symbol 是否支持 observable，如果 Symbol 是函数并且支持 observable，那么便返回 `Symbol.observable` 的值，否则返回 `@@observable`。

另外 `Symbol.observable` 是 https://github.com/tc39/proposal-observable 提案的一部分。现在主流浏览器并不支持。

接着来看下 observable 的实现：

```typescript
  /**
   * Interoperability point for observable/reactive libraries.
   * @returns A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */
  function observable() {
    const outerSubscribe = subscribe
    return {
      subscribe(observer: unknown) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError(
            `Expected the observer to be an object. Instead, received: '${kindOf(
              observer
            )}'`
          )
        }

        function observeState() {
          const observerAsObserver = observer as Observer<S>
          if (observerAsObserver.next) {
            observerAsObserver.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }
```
observable 这个方法，并没有在官方文档 store API 中提到这个方法，平时也使用不到。在函数开头有这么一段注释：

- 这是可观察/反应库的互操作性点。

- @returns状态变化的最小可观察对象。

- 如需更多信息，请参阅可观察提案: https://github.com/tc39/proposal-observable

## createStore 实现

### 校验传参、处理异常

```typescript
  // 校验 preloadedState 和 enhancer 传参
  // 1. 两者皆为函数类型，报错
  // 2. enhancer为函数，并且第四个传参也为函数类型
  // 如果要用多个store enhancers ，建议使用 compose 将其合并为单个函数传入
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      'It looks like you are passing several store enhancers to ' +
        'createStore(). This is not supported. Instead, compose them ' +
        'together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.'
    )
  }

  // 如果 preloadedState 为函数，并且 enhancer 未定义，那么把 preloadedState 的值赋予 enhancer
  // 并将 preloadedState 置为 undefined
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState as StoreEnhancer<Ext, StateExt>
    preloadedState = undefined
  }

  if (typeof enhancer !== 'undefined') {
    // enhancer 必须为函数类型
    if (typeof enhancer !== 'function') {
      throw new Error(
        `Expected the enhancer to be a function. Instead, received: '${kindOf(
          enhancer
        )}'`
      )
    }

    // 存在 enhancer 意味着需要增强 store，直接 return enhancer操作
    // 这里也可以判断出 enhancer 函数的返回值 与 createStore 的返回值是一样的
    return enhancer(createStore)(
      reducer,
      preloadedState as PreloadedState<S>
    ) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  }

  // reducer 必须为函数类型，否则报错
  if (typeof reducer !== 'function') {
    throw new Error(
      `Expected the root reducer to be a function. Instead, received: '${kindOf(
        reducer
      )}'`
    )
  }
```

### 声明变量

```typescript
let currentReducer = reducer 
let currentState = preloadedState as S 
let currentListeners: (() => void)[] | null = [] 
let nextListeners = currentListeners
let isDispatching = false
```

### 声明函数

1. ensureCanMutateNextListeners
2. getState
3. subscribe
4. dispatch
5. replaceReducer
6. observable

在上边分析 store 的时候已经把这些声明的函数分析过一遍了。在这里对 `ensureCanMutateNextListeners` 需要做额外的补充。

#### ensureCanMutateNextListeners

```typescript
/**
 * This makes a shallow copy of currentListeners so we can use
 * nextListeners as a temporary list while dispatching.
 *
 * This prevents any bugs around consumers calling
 * subscribe/unsubscribe in the middle of a dispatch.
 */
function ensureCanMutateNextListeners() {
  if (nextListeners === currentListeners) {
    nextListeners = currentListeners.slice()
  } 
```

这段注释的意思是，这可以防止用户在 dispatch 过程中调用 subscribe/unsubscribe 时出现任何bug。 

先前分析过，在 dispatch 过程中会遍历 listeners 事件列表，循环触发事件。

```javascript
  // 遍历订阅的事件并触发
  // 把 nextListeners 值赋给 currentListeners，是因为在 unsubscribe 
  // 过程中，有  nextListeners.splice 操作，需要把 currentListeners 
  // 更新为最新值
  const listeners = (currentListeners = nextListeners)
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i]
    listener()
  }
```

试想一下这样的场景：如果只有一个 listeners 去维护事件列表，那么当用户在 subscribe 或 unsubscribe 时又触发了 subscribe/unsubscribe , 会怎样呢？

首先简单构造下  subscribe、unsubscribe 和 dispatch 函数。

```javascript
const listeners = [];

const subscribe = (...args) => {
   listeners.push(...args);
}

const unsubscribe = (event) => {
  const index = listeners.indexOf(event);
  !!~index && listeners.splice(index, 1);
}

const dispatch = () => {
  for(let i = 0; i < listeners.length; i++) {
    const listener = listeners[i];
    listener();
  }
}
```

如下案例，listeners 维护了三个事件，三个事件分别打印 1、2、3。在遍历 listeners 时会依次触发这三个事件，打印输出结果依次为 1、2、3

```javascript
const log1 = () => console.log(1);
const log2 = () => console.log(2);
const log3 = () => console.log(3);

subscribe(log1, log2, log3);


dispatch();
// output
// 1 
// 2 
// 3
```

```javascript
const log = (value)=> () => console.log(value);

let log1 = log(1);
let log3 = log(3);
let log2 = () =>{
  const index = listeners.indexOf(log3);
  !!~index && listeners.splice(index, 1);
  console.log(2)
};

const listeners = [log1];

listeners.push(log2);
listeners.push(log3);

for(let i = 0; i < listeners.length; i++) {
	const listener = listeners[i];
	listener();
}
// output
// 1 
// 2 
```

<!-- ![redux-createstore-1.png]("../images/redux-createstore-1.png") -->

### 声明 store

```typescript
  const store = {
      dispatch: dispatch as Dispatch<A>,
      subscribe,
      getState,
      replaceReducer,
      [$$observable]: observable
  } as unknown as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  return store
```

## 文章链接

- [js中return有什么设计错误？ - 知乎](https://www.zhihu.com/question/21076930/answer/17135846)

- [7 really good reasons not to use TypeScript | by Michael Krasnov | JavaScript in Plain English](https://javascript.plainenglish.io/7-really-good-reasons-not-to-use-typescript-166af597c466)