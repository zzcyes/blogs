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

我们可以通过以下代码打印一下 createStore 创建的示例返回值

```typescript
const { createStore } = require('redux');
const counterReducer = (state = { value: 0 }, action) => {
    switch (action.type) {
        case "counter/incremented":
            return {...state, value: state.value + 1 };
        case "counter/decremented":
            return {...state, value: state.value - 1 };
        default:
            return state;
    }
};
const store = createStore(
    counterReducer,
);
console.debug(store);
```

console 控制台输出如下

```
{
  dispatch: [Function: dispatch],
  subscribe: [Function: subscribe],
  getState: [Function: getState],
  replaceReducer: [Function: replaceReducer],
  '@@observable': [Function: observable]     
}
```

### dispatch

###  subscribe

### getState

### replaceReducer

### [$$observable]

## createStore 实现

###校验传参、处理异常

````typescript
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

if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
  enhancer = preloadedState as StoreEnhancer<Ext, StateExt>
  preloadedState = undefined
}

if (typeof enhancer !== 'undefined') {
  if (typeof enhancer !== 'function') {
    throw new Error(
      `Expected the enhancer to be a function. Instead, received: '${kindOf(
        enhancer
      )}'`
    )
  }

  return enhancer(createStore)(
    reducer,
    preloadedState as PreloadedState<S>
  ) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
}

if (typeof reducer !== 'function') {
  throw new Error(
    `Expected the root reducer to be a function. Instead, received: '${kindOf(
      reducer
    )}'`
  )
}
````

### 声明变量

```typescript
let currentReducer = reducer
let currentState = preloadedState as S
let currentListeners: (() => void)[] | null = []
let nextListeners = currentListeners
let isDispatching = false
```

### 声明函数

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
}
```

#### getState

```typescript
/**
 * Reads the state tree managed by the store.
 *
 * @returns The current state tree of your application.
 */
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

#### subscribe

```typescript
/**
 * Adds a change listener. It will be called any time an action is dispatched,
 * and some part of the state tree may potentially have changed. You may then
 * call `getState()` to read the current state tree inside the callback.
 *
 * You may call `dispatch()` from a change listener, with the following
 * caveats:
 *
 * 1. The subscriptions are snapshotted just before every `dispatch()` call.
 * If you subscribe or unsubscribe while the listeners are being invoked, this
 * will not have any effect on the `dispatch()` that is currently in progress.
 * However, the next `dispatch()` call, whether nested or not, will use a more
 * recent snapshot of the subscription list.
 *
 * 2. The listener should not expect to see all state changes, as the state
 * might have been updated multiple times during a nested `dispatch()` before
 * the listener is called. It is, however, guaranteed that all subscribers
 * registered before the `dispatch()` started will be called with the latest
 * state by the time it exits.
 *
 * @param listener A callback to be invoked on every dispatch.
 * @returns A function to remove this change listener.
 */
function subscribe(listener: () => void) {
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

#### dispatch

```typescript
/**
 * Dispatches an action. It is the only way to trigger a state change.
 *
 * The `reducer` function, used to create the store, will be called with the
 * current state tree and the given `action`. Its return value will
 * be considered the **next** state of the tree, and the change listeners
 * will be notified.
 *
 * The base implementation only supports plain object actions. If you want to
 * dispatch a Promise, an Observable, a thunk, or something else, you need to
 * wrap your store creating function into the corresponding middleware. For
 * example, see the documentation for the `redux-thunk` package. Even the
 * middleware will eventually dispatch plain object actions using this method.
 *
 * @param action A plain object representing “what changed”. It is
 * a good idea to keep actions serializable so you can record and replay user
 * sessions, or use the time travelling `redux-devtools`. An action must have
 * a `type` property which may not be `undefined`. It is a good idea to use
 * string constants for action types.
 *
 * @returns For convenience, the same action object you dispatched.
 *
 * Note that, if you use a custom middleware, it may wrap `dispatch()` to
 * return something else (for example, a Promise you can await).
 */
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

#### replaceReducer

```typescript
/**
 * Replaces the reducer currently used by the store to calculate the state.
 *
 * You might need this if your app implements code splitting and you want to
 * load some of the reducers dynamically. You might also need this if you
 * implement a hot reloading mechanism for Redux.
 *
 * @param nextReducer The reducer for the store to use instead.
 * @returns The same store instance with a new reducer in place.
 */
function replaceReducer<NewState, NewActions extends A>(
   nextReducer: Reducer<NewState, NewActions>
): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext {
    if (typeof nextReducer !== 'function') {
      throw new Error(
        `Expected the nextReducer to be a function. Instead, received: '${kindOf(
          nextReducer
        )}`
      )
    }

    // TODO: do this more elegantly
    ;(currentReducer as unknown as Reducer<NewState, NewActions>) = nextReducer

    // This action has a similar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.
    dispatch({ type: ActionTypes.REPLACE } as A)
    // change the type of the store by casting it to the new store
    return store as unknown as Store<
      ExtendState<NewState, StateExt>,
      NewActions,
      StateExt,
      Ext
    > &
      Ext
}
```

#### observable

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
    /**
     * The minimal observable subscription method.
     * @param observer Any object that can be used as an observer.
     * The observer object should have a `next` method.
     * @returns An object with an `unsubscribe` method that can
     * be used to unsubscribe the observable from the store, and prevent further
     * emission of values from the observable.
     */
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

### dispatch 初始化

```typescript
// When a store is created, an "INIT" action is dispatched so that every
// reducer returns their initial state. This effectively populates
// the initial state tree.
dispatch({ type: ActionTypes.INIT } as A)
```

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

