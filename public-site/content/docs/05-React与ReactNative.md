# 05 · React 与 React Native

> 目标：能用 Hooks 独立开发 React 页面；理解虚拟 DOM、diff、Fiber；能写 RN 页面、列表、导航，并解释 RN 架构与性能优化。
>
> 标记：⭐⭐⭐ 必须会｜⭐⭐ 要理解｜⭐ 了解即可

---

# 第一部分：React

## 1. React 是什么

React 是一个构建 UI 的 JavaScript 库。

三个关键词：

1. **声明式**：你描述“UI 应该长什么样”，React 负责把页面更新成那样。
2. **组件化**：页面拆成可复用的小组件。
3. **一次学习，多端编写**：React 写 Web，React Native 写 App。

```jsx
// 声明式：根据 todos 渲染列表，不用手动操作 DOM
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

对比命令式：

```js
// 命令式：手动创建、插入、更新 DOM
const ul = document.querySelector('ul');
todos.forEach((todo) => {
  const li = document.createElement('li');
  li.textContent = todo.title;
  ul.appendChild(li);
});
```

---

## 2. 创建项目

```bash
npm create vite@latest my-react-app -- --template react
cd my-react-app
npm install
npm run dev
```

目录：

```text
my-react-app/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx      # 入口
    ├── App.jsx       # 根组件
    └── assets/
```

入口：

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

> `StrictMode` 在开发环境会故意让组件渲染两次、effect 执行两次，用来暴露副作用问题。生产环境不会。

---

## 3. JSX ⭐⭐⭐

JSX 是 JavaScript 的语法扩展，看起来像 HTML，最终会被 Babel 转成 `React.createElement` 或 jsx runtime 调用。

### 3.1 规则

```jsx
function App() {
  const name = 'Tom';
  const isVip = true;

  return (
    // 1. 只能有一个根节点（或用 Fragment 包裹）
    <>
      {/* 2. 注释要写在花括号里 */}
      <h1>你好，{name}</h1>

      {/* 3. 表达式用 {}，不能写语句 */}
      <p>{1 + 1}</p>
      <p>{isVip ? '会员' : '普通用户'}</p>

      {/* 4. class 要写成 className */}
      <div className="card" />

      {/* 5. 样式是对象，属性名驼峰 */}
      <div style={{ color: 'red', fontSize: 16 }} />

      {/* 6. 标签必须闭合 */}
      <img src="a.jpg" alt="图" />
      <input />

      {/* 7. 布尔属性直接写 */}
      <button disabled>按钮</button>
    </>
  );
}
```

### 3.2 表达式里能写什么

```jsx
{/* 可以：变量、运算、三元、函数调用、map */}
{name}
{age + 1}
{isVip ? <VipBadge /> : null}
{list.map((item) => <Item key={item.id} {...item} />)}

{/* 不可以：if、for、while 等语句 */}
// {if (isVip) { ... }}
```

### 3.3 条件渲染

```jsx
// 1. 三元
{isLogin ? <Home /> : <Login />}

// 2. 逻辑与：条件为真才渲染
{isVip && <VipBadge />}

// 3. 提前 return
if (loading) return <Loading />;
if (error) return <Error message={error} />;
return <List />;

// 4. 变量
let content;
if (loading) content = <Loading />;
else if (error) content = <Error />;
else content = <List />;
return <div>{content}</div>;
```

**坑：** `{0 && <div />}` 会渲染出 `0`。因为 0 是假值，`&&` 返回 0。写成 `{count > 0 && <div />}`。

---

## 4. 组件与 props ⭐⭐⭐

### 4.1 函数组件

```jsx
// 定义
function Welcome(props) {
  return <h1>你好，{props.name}</h1>;
}

// 或解构
function Welcome({ name, age = 18 }) {
  return <h1>你好，{name}，{age} 岁</h1>;
}

// 使用
<Welcome name="Tom" age={20} />
```

### 4.2 props 规则

- props 是**只读**的，子组件不能直接修改。
- 父组件通过 props 传数据，子组件通过回调通知父组件。
- `children` 是写在标签中间的内容。

```jsx
function Card({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

<Card title="用户信息">
  <p>姓名：Tom</p>
  <p>年龄：18</p>
</Card>
```

### 4.3 组件通信

```jsx
// 父 → 子：props
function Parent() {
  const [count, setCount] = useState(0);
  return <Child count={count} />;
}

// 子 → 父：回调
function Parent2() {
  const [keyword, setKeyword] = useState('');
  return <SearchBar onSearch={setKeyword} />;
}

function SearchBar({ onSearch }) {
  return <input onChange={(e) => onSearch(e.target.value)} />;
}

// 兄弟：状态提升到共同父级
// 跨层：Context
```

### 4.4 组合 vs 继承

React 不推荐继承，推荐组合：

```jsx
function Dialog({ title, footer, children }) {
  return (
    <div className="dialog">
      <header>{title}</header>
      <main>{children}</main>
      <footer>{footer}</footer>
    </div>
  );
}
```

---

## 5. state 与 useState ⭐⭐⭐

state 是组件的“记忆”，变化会触发重新渲染。

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // [当前值, 更新函数]

  return (
    <button onClick={() => setCount(count + 1)}>
      点击了 {count} 次
    </button>
  );
}
```

### 5.1 不要直接修改 state

```jsx
// 错：对象/数组直接改，React 不知道变了
todos.push(newTodo);
setTodos(todos);

// 对：创建新对象/数组
setTodos([...todos, newTodo]);

// 改对象里的某一项
setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
```

### 5.2 函数式更新

```jsx
// 错：连续调用可能只加 1
setCount(count + 1);
setCount(count + 1);

// 对：基于上一次的值
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
```

### 5.3 惰性初始化

```jsx
// 每次渲染都会执行 JSON.parse，浪费
const [todos, setTodos] = useState(JSON.parse(localStorage.getItem('todos')));

// 只在首次渲染执行
const [todos, setTodos] = useState(() => {
  return JSON.parse(localStorage.getItem('todos')) ?? [];
});
```

### 5.4 state 更新是异步的

```jsx
function handleClick() {
  setCount(count + 1);
  console.log(count); // 还是旧值
}
```

React 会批量更新 state，然后在一次渲染中反映。需要拿到最新值，用函数式更新或 `useEffect`。

### 5.5 自动批处理（React 18）

```jsx
// React 18：事件、Promise、setTimeout 里都会自动批处理
setCount((c) => c + 1);
setFlag((f) => !f);
// 只触发一次渲染

// 需要立即同步更新 DOM（很少用）
import { flushSync } from 'react-dom';
flushSync(() => setCount((c) => c + 1));
```

---

## 6. 列表与 key ⭐⭐⭐

```jsx
function List({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

### key 的作用

- React 用 key 判断“这个元素还是不是同一个”。
- key 必须**稳定、唯一、可预测**。
- 不要用数组索引做 key（列表会增删/排序时，会导致状态错乱和多余渲染）。
- key 只在兄弟节点之间唯一，不需要全局唯一。

```jsx
// 错：删除第一项后，索引变化，React 会复用错误的 DOM/状态
{todos.map((todo, index) => <Item key={index} />)}

// 对
{todos.map((todo) => <Item key={todo.id} />)}
```

### 列表里不要用随机数做 key

```jsx
// 每次渲染 key 都变，组件会被整体销毁重建
<Item key={Math.random()} />
```

---

## 7. 事件处理 ⭐⭐

```jsx
function App() {
  function handleClick(e) {
    console.log(e.target);
  }

  return (
    <>
      <button onClick={handleClick}>点我</button>

      {/* 传参：用箭头函数包一层 */}
      <button onClick={() => handleDelete(id)}>删除</button>

      {/* 阻止默认行为 */}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} />
    </>
  );
}
```

React 事件是**合成事件（SyntheticEvent）**：

- 跨浏览器统一。
- React 17 之前委托到 document，17 之后委托到根容器。
- 事件对象会被复用（旧版本），异步访问要 `e.persist()`；新版本已不再复用。
- `onClick` 是驼峰，不是 `onclick`。

---

## 8. 表单 ⭐⭐

### 8.1 受控组件

值由 state 控制：

```jsx
function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    console.log({ phone, password });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="手机号"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
      />
      <button type="submit">登录</button>
    </form>
  );
}
```

### 8.2 非受控组件

用 ref 直接读 DOM 值：

```jsx
function Login() {
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    console.log(phoneRef.current.value, passwordRef.current.value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={phoneRef} defaultValue="" />
      <input ref={passwordRef} type="password" />
      <button type="submit">登录</button>
    </form>
  );
}
```

### 8.3 怎么选

| 场景 | 选择 |
|---|---|
| 需要实时校验、联动、格式化 | 受控 |
| 简单表单、文件上传 | 非受控 |
| 大型表单 | react-hook-form（非受控为主） |

---

## 9. useEffect ⭐⭐⭐

`useEffect` 用来处理**副作用**：请求、订阅、定时器、操作 DOM。

```jsx
import { useEffect, useState } from 'react';

