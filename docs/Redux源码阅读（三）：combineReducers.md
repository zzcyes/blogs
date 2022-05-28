# Redux源码阅读（三）：combineReducers

当应用程序变得越来越复杂的时候，我们希望把 reduce 函数拆分为单独的函数， 每个函数管理 state 的独立部分。而辅助函数 combineReducers 可以将不同的 reducer 函数 转为为单个 reducer 函数 传递给 createStore。 

## 使用案例

如下案例：有两个 reducer，一个是用于计数器的 counterReducer，另一个是用于 todoList 的 todoReducer，通过 createStore 分别为其生成 counterStore、todoStore，并通过 `store.getState()` 获取其 state 的值，并通过 `console.debug` 打印出来。

```typescript
const { createStore, combineReducers} = require('redux');
const { counterReducer, todoReducer } = require('./reducer')

const counterStore = createStore(counterReducer);
const todoStore = createStore(todoReducer)

console.debug("counterStore.state value is:", counterStore.getState()); 
console.debug("todoStore.state value is:", todoStore.getState()); 
```

运行代码后，可以看到如下输出：

```typescript
counterStore.state: 
 { value: 0 }

todoStore.state: 
 {
  todoList: [
    { id: 1, text: '1234', status: 'todo' },
    { id: 2, text: '1234', status: 'done' }
  ]
}
```

再通过 `combineReducers` 将两个 reducer 转化为单个 reducer，并将其传递给 createStore 从而生成 combinStore，并通过  `combinStore.getState()` 获取其 state 的值，并将其打印出来。

```typescript
// ...
const unionReducer =  combineReducers({
    counter: counterReducer,
    todo: todoReducer
})
const combineStore = createStore(unionReducer);
console.debug("combineStore:", combineStore.getState());
```

运行代码后，可以看到以下输出： 

```typescript
combineStore.state:
{
    counter: { value: 0 },
    todo: {
      todoList: [
        { id: 1, text: '1234', status: 'todo' },
        { id: 2, text: '1234', status: 'done' }
      ]
    }
}
```

此时获取到的 state ，便是 counterStore.state 和 todoStore.state 的并集了，并且键值分别为合并 reducer 时传入 `combineReducers` 函数中的 counter 和 todo 。

此时我们再通过 `fs.writeFileSync` 函数把 unionReducer 的值写入到 `unionReducer.txt` 文件中，看看通过 combineReducers 函数合并生成的 unionReducer 到底是什么。

````typescript
fs.writeFileSync('unionReducer.txt', unionReducer.toString())
````

运行代码后， 我们打开生成的  `unionReducer.txt` 文件：

```typescript
function combination(state, action) {
        if (state === void 0) {
            state = {};
        }
        if (shapeAssertionError) {
            throw shapeAssertionError;
        }
        // ...
        var hasChanged = false;
        var nextState = {};
        for (var _i = 0; _i < finalReducerKeys.length; _i++) {
            var _key = finalReducerKeys[_i];
            var reducer = finalReducers[_key];
            var previousStateForKey = state[_key];
            var nextStateForKey = reducer(previousStateForKey, action);
		// ...
        return hasChanged ? nextState : state;
    }
}
```

我们看到，通过 `combineReducers` 生成的 `unionReducer` 其实是一个 combination 函数，并且该函数中内部使用的 shapeAssertionError、finalReducerKeys 等变量既不是该函数的参数，也不是在该函数内部定义的。可以推断出 combination 是个闭包，稍后进行源码调试的时候可以打 debugger 验证一下。

## 源码概览

- redux/src/combineReducers.ts

  combineReducers.ts 文件中通过 export default 导出了 combineReducers 函数，其中前三个 combineReducers 导出是 ts 的类型声明，最后一个才是 combineReducers 的具体实现。此外，文件中还声明了两个工具函数：getUnexpectedStateShapeWarningMessage、assertReducerShape。

  ````typescript
  // ...
  function getUnexpectedStateShapeWarningMessage(
    inputState: object,
    reducers: ReducersMapObject,
    action: Action,
    unexpectedKeyCache: { [key: string]: true }
  ) {
    // ...
  }
  
  function assertReducerShape(reducers: ReducersMapObject) {
   // ...
  }
  
  //...
  export default function combineReducers<S>(
    reducers: ReducersMapObject<S, any>
  ): Reducer<CombinedState<S>>
  export default function combineReducers<S, A extends Action = AnyAction>(
    reducers: ReducersMapObject<S, A>
  ): Reducer<CombinedState<S>, A>
  export default function combineReducers<M extends ReducersMapObject>(
    reducers: M
  ): Reducer<
    CombinedState<StateFromReducersMapObject<M>>,
    ActionFromReducersMapObject<M>
  >
  export default function combineReducers(reducers: ReducersMapObject) {
   // ...
   return function combination(
      state: StateFromReducersMapObject<typeof reducers> = {},
      action: AnyAction
    ){
  	// ...
   }
  }
  ````


## 源码分析 

### combineReducers

```typescript
export default function combineReducers(reducers: ReducersMapObject) {
  const reducerKeys = Object.keys(reducers)
  const finalReducers: ReducersMapObject = {}
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  const finalReducerKeys = Object.keys(finalReducers)

  // This is used to make sure we don't warn about the same
  // keys multiple times.
  let unexpectedKeyCache: { [key: string]: true }
  if (process.env.NODE_ENV !== 'production') {
    unexpectedKeyCache = {}
  }

  let shapeAssertionError: unknown
  try {
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }

  return function combination(
    state: StateFromReducersMapObject<typeof reducers> = {},
    action: AnyAction
  ) {
    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    if (process.env.NODE_ENV !== 'production') {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      )
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    let hasChanged = false
    const nextState: StateFromReducersMapObject<typeof reducers> = {}
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i]
      const reducer = finalReducers[key]
      const previousStateForKey = state[key]
      const nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === 'undefined') {
        const actionType = action && action.type
        throw new Error(
          `When called with an action of type ${
            actionType ? `"${String(actionType)}"` : '(unknown type)'
          }, the slice reducer for key "${key}" returned undefined. ` +
            `To ignore an action, you must explicitly return the previous state. ` +
            `If you want this reducer to hold no value, you can return null instead of undefined.`
        )
      }
      nextState[key] = nextStateForKey
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length
    return hasChanged ? nextState : state
  }
}
```

