# Redux 源码阅读（三）

## 源码目录

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
  
    dispatch({ type: ActionTypes.INIT } as A)
   
    // part four
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

  createStore 函数可分为四部分：

  1. 对校验函数传参、异常处理等操作

  2. 声明变量：currentReducer、currentState 等

  3. 声明函数：ensureCanMutateNextListeners、getState 等

  4. 声明 store ，return store 

     - 

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

     