function User({ id }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/user/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setUser(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // 清理函数：组件卸载或依赖变化前执行
    return () => {
      cancelled = true;
    };
  }, [id]); // id 变化时重新请求

  if (loading) return <p>加载中...</p>;
  if (error) return <p>出错了：{error}</p>;
  if (!user) return <p>暂无数据</p>;
  return <h1>{user.name}</h1>;
}
```

### 9.1 依赖数组的三种情况

```jsx
useEffect(() => {
  // 1. 不写依赖：每次渲染后都执行（几乎不用）
});

useEffect(() => {
  // 2. 空数组：只在挂载后执行一次
}, []);

useEffect(() => {
  // 3. 有依赖：挂载后 + 依赖变化时执行
}, [id, keyword]);
```

### 9.2 清理函数

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => clearInterval(timer); // 卸载时清除
}, []);
```

```jsx
useEffect(() => {
  function onResize() {
    console.log(window.innerWidth);
  }
  window.addEventListener('resize', onResize);

  return () => window.removeEventListener('resize', onResize);
}, []);
```

### 9.3 常见错误

**错误 1：漏依赖，导致读旧的 state（闭包陷阱）**

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // count 永远是 0
  }, 1000);
  return () => clearInterval(timer);
}, []); // 漏了 count

// 解决：函数式更新
useEffect(() => {
  const timer = setInterval(() => {
    setCount((c) => c + 1);
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

**错误 2：在 effect 里直接改依赖，导致死循环**

```jsx
useEffect(() => {
  setList([...list, newItem]); // 修改 list，又触发 effect
}, [list]);
```

**错误 3：请求竞态**

快速切换 tab，先发的请求后回来，覆盖了新数据。解决：用 `AbortController` 或 `cancelled` 标志。

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/list?type=${type}`, { signal: controller.signal })
    .then((res) => res.json())
    .then(setList)
    .catch((err) => {
      if (err.name !== 'AbortError') setError(err.message);
    });

  return () => controller.abort();
}, [type]);
```

### 9.4 useEffect vs useLayoutEffect

| Hook | 执行时机 | 场景 |
|---|---|---|
| `useEffect` | 浏览器绘制后，异步 | 请求、订阅、日志 |
| `useLayoutEffect` | DOM 更新后、绘制前，同步 | 测量 DOM、避免闪烁 |

```jsx
useLayoutEffect(() => {
  const height = ref.current.getBoundingClientRect().height;
  setHeight(height); // 在绘制前完成，用户看不到跳动
}, []);
```

服务端渲染时 `useLayoutEffect` 会警告，可用 `useIsomorphicLayoutEffect` 兼容。

---

## 10. 其他常用 Hooks ⭐⭐⭐

### 10.1 useRef

```jsx
// 1. 引用 DOM
const inputRef = useRef(null);
inputRef.current.focus();

// 2. 保存跨渲染的值，不触发重新渲染
const timerRef = useRef(null);
timerRef.current = setInterval(() => {}, 1000);

// 3. 保存上一次的值
const prevCount = useRef(count);
useEffect(() => {
  prevCount.current = count;
}, [count]);
```

### 10.2 useMemo

缓存计算结果，避免每次渲染重复计算：

```jsx
const filtered = useMemo(() => {
  console.log('过滤一次');
  return list.filter((item) => item.title.includes(keyword));
}, [list, keyword]);
```

不要滥用：简单计算没必要，缓存本身也有成本。

### 10.3 useCallback

缓存函数引用，配合 `React.memo` 避免子组件无意义重渲染：

```jsx
const handleDelete = useCallback((id) => {
  setList((prev) => prev.filter((item) => item.id !== id));
}, []);
```

```jsx
const Item = React.memo(function Item({ item, onDelete }) {
  return <li onClick={() => onDelete(item.id)}>{item.title}</li>;
});
```

### 10.4 useReducer

复杂状态逻辑，或多个状态互相关联：

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return { ...state, list: [...state.list, action.payload] };
    case 'remove':
      return { ...state, list: state.list.filter((i) => i.id !== action.id) };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, { list: [] });
dispatch({ type: 'add', payload: item });
```

### 10.5 useContext

跨层传值：

```jsx
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  return <Button />;
}

function Button() {
  const theme = useContext(ThemeContext); // 不用一层层传 props
  return <button className={theme}>按钮</button>;
}
```

### 10.6 自定义 Hook

把可复用的状态逻辑抽出来：

```jsx
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// 使用
function Search() {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword, 300);

  useEffect(() => {
    if (!debouncedKeyword) return;
    search(debouncedKeyword);
  }, [debouncedKeyword]);

  return <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />;
}
```

### 10.7 Hooks 规则 ⭐⭐⭐

1. **只能在函数组件或自定义 Hook 的顶层调用。**
2. **不能在条件、循环、嵌套函数里调用。**

```jsx
// 错
if (isVip) {
  const [level, setLevel] = useState(1);
}

// 对
const [level, setLevel] = useState(1);
if (isVip) {
  // 使用 level
}
```

原因：React 靠 Hook 的**调用顺序**来对应 state。条件调用会让顺序错乱。

---

## 11. 生命周期对照 ⭐⭐

函数组件没有类生命周期，用 Hooks 模拟：

| 类组件 | 函数组件 |
|---|---|
| `constructor` | `useState(initial)` |
| `componentDidMount` | `useEffect(() => {}, [])` |
| `componentDidUpdate` | `useEffect(() => {}, [deps])` |
| `componentWillUnmount` | `useEffect` 的清理函数 |
| `shouldComponentUpdate` | `React.memo` |
| `getDerivedStateFromProps` | 渲染时根据 props 计算（少用） |
| `componentDidCatch` | Error Boundary（仍用类组件） |

---

## 12. 虚拟 DOM、diff、Fiber ⭐⭐⭐

### 12.1 虚拟 DOM

React 用 JS 对象描述 UI：

```jsx
// JSX
<div className="card">
  <h1>标题</h1>
</div>
```

```js
// 大致对应的 React Element
{
  type: 'div',
  props: {
    className: 'card',
    children: {
      type: 'h1',
      props: { children: '标题' },
    },
  },
}
```

状态变化时，React 生成新的虚拟 DOM 树，和旧的比较（diff），只把变化的部分更新到真实 DOM。

**好处：**

- 减少直接操作 DOM 的次数。
- 跨平台：React DOM 渲染到浏览器，React Native 渲染到原生组件。
- 让开发者用声明式方式描述 UI。

### 12.2 diff 策略

完整树 diff 是 O(n³)，React 用三个启发式规则降到 O(n)：

1. **类型不同**：直接销毁旧树，创建新树。
2. **类型相同**：保留 DOM 节点，只更新属性。
3. **列表用 key**：通过 key 匹配新旧节点，决定移动/删除/新增。

```jsx
// 类型变了：p → div，整个替换
{isText ? <p>文本</p> : <div>文本</div>}

// 类型相同：只更新 className 和 children
<div className={a}>1</div>
<div className={b}>2</div>
```

### 12.3 Fiber

React 16 引入 Fiber，解决“大组件树渲染卡顿”的问题。

- 把渲染任务拆成一个个小单元（Fiber 节点）。
- 渲染阶段可以中断、让出主线程，处理更高优先级的任务（输入、动画）。
- 提交阶段不可中断，一次性更新 DOM。

关键概念：

- `current` 树：当前屏幕上的树。
- `workInProgress` 树：正在构建的新树。
- 双缓存：两棵树交替，构建完成后切换。
- `lanes`：优先级模型，区分紧急更新（输入）和非紧急更新（列表过滤）。
- Render 阶段：可中断，计算变化。
- Commit 阶段：同步，执行 DOM 更新、生命周期、ref。

### 12.4 并发特性（React 18+）

```jsx
// useTransition：把更新标记为非紧急
const [isPending, startTransition] = useTransition();

function handleChange(e) {
  const value = e.target.value;
  setKeyword(value); // 紧急：输入框立即更新
  startTransition(() => {
    setFilteredList(filterBigList(value)); // 非紧急：可以被打断
  });
}

// useDeferredValue：延迟某个值
const deferredKeyword = useDeferredValue(keyword);

// Suspense + lazy：代码分割
const Detail = lazy(() => import('./Detail'));

<Suspense fallback={<Loading />}>
  <Detail />
</Suspense>
```

---

## 13. 性能优化 ⭐⭐⭐

### 13.1 减少重渲染

```jsx
// 1. React.memo：props 浅比较，没变就跳过渲染
const Item = React.memo(function Item({ title }) {
  return <li>{title}</li>;
});

// 2. useCallback：保持函数引用稳定
const onDelete = useCallback((id) => {
  setList((prev) => prev.filter((item) => item.id !== id));
}, []);

// 3. useMemo：保持对象/计算结果稳定
const config = useMemo(() => ({ pageSize: 20 }), []);

// 4. 状态下放：把状态放在真正需要它的组件里
```

**不要过度优化：** `memo`、`useCallback` 本身也有比较成本。先用 React DevTools Profiler 找到真正慢的组件。

### 13.2 列表优化

- 用稳定唯一的 key。
- 长列表用虚拟滚动（Web：react-window / react-virtualized；RN：FlatList）。
- 避免在 render 里做重计算。
- 把列表项抽成 `memo` 组件。
- 避免每次传新的对象/函数给列表项。

### 13.3 加载优化

- 路由级代码分割：`React.lazy` + `Suspense`。
- 图片懒加载。
- 首屏 skeleton。
- 预加载关键资源。

### 13.4 其他

- 避免在 render 里请求数据（放 useEffect/事件里）。
- 避免派生 state，能算出来的不要存。
- 大表单用非受控 + react-hook-form。
- 长任务用 `startTransition` / Web Worker。

---

## 14. 错误边界、Suspense、状态管理

### 14.1 错误边界

捕获子组件渲染错误，防止整个页面白屏。**只能用类组件**。

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('组件错误', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>页面出错了</h1>;
    }
    return this.props.children;
  }
}
```

> 错误边界捕获不了：事件处理、异步代码、服务端渲染、错误边界自身的错误。

### 14.2 状态管理怎么选

| 方案 | 适用 |
|---|---|
| `useState` / `useReducer` | 组件内部状态 |
| 状态提升 | 兄弟组件共享 |
| Context | 主题、登录用户、语言等低频变化 |
| Redux Toolkit | 大型应用、复杂状态、需要 DevTools/中间件 |
| Zustand | 中小型项目，轻量 |
| TanStack Query / SWR | 服务端数据缓存（推荐） |

```jsx
// Zustand 示例
import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  add: (item) => set((state) => ({ items: [...state.items, item] })),
  clear: () => set({ items: [] }),
}));

function Cart() {
  const { items, add } = useCartStore();
  return <button onClick={() => add({ id: 1 })}>加入购物车（{items.length}）</button>;
}
```

### 14.3 路由（react-router v6）

```bash
npm i react-router-dom
```

```jsx
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<List />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function List() {
  return <Link to="/detail/1">查看详情</Link>;
}

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <>
      <p>商品 ID：{id}</p>
      <button onClick={() => navigate(-1)}>返回</button>
    </>
  );
}
```

---

## 15. React 完整示例：Todo

### 15.1 目录

```text
src/
├── App.jsx
├── components/
│   ├── TodoInput.jsx
│   ├── TodoList.jsx
│   └── FilterBar.jsx
└── App.css
```

### 15.2 `App.jsx`

```jsx
import { useEffect, useMemo, useState } from 'react';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import FilterBar from './components/FilterBar';
import './App.css';

const STORAGE_KEY = 'todos';

export default function App() {
  // 惰性初始化：只在首次渲染读取 localStorage
  const [todos, setTodos] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return []; // 数据损坏时回退到空数组
    }
  });

  // 当前筛选条件：all / active / done
  const [filter, setFilter] = useState('all');

  // todos 变化时写入 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  // 根据筛选条件计算要显示的列表
  // useMemo 避免每次渲染都重新 filter
  const visibleTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((todo) => !todo.done);
    if (filter === 'done') return todos.filter((todo) => todo.done);
    return todos;
  }, [todos, filter]);

  // 添加：用函数式更新，避免闭包拿到旧 todos
  function addTodo(title) {
    const trimmed = title.trim();
    if (!trimmed) return;

    setTodos((prev) => [
      { id: crypto.randomUUID(), title: trimmed, done: false },
      ...prev,
    ]);
  }

  // 切换完成状态：map 返回新数组，不要直接改原对象
  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  }

  // 删除：filter 返回新数组
  function removeTodo(id) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  return (
    <main className="app">
      <h1>待办清单</h1>

      <TodoInput onAdd={addTodo} />

      <FilterBar value={filter} onChange={setFilter} />

      <TodoList
        todos={visibleTodos}
        onToggle={toggleTodo}
        onRemove={removeTodo}
      />

      <p className="summary">
        共 {todos.length} 项，未完成 {todos.filter((t) => !t.done).length} 项
      </p>
    </main>
  );
}
```

### 15.3 `TodoInput.jsx`

```jsx
import { useState } from 'react';

export default function TodoInput({ onAdd }) {
  // 输入框的值由 state 控制（受控组件）
  const [text, setText] = useState('');

  function handleSubmit(event) {
    event.preventDefault(); // 阻止表单默认提交刷新页面

    const value = text.trim();
    if (!value) return; // 空内容不添加

    onAdd(value); // 通知父组件
    setText('');  // 清空输入框
  }

  return (
    <form className="todo-input" onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="输入待办，回车添加"
        aria-label="待办内容"
      />
      <button type="submit" disabled={!text.trim()}>
        添加
      </button>
    </form>
  );
}
```

### 15.4 `TodoList.jsx`

```jsx
export default function TodoList({ todos, onToggle, onRemove }) {
  // 空状态：列表为空时显示提示
  if (todos.length === 0) {
    return <p className="empty">暂无待办</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        // key 用稳定的 id，不要用 index
        <li key={todo.id} className={todo.done ? 'todo-item done' : 'todo-item'}>
          <label>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => onToggle(todo.id)}
            />
            <span>{todo.title}</span>
          </label>

          <button type="button" onClick={() => onRemove(todo.id)}>
            删除
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### 15.5 `FilterBar.jsx`

```jsx
const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'done', label: '已完成' },
];

export default function FilterBar({ value, onChange }) {
  return (
    <div className="filter-bar">
      {FILTERS.map((item) => (
        <button
          key={item.value}
          type="button"
          className={value === item.value ? 'active' : ''}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

### 15.6 `App.css`

```css
* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, "PingFang SC", sans-serif;
  background: #f5f5f5;
}

.app {
  max-width: 560px;
  margin: 0 auto;
  padding: 24px 16px;
}

h1 { font-size: 24px; }

.todo-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.todo-input input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.todo-input button {
  padding: 0 16px;
  color: #fff;
  background: #07c160;
  border: none;
  border-radius: 8px;
}

.todo-input button:disabled {
  opacity: 0.5;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-bar button {
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 999px;
  cursor: pointer;
}

.filter-bar button.active {
  color: #fff;
  background: #07c160;
  border-color: #07c160;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background: #fff;
  border-radius: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.todo-item:last-child { border-bottom: none; }

.todo-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.todo-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-item.done span {
  color: #999;
  text-decoration: line-through;
}

.todo-item button {
  color: #e54d42;
  background: none;
  border: none;
  cursor: pointer;
}

.empty {
  padding: 32px;
  text-align: center;
  color: #999;
  background: #fff;
  border-radius: 12px;
}

.summary {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}
```

### 15.7 数据流讲解

```text
App 持有 todos 和 filter
  ├── TodoInput 接收 onAdd，提交时把文本传给 App
  ├── FilterBar 接收 value/onChange，切换筛选
  └── TodoList 接收 visibleTodos/onToggle/onRemove
        └── 用户点击复选框 → onToggle(id) → App 更新 todos
              → 重新渲染 → 列表更新
```

- 状态放在最近的共同父级（App）。
- 子组件不直接改父级状态，通过回调。
- 所有更新都创建新数组/对象，保证 React 能检测到变化。

---

## 16. React 面试高频

### Q1：React 的优缺点？ ⭐⭐

**答：** 优点：声明式、组件化、生态好、跨端（RN）、虚拟 DOM 减少直接操作、社区大。缺点：不是完整框架（路由/状态管理要另选）、频繁更新的场景需要注意性能、JSX 有学习成本、大型应用状态管理复杂。

### Q2：函数组件和类组件的区别？ ⭐⭐

**答：** 函数组件用 Hooks 管理状态和副作用，代码更简洁、逻辑复用更容易；类组件有生命周期、this、实例。现在新项目基本都用函数组件。错误边界仍需要类组件。

### Q3：`useState` 的更新为什么是异步的？ ⭐⭐⭐

**答：** React 会批量收集 state 更新，合并后在一次渲染中生效，避免每次 setState 都渲染。事件处理、Promise、setTimeout 在 React 18 里都会自动批处理。需要基于旧值更新时用函数式写法 `setCount(c => c + 1)`。

### Q4：`useEffect` 的依赖数组怎么理解？ ⭐⭐⭐

**答：** 不写：每次渲染后执行；空数组：只挂载后执行一次；有依赖：挂载后和依赖变化时执行。依赖里用到的所有 props/state 都应该写进去，否则会读到旧值（闭包陷阱）。清理函数在依赖变化前和卸载时执行。

### Q5：`useMemo` 和 `useCallback` 的区别？ ⭐⭐⭐

**答：** `useMemo` 缓存计算结果（值），`useCallback` 缓存函数引用。两者都依赖依赖数组。`useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`。主要用于避免重复计算和配合 `React.memo` 减少子组件重渲染。

### Q6：为什么列表的 key 不能用 index？ ⭐⭐⭐

**答：** 列表增删/排序时，index 会变化，React 会错误复用节点，导致组件状态错位、多余渲染，甚至输入框内容串行。key 应该用稳定唯一的业务 id。

### Q7：虚拟 DOM 是什么？diff 怎么做的？ ⭐⭐⭐

**答：** 虚拟 DOM 是用 JS 对象描述 UI 的树。状态变化时生成新树，和旧树比较，只更新差异。React 用三个启发式规则把复杂度降到 O(n)：类型不同直接替换；类型相同更新属性；列表用 key 匹配。最终把变化提交到真实 DOM。

### Q8：Fiber 是什么？解决了什么问题？ ⭐⭐⭐

**答：** Fiber 是 React 16 的协调引擎。它把渲染拆成可中断的小任务，渲染阶段可以暂停、让出主线程，优先处理用户输入等高优先级任务，提交阶段再一次性更新 DOM。配合双缓存和 lanes 优先级模型，实现并发渲染。

### Q9：React 事件和原生事件的区别？ ⭐⭐

**答：** React 使用合成事件，跨浏览器统一，事件名驼峰；React 17 之前委托到 document，17 之后委托到根容器；`e.target` 是实际触发元素，`e.currentTarget` 是绑定监听器的元素。阻止默认和冒泡的 API 和原生一致。

### Q10：受控组件和非受控组件的区别？ ⭐⭐

**答：** 受控组件的值由 state 控制，每次输入都触发 onChange 和重渲染，适合实时校验/联动；非受控组件用 defaultValue 和 ref，值存在 DOM 里，适合简单表单/文件上传。大型表单常用 react-hook-form。

### Q11：Context 有什么缺点？ ⭐⭐

**答：** Context 的值变化会让所有消费者重新渲染，容易造成性能问题；嵌套多了可读性差。解决：拆分 Context、用 memo 包裹消费者、把低频变化的值放 Context，高频状态用状态管理库。

### Q12：错误边界能捕获哪些错误？ ⭐⭐

**答：** 只能捕获子组件在渲染、生命周期、构造函数里的错误。捕获不了事件处理、异步代码（setTimeout/Promise）、服务端渲染、错误边界自身的错误。

### Q13：React 18 有哪些新特性？ ⭐⭐

**答：** 自动批处理、并发渲染（useTransition/useDeferredValue）、Suspense 增强、`createRoot`、新的 StrictMode 行为、`useId`、流式 SSR。React 19 还有 Actions、`use`、React Compiler 等，了解即可。

### Q14：如何做 React 性能优化？ ⭐⭐⭐

**答：** 先用 Profiler 定位；减少重渲染（memo/useCallback/useMemo、状态下放、稳定 key）；长列表虚拟滚动；代码分割（lazy/Suspense）；图片懒加载；避免在 render 里做重计算/请求；大计算用 Web Worker；必要时用并发特性。

### Q15：`setState` 之后发生了什么？ ⭐⭐

**答：** 调用 setState 后，React 把更新加入队列，调度器根据优先级安排渲染；render 阶段计算新的虚拟 DOM 并 diff；commit 阶段更新真实 DOM、执行 layout effect 和 effect。函数组件里对应的是重新执行整个函数。

---

# 第二部分：React Native

## 17. React Native 是什么

React Native（RN）用 React 的写法开发**真正的原生 App**。

- 你写 `View`、`Text`，RN 把它们映射成 iOS 的 `UIView`、Android 的 `ViewGroup`。
- JS 代码跑在 JS 引擎里（Hermes/JSC），通过桥或 JSI 和原生通信。
- 不是 WebView，不是 H5 套壳。

```jsx
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>你好，RN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
```

### 17.1 和 H5 的区别

| 维度 | H5 | RN |
|---|---|---|
| 渲染 | 浏览器 DOM | 原生组件 |
| 标签 | div/span/p | View/Text/Image |
| 样式 | CSS 文件/类名 | JS 对象 + StyleSheet |
| 布局 | Flex/Grid/定位 | Flex（默认 column） |
| 单位 | px/rem/vw | 数字（dp） |
| 路由 | URL / react-router | react-navigation |
| 存储 | localStorage | AsyncStorage/MMKV |
| 动画 | CSS/WAAPI | Animated/Reanimated |
| 调试 | Chrome DevTools | Metro/Dev Menu/DevTools |
| 发版 | 部署服务器 | 应用商店/OTA |

### 17.2 环境：Expo 还是 CLI

| 方式 | 优点 | 缺点 | 适合 |
|---|---|---|---|
| Expo | 开箱即用、EAS 构建、OTA | 原生定制受限（可 prebuild） | 学习、快速开发、大多数业务 |
| React Native CLI | 完全控制原生工程 | 环境配置复杂 | 需要深度原生集成 |

学习阶段推荐 Expo：

```bash
npx create-expo-app@latest my-rn-app
cd my-rn-app
npx expo start
```

手机装 Expo Go，扫码即可。按 `w` 可以在浏览器看。

> 真实项目如果要上架、接原生 SDK，可能需要 `npx expo prebuild` 生成 ios/android 工程。

---

## 18. 核心组件 ⭐⭐⭐

| 组件 | 对应 Web | 作用 |
|---|---|---|
| `View` | `div` | 容器，支持 Flex |
| `Text` | `span/p` | 所有文本必须放在 Text 里 |
| `Image` | `img` | 图片 |
| `TextInput` | `input` | 输入框 |
| `ScrollView` | 滚动容器 | 少量内容滚动 |
| `FlatList` | 列表 | 长列表，虚拟化 |
| `SectionList` | 分组列表 | 带分组标题的列表 |
| `Pressable` | `button` | 可点击区域 |
| `TouchableOpacity` | 按钮 | 点击透明度反馈（旧） |
| `ActivityIndicator` | loading | 加载圈 |
| `Modal` | 弹窗 | 模态框 |
| `Switch` | 开关 | 布尔值 |
| `StatusBar` | — | 状态栏 |
| `KeyboardAvoidingView` | — | 键盘避让 |
| `SafeAreaView` | — | 安全区（推荐用 `react-native-safe-area-context`） |

### 18.1 文本必须包在 Text 里

```jsx
// 错：RN 里不能直接写文字
<View>你好</View>

// 对
<View><Text>你好</Text></View>
```

### 18.2 样式

```jsx
import { StyleSheet, View, Text } from 'react-native';

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    // 注意：数值不加 px
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600', // 字符串
    color: '#222',
  },
});

<View style={styles.card}>
  <Text style={styles.title}>标题</Text>
</View>
```

样式数组：

```jsx
<View style={[styles.card, isActive && styles.cardActive, { marginTop: 8 }]} />
```

### 18.3 Flexbox 差异 ⭐⭐⭐

| Web | RN |
|---|---|
| `flex-direction: row` 默认 | `flex-direction: column` 默认 |
| `display: flex` 需要写 | 所有 View 默认就是 Flex |
| `flex: 1` = `1 1 0%` | `flex: 1` 也表示可伸缩填满 |
| 支持 `display: inline` | 不支持 |
| 支持 CSS 级联/继承 | 不支持级联；Text 嵌套会继承部分文本样式 |
| 支持 `gap` | 新版本支持 |
| 单位 px/rem | 数字，单位是 dp |
| `position: relative/absolute` | 支持，默认 relative |
| `zIndex` | 支持（Android 需要同层） |
| 阴影 | iOS `shadowColor/shadowOffset/shadowOpacity/shadowRadius`，Android `elevation` |

```jsx
// 水平居中
<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} />

// 一行两端对齐
<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} />

// 左侧固定，右侧自适应
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Image style={{ width: 60, height: 60 }} />
  <View style={{ flex: 1, marginLeft: 12 }}>
    <Text numberOfLines={1}>很长的标题</Text>
  </View>
</View>
```

### 18.4 尺寸与像素密度

```jsx
import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

// 屏幕尺寸
const { width, height } = Dimensions.get('window');

// 像素密度
PixelRatio.get(); // 2 / 3

// 推荐：响应式，屏幕旋转/分屏会更新
const { width: w, height: h } = useWindowDimensions();
```

RN 里的数字是**密度无关像素（dp）**，不是物理像素。

### 18.5 安全区

```bash
npx expo install react-native-safe-area-context
```

```jsx
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* 页面内容 */}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
```

---

## 19. 事件与交互 ⭐⭐

```jsx
import { Pressable, Text, Alert } from 'react-native';

<Pressable
  onPress={() => Alert.alert('点击了')}
  onLongPress={() => Alert.alert('长按')}
  style={({ pressed }) => [
    styles.button,
    pressed && { opacity: 0.7 }, // 按下反馈
  ]}
>
  <Text style={styles.buttonText}>点我</Text>
</Pressable>
```

- `onPress`：点击。
- `onLongPress`：长按。
- `onPressIn` / `onPressOut`：按下/抬起。
- 没有 `onClick`。
- 列表项点击用 `Pressable`，不要用 `View onClick`。

---

## 20. FlatList 长列表 ⭐⭐⭐

### 20.1 基本用法

```jsx
<FlatList
  data={list}
  keyExtractor={(item) => String(item.id)}
  renderItem={({ item }) => <PostItem item={item} />}
  ListEmptyComponent={<Text>暂无数据</Text>}
  ListHeaderComponent={<Header />}
  ListFooterComponent={<Footer />}
  onRefresh={refresh}
  refreshing={refreshing}
  onEndReached={loadMore}
  onEndReachedThreshold={0.3}
/>
```

### 20.2 性能属性

```jsx
<FlatList
  data={list}
  keyExtractor={(item) => String(item.id)}
  renderItem={renderItem}

  // 首屏渲染多少项
  initialNumToRender={10}

  // 每批渲染多少项
  maxToRenderPerBatch={10}

  // 渲染窗口大小（单位：屏幕高度）
  windowSize={7}

  // 移除屏幕外的子项（有坑，复杂 item 慎用）
  removeClippedSubviews

  // 固定高度时提供，跳过测量，滚动更流畅
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}

  // 列表项外部状态变化时触发刷新
  extraData={selectedId}
/>
```

### 20.3 为什么不用 ScrollView 渲染长列表

`ScrollView` 会一次性渲染所有子元素，1000 条数据就创建 1000 个原生视图，内存和启动时间都会爆炸。`FlatList` 只渲染可视区域附近的项，滚动时复用。

### 20.4 列表项优化

```jsx
import { memo } from 'react';

const PostItem = memo(function PostItem({ item }) {
  return (
    <View style={styles.card}>
      <Text>{item.title}</Text>
    </View>
  );
});
```

- 用 `memo` 避免父组件重渲染带动所有项。
- `renderItem` 尽量不要每次创建新函数（可用 `useCallback`）。
- 不要在 `renderItem` 里做重计算。
- 图片指定宽高，避免布局跳动。

---

## 21. 导航 ⭐⭐⭐

```bash
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

```jsx
// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListScreen from './screens/ListScreen';
import DetailScreen from './screens/DetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="List"
          component={ListScreen}
          options={{ title: '商品列表' }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{ title: '商品详情' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

```jsx
// ListScreen.js
export default function ListScreen({ navigation }) {
  return (
    <Pressable onPress={() => navigation.navigate('Detail', { id: 1 })}>
      <Text>查看商品 1</Text>
    </Pressable>
  );
}

// DetailScreen.js
export default function DetailScreen({ route, navigation }) {
  const { id } = route.params; // 接收参数
  return (
    <>
      <Text>商品 ID：{id}</Text>
      <Button title="返回" onPress={() => navigation.goBack()} />
    </>
  );
}
```

常用导航：

- `navigation.navigate('Detail', { id })`：跳转。
- `navigation.goBack()`：返回。
- `navigation.replace('Login')`：替换当前页。
- `navigation.reset(...)`：重置栈。
- `route.params`：接收参数。

---

## 22. 网络与存储 ⭐⭐

### 22.1 fetch

```js
async function load() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch('https://api.example.com/goods', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('请求超时');
    throw err;
  }
}
```

注意：

- Android 9+ 默认禁止明文 HTTP，需要 HTTPS 或配置 `usesCleartextTraffic`。
- iOS 有 ATS 限制，HTTP 需要配置 `NSAppTransportSecurity`。
- 请求超时要自己用 `AbortController` 实现。

### 22.2 存储

```bash
npx expo install @react-native-async-storage/async-storage
```

```js
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('token', 'abc');
const token = await AsyncStorage.getItem('token');
await AsyncStorage.removeItem('token');
```

- AsyncStorage 是异步的，存字符串。
- 大量数据/高频读写用 MMKV。
- 敏感信息用 `expo-secure-store` / Keychain / Keystore，不要放 AsyncStorage。

---

## 23. 平台差异与原生能力 ⭐⭐

```jsx
import { Platform } from 'react-native';

const styles = {
  height: Platform.OS === 'ios' ? 44 : 56,
  ...Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.1 },
    android: { elevation: 4 },
  }),
};
```

- 文件后缀：`Button.ios.js` / `Button.android.js`，Metro 会自动选。
- 权限：Android 在 `AndroidManifest.xml` 声明，iOS 在 `Info.plist` 声明，运行时还要请求。
- 原生模块：需要写 Java/Kotlin/OC/Swift，通过 JSI/TurboModule 暴露给 JS。
- Expo 模块：`expo-camera`、`expo-location`、`expo-image-picker` 等，开箱即用。

---

## 24. RN 架构：Bridge → 新架构 ⭐⭐⭐

### 24.1 旧架构

```text
JS 线程               原生线程
┌─────────┐          ┌──────────────┐
│ React   │          │ iOS / Android │
│ JS 代码  │          │ UI / 原生模块  │
└────┬────┘          └──────▲───────┘
     │    Bridge（异步）      │
     └───────┬──────────────┘
             │
      序列化 JSON、批量、排队
```

三个线程：

- **JS 线程**：执行 React 和业务 JS。
- **Shadow 线程**：计算布局（Yoga）。
- **UI 线程**：原生渲染。

旧 Bridge 的问题：

- **异步**：JS 调用原生不能同步拿结果。
- **序列化**：数据要转成 JSON，量大时慢。
- **排队**：高频调用（滚动、手势）容易拥堵。
- **启动**：所有原生模块启动时初始化。

### 24.2 新架构

| 技术 | 作用 |
|---|---|
| **JSI** | JavaScript Interface，C++ 层，让 JS 直接持有原生对象的引用，支持同步调用，不再序列化 JSON |
| **TurboModules** | 原生模块按需加载，启动更快 |
| **Fabric** | 新渲染器，C++ 实现 shadow tree，支持同步布局和并发渲染 |
| **Codegen** | 根据类型定义生成 C++/JS 胶水代码，类型安全 |
| **Hermes** | Meta 自研 JS 引擎，预编译字节码，启动快、内存小 |

新架构解决了：

- Bridge 的异步/序列化瓶颈。
- 启动时加载所有模块。
- 布局和 JS 不同步导致的白屏/闪烁。
- 更好地支持 React 18 并发特性。

> 新版本 RN 默认启用新架构，面试要能说出 JSI/Fabric/TurboModules/Hermes 各自的作用。

### 24.3 Hermes

- 预编译成字节码，启动更快。
- 内存占用更低。
- 没有 JIT（以官方当前实现为准），牺牲部分峰值性能换启动和内存。
- 支持 Hermes Profiler 分析 JS 性能。

---

## 25. RN 性能优化 ⭐⭐⭐

| 问题 | 优化 |
|---|---|
| 长列表卡顿 | FlatList + 分页 + `getItemLayout` + `memo` |
| 频繁 setState | 合并状态、减少渲染范围 |
| 动画卡顿 | `useNativeDriver: true` 或 Reanimated（UI 线程） |
| 图片大/多 | 压缩、指定尺寸、缓存（expo-image） |
| JS 线程阻塞 | 减少同步计算、拆分任务、InteractionManager |
| 启动慢 | Hermes、按需加载、减少启动时的初始化 |
| 包体积大 | 移除未用资源、压缩图片、Proguard/R8 |
| 重渲染多 | `memo`、`useCallback`、稳定 props |
| 复杂计算 | 放原生/Worker，或缓存结果 |

```jsx
// Animated 用原生驱动
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // 动画跑在 UI 线程，不阻塞 JS
}).start();
```

```jsx
// 交互结束后再做重任务
import { InteractionManager } from 'react-native';

InteractionManager.runAfterInteractions(() => {
  loadHeavyData();
});
```

---

## 26. RN 调试 ⭐⭐

1. **Metro 终端**：`console.log` 输出、打包错误。
2. **Dev Menu**：模拟器 `Ctrl+M`（Android）/ `Cmd+D`（iOS），或摇一摇真机。
   - Reload
   - Debug（打开 DevTools）
   - Performance Monitor（FPS、内存）
   - Element Inspector（看布局）
3. **React Native DevTools**：新版推荐，组件树、Profiler。
4. **Hermes Profiler**：CPU 分析。
5. **原生日志**：
   - Android：`npx react-native log-android` 或 `adb logcat`。
   - iOS：Xcode 控制台。
6. **真机调试**：Expo Go 扫码；原生工程用 USB 连接。

常见红屏错误：

- `Unable to resolve module`：依赖没装/路径错。
- `Invariant Violation`：组件用法错。
- `Network request failed`：网络/HTTP/域名问题。
- `VirtualizedLists should never be nested`：FlatList 嵌套 ScrollView。

---

## 27. RN 打包与发布 ⭐

### Android

```bash
# 生成签名密钥（只做一次）
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 配置 android/gradle.properties 和 build.gradle
# 打包 APK
./gradlew assembleRelease
# 打包 AAB（上架 Google Play）
./gradlew bundleRelease
```

### iOS

- Xcode 打开 `ios/Project.xcworkspace`。
- 配置签名 Team、Bundle Identifier。
- Product → Archive。
- 上传 App Store Connect / TestFlight。

### Expo

```bash
npx eas build --platform android
npx eas build --platform ios
npx eas submit
```

### 热更新

- 只替换 JS bundle，不发新版本。
- 老方案 CodePush（App Center 已停止服务）。
- 现在可用 EAS Update 或自建方案。
- 注意应用商店政策，不要用来绕过审核。

---

## 28. RN 完整示例：搜索列表

```jsx
// App.js
import { memo, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
// 安装：npx expo install react-native-safe-area-context
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const API = 'https://jsonplaceholder.typicode.com/posts';

// 列表项：用 memo 避免父组件重渲染时全部重绘
const PostItem = memo(function PostItem({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.body} numberOfLines={3}>
        {item.body}
      </Text>
    </View>
  );
});

export default function App() {
  const [posts, setPosts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 挂载后请求数据
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!cancelled) setPosts(data);
      } catch (err) {
        if (!cancelled) setError(err.message || '网络错误');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // 卸载时标记，避免对已卸载组件 setState
    return () => {
      cancelled = true;
    };
  }, []);

  // 根据关键词过滤；useMemo 避免每次输入都全量计算
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return posts;
    return posts.filter((post) => post.title.toLowerCase().includes(k));
  }, [posts, keyword]);

  // 加载中
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#07c160" />
        <Text style={styles.hint}>加载中...</Text>
      </View>
    );
  }

  // 加载失败
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>加载失败：{error}</Text>
        <Pressable
          style={styles.retry}
          onPress={() => {
            // 简单重试：重新挂载逻辑；生产项目建议抽成 useRequest
            setLoading(true);
            setError('');
            fetch(API)
              .then((res) => res.json())
              .then(setPosts)
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
        >
          <Text style={styles.retryText}>重试</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>文章列表</Text>

        <TextInput
          style={styles.input}
          placeholder="搜索标题"
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PostItem item={item} />}
          contentContainerStyle={
            filtered.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={<Text style={styles.empty}>没有匹配的结果</Text>}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginTop: 8,
  },
  input: {
    height: 44,
    marginVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fff',
    borderRadius: 22,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  title: {
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  hint: {
    marginTop: 8,
    color: '#999',
  },
  error: {
    marginBottom: 12,
    color: '#e54d42',
  },
  retry: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#07c160',
    borderRadius: 999,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
  },
});
```

### 讲解

- `SafeAreaView` 处理刘海/底部安全区。
- `TextInput` 是受控组件，`onChangeText` 直接给值。
- `FlatList` 只渲染可视区域，长列表性能好。
- `keyExtractor` 用稳定 id。
- 加载/错误/空三种状态都处理了。
- `memo` 避免列表项无意义重渲染。
- `useMemo` 缓存过滤结果。
- `cancelled` 标志避免卸载后 setState。

---

## 29. RN 面试高频

### Q1：RN 和 H5 的区别？ ⭐⭐⭐

**答：** RN 渲染的是原生组件，不是 WebView/DOM；样式用 JS 对象和 Flex，默认 column；没有 CSS 级联；路由用 react-navigation；通过 Bridge/JSI 调原生能力；发布走应用商店或 OTA。H5 用 DOM/CSS，浏览器渲染，部署简单，但性能和原生体验不如 RN。

### Q2：RN 的旧架构有什么问题？新架构怎么解决？ ⭐⭐⭐

**答：** 旧架构通过 Bridge 异步通信，数据要序列化 JSON，批量排队，高频调用容易堵，启动时还要初始化所有原生模块。新架构用 JSI 让 JS 直接调用 C++/原生对象，支持同步；TurboModules 按需加载；Fabric 用 C++ 实现 shadow tree，支持同步布局和并发渲染；Codegen 生成类型安全的胶水代码；Hermes 预编译字节码提升启动。

### Q3：RN 的 Flex 和 Web 有什么不同？ ⭐⭐⭐

**答：** RN 默认 `flexDirection: column`，所有 View 默认就是 Flex；`flex: 1` 表示可伸缩填满；不支持 `display: inline`；没有 CSS 级联；单位是数字 dp；`position` 默认 relative。iOS/Android 的阴影写法也不同。

### Q4：FlatList 怎么优化？ ⭐⭐⭐

**答：** `keyExtractor` 用稳定 id；`getItemLayout` 固定行高；`initialNumToRender` 控制首屏；`maxToRenderPerBatch` 和 `windowSize` 控制渲染窗口；`removeClippedSubviews` 移除屏幕外视图；列表项用 `memo`；避免在 renderItem 里创建新对象/函数；分页加载；图片指定尺寸；`extraData` 处理外部状态。

### Q5：为什么长列表不用 ScrollView？ ⭐⭐

**答：** ScrollView 会一次性渲染所有子元素，数据多时内存和启动时间爆炸；FlatList 基于 VirtualizedList，只渲染可视区域附近的项，并复用组件。

### Q6：RN 怎么做动画？ ⭐⭐

**答：** 简单动画用 `Animated`，加 `useNativeDriver: true` 让动画跑在 UI 线程；复杂手势/动画用 `react-native-reanimated`，worklet 跑在 UI 线程；布局变化可以用 `LayoutAnimation`。避免在 JS 线程每帧 setState。

### Q7：RN 怎么调原生能力？ ⭐⭐

**答：** 旧架构写 NativeModule（Java/Kotlin/OC/Swift），通过 Bridge 暴露方法；新架构用 TurboModule + Codegen。业务里优先用 Expo 模块或成熟第三方库，避免自己写原生代码。

### Q8：RN 怎么做屏幕适配？ ⭐⭐

**答：** 用 Flex 布局、百分比、`useWindowDimensions`；字体/间距按设计稿比例换算；图片用 `resizeMode`；安全区用 `react-native-safe-area-context`；平板/横屏单独适配；避免写死宽高。

### Q9：RN 的 Hermes 是什么？ ⭐⭐

**答：** Meta 为 RN 优化的 JS 引擎，把 JS 预编译成字节码，启动更快、内存更小；支持 Profiler。它没有 JIT，峰值计算性能可能不如 V8，但移动端更看重启动和内存。

### Q10：RN 怎么发版/热更新？ ⭐⭐

**答：** Android 打 APK/AAB，iOS 用 Xcode Archive 上传 App Store；Expo 用 EAS Build。热更新只替换 JS bundle，可用 EAS Update 或自建方案；注意商店政策，不能绕过审核。

### Q11：RN 里怎么做请求和存储？ ⭐⭐

**答：** 请求用 fetch 或 axios，超时用 AbortController，注意 Android 明文 HTTP 和 iOS ATS；存储用 AsyncStorage（异步、字符串）、MMKV（高频/大量）、SecureStore（敏感信息）。

### Q12：RN 的 `console.log` 有什么问题？ ⭐

**答：** 开发时方便，但生产环境大量 log 会拖慢 JS 线程、泄露信息。打包时移除或使用日志库按级别控制。

---

## 30. 三端对比：H5 / RN / 小程序

| 维度 | H5 | React Native | 微信小程序 |
|---|---|---|---|
| 语言 | HTML/CSS/JS | JS/TS + JSX | WXML/WXSS/JS |
| 渲染 | 浏览器 DOM | 原生组件 | WebView/Skyline |
| 布局 | CSS Flex/Grid | Flex | Flex |
| 路由 | URL/react-router | react-navigation | wx.navigateTo 等 |
| 请求 | fetch/XHR | fetch/axios | wx.request |
| 存储 | localStorage | AsyncStorage/MMKV | wx.setStorage |
| 包体 | 无硬限制 | 应用商店限制 | 主包约 2MB，总包约 30MB |
| 发版 | 即时 | 应用商店/OTA | 审核发布 |
| 原生能力 | 弱（JSBridge） | 强 | 中（微信 API） |
| 调试 | Chrome | Metro/DevTools | 微信开发者工具 |

---

## 31. 练习

### React
1. 用 Hooks 写一个计数器，支持 +1、-1、重置。
2. 写一个搜索列表：输入防抖、loading、空状态、错误重试。
3. 把 Todo 拆成 4 个组件，画出数据流。
4. 用 `useReducer` 重写 Todo。
5. 用 Context 实现主题切换。
6. 用 react-router 实现列表 → 详情 → 返回。
7. 用 `React.memo` + `useCallback` 优化一个列表，并用 Profiler 对比。

### RN
8. 用 FlatList 渲染 1000 条数据，滚动是否流畅。
9. 给列表加下拉刷新和上拉加载。
10. 用 react-navigation 实现列表 → 详情。
11. 写一个搜索框 + 列表 + 空状态。
12. 用 `Animated` 做一个淡入动画，开启 `useNativeDriver`。
13. 把列表项抽成 `memo` 组件，观察重渲染次数。

---

## 32. 自查清单

### React
- [ ] 能写 JSX，知道 className、style、条件渲染、列表 key。
- [ ] 能区分 props 和 state，知道不可变更新。
- [ ] 会用 useState、useEffect、useRef、useMemo、useCallback。
- [ ] 能解释 useEffect 依赖和清理函数。
- [ ] 能解释 Hooks 规则及原因。
- [ ] 能解释虚拟 DOM、diff、Fiber。
- [ ] 会组件通信、Context、路由。
- [ ] 能说出 5 种性能优化手段。
- [ ] 能独立写 Todo/列表/详情/搜索。

### RN
- [ ] 能说出 RN 和 H5 的区别。
- [ ] 会用 View/Text/Image/TextInput/Pressable/FlatList。
- [ ] 理解 RN Flex 默认 column、单位 dp。
- [ ] 会用 SafeArea、useWindowDimensions。
- [ ] 会 FlatList 优化和分页。
- [ ] 会用 react-navigation 传参/返回。
- [ ] 能解释 Bridge、JSI、Fabric、TurboModules、Hermes。
- [ ] 能说出 RN 性能优化手段。
- [ ] 会调试、打包、发版流程。
