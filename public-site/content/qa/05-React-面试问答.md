# 05 · React 面试问答分册

> 对应知识文档：[05-React与ReactNative.md](../05-React与ReactNative.md)
>
> 用法：先自己答，再看“直接回答”；追问遮住答案练。

---

## Q1. React 的优缺点？

**直接回答：**

> 优点：声明式、组件化、生态好、跨端（RN）、虚拟 DOM 减少直接操作、社区大。缺点：不是完整框架（路由/状态管理要另选）、频繁更新要注意性能、JSX 有学习成本、大型应用状态管理复杂。

**追问 1：和 Vue 的区别？**

> React 更偏向 JS/函数式，JSX + Hooks，状态不可变；Vue 模板 + 响应式，上手更直观，API 更集成。选型看团队和生态，不是谁绝对更好。

**追问 2：什么场景不适合 React？**

> 极轻量的静态页面、对首屏体积极度敏感的场景，可能原生/SSR/静态生成更合适；但 React 也能做 SSR/SSG。

**陷阱/加分：**

- React 只是 UI 库，路由/请求/状态要自己组合。
- 虚拟 DOM 不一定比直接操作 DOM 快，它解决的是可维护性和跨平台。

---

## Q2. 函数组件和类组件的区别？

**直接回答：**

> 函数组件用 Hooks 管理状态和副作用，代码更简洁、逻辑复用更容易；类组件有生命周期、this、实例。现在新项目基本都用函数组件，错误边界仍需要类组件。

**追问 1：为什么推荐函数组件？**

> 逻辑可以抽成自定义 Hook，不用 HOC/render props 嵌套；没有 this 绑定问题；更符合 React 未来的并发特性。

**追问 2：函数组件每次渲染都会重新执行，性能差吗？**

> 函数重新执行很轻，真正的开销在 DOM 更新和重计算；可以用 memo/useMemo 优化，但不要过度。

**陷阱/加分：**

- 类组件的 setState 是合并，函数组件的 useState 是替换。
- 错误边界、getSnapshotBeforeUpdate 仍需要类组件。

---

## Q3. JSX 是什么？有哪些规则？

**直接回答：**

> JSX 是 JavaScript 的语法扩展，用类似 HTML 的写法描述 UI，最终被 Babel 转成 `React.createElement` 或 jsx runtime 调用。规则：只能一个根节点、`class` 写 `className`、样式是对象、标签必须闭合、表达式用 `{}`、不能写 if/for 语句。

**追问 1：`{0 && <div />}` 为什么渲染出 0？**

> `0` 是假值，`&&` 直接返回 0，React 会把 0 渲染出来；要写 `count > 0 && <div />`。

**追问 2：JSX 里怎么写条件/循环？**

> 条件用三元或 `&&`；循环用 `map`，并给每项稳定唯一的 key。

**陷阱/加分：**

- JSX 不是 HTML，属性名是驼峰（`onClick`、`tabIndex`）。
- 注释要写在 `{/* */}` 里。

---

## Q4. props 和 state 的区别？

**直接回答：**

> props 是父组件传进来的只读数据，子组件不能直接改；state 是组件内部的可变状态，通过 setState/useState 更新。props 变化会触发重新渲染，state 变化也会。

**追问 1：子组件想改父组件的数据怎么办？**

> 父组件传一个回调，子组件调用回调通知父组件，由父组件更新自己的 state。

**追问 2：state 为什么不能直接修改？**

> React 通过引用比较判断是否变化；直接改对象/数组，引用没变，可能跳过更新，还会导致调试困难。

**陷阱/加分：**

- props 是只读的，但对象内容仍可能被修改，团队要约定不可变。
- 派生 state 能算出来的不要存。

---

## Q5. `useState` 的更新为什么是异步的？

**直接回答：**

> React 会批量收集 state 更新，合并后在一次渲染中生效，避免每次 setState 都渲染。事件处理、Promise、setTimeout 在 React 18 里都会自动批处理。需要基于旧值更新时用函数式写法 `setCount(c => c + 1)`。

**追问 1：连续两次 `setCount(count + 1)` 为什么只加 1？**

> 两次都读到同一个旧的 count，最终都设置成 count+1；用函数式更新才能基于上一次结果累加。

**追问 2：什么时候会同步更新？**

> 一般不需要同步；确实要立即读 DOM 可以用 `flushSync`，但很少用，会影响性能。

**陷阱/加分：**

- setState 后立刻 console.log 读到旧值，是正常的。
- React 18 之前，setTimeout/Promise 里不会自动批处理。

---

## Q6. `useEffect` 的依赖数组怎么理解？

**直接回答：**

> 不写依赖：每次渲染后都执行；空数组：只在挂载后执行一次；有依赖：挂载后和依赖变化时执行。依赖里用到的 props/state 都应该写进去，否则会读到旧值。清理函数在依赖变化前和卸载时执行。

**追问 1：什么是闭包陷阱？**

> effect 捕获了某次渲染的 state，如果依赖没写，回调里永远是旧值；用函数式更新、ref 或补全依赖解决。

**追问 2：怎么处理请求竞态？**

> 用 AbortController 取消旧请求，或用 cancelled 标志/请求序号丢弃过期响应。

**陷阱/加分：**

- 开发环境 StrictMode 会执行两次 effect，这是故意的。
- 依赖是对象/函数时，每次渲染都是新引用，容易死循环；用 useMemo/useCallback 稳定。

---

## Q7. `useMemo` 和 `useCallback` 的区别？什么时候用？

**直接回答：**

> `useMemo` 缓存计算结果（值），`useCallback` 缓存函数引用。两者都依赖依赖数组。`useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`。主要用于避免重复计算和配合 `React.memo` 减少子组件重渲染。

**追问 1：什么时候不要用？**

> 简单计算、组件本身不重渲染、依赖经常变化时，缓存反而增加成本；先用 Profiler 定位再优化。

**追问 2：`useMemo` 能保证值不被销毁吗？**

> 不能。React 可能在内存压力下丢弃缓存，useMemo 是性能优化，不是语义保证。

**陷阱/加分：**

- 依赖数组要完整，否则缓存的是旧值。
- `React.memo` 只做浅比较，props 里的新对象/新函数会让它失效。

---

## Q8. 列表的 key 有什么用？为什么不能用 index？

**直接回答：**

> key 帮 React 判断元素是不是同一个，从而正确复用 DOM/组件状态。用 index 时，列表增删/排序会导致 key 变化，React 可能复用错误的节点，出现状态错位、输入框内容串行、多余渲染。key 应该用稳定唯一的业务 id。

**追问 1：key 需要全局唯一吗？**

> 不需要，只在兄弟节点之间唯一即可。

**追问 2：用随机数做 key 会怎样？**

> 每次渲染 key 都变，组件会被整体销毁重建，状态丢失、性能差。

**陷阱/加分：**

- key 不影响 props，不能通过 props 读取 key。
- 列表项有内部 state/输入框时，key 正确尤其重要。

---

## Q9. 虚拟 DOM 是什么？diff 怎么做的？

**直接回答：**

> 虚拟 DOM 是用 JS 对象描述 UI 的树。状态变化时生成新树，和旧树比较，只更新差异。React 用三个启发式规则把复杂度降到 O(n)：类型不同直接替换；类型相同更新属性；列表用 key 匹配。

**追问 1：虚拟 DOM 一定比真实 DOM 快吗？**

> 不一定。直接操作 DOM 可以更快，但虚拟 DOM 让开发者不用手动管理更新，配合 diff 减少不必要的 DOM 操作，整体可维护性更好。

**追问 2：类型相同但内容不同怎么处理？**

> 保留 DOM 节点，更新变化的属性/文本/子节点；子节点继续递归 diff。

**陷阱/加分：**

- diff 是启发式，不是最优算法。
- key 是列表 diff 的核心。

---

## Q10. Fiber 是什么？解决了什么问题？

**直接回答：**

> Fiber 是 React 16 的协调引擎。它把渲染拆成可中断的小任务，render 阶段可以暂停、让出主线程，优先处理用户输入等高优先级任务，commit 阶段再一次性更新 DOM。配合双缓存和 lanes 优先级模型，实现并发渲染。

**追问 1：render 和 commit 的区别？**

> render 阶段计算变化，可中断、可重复执行；commit 阶段同步执行 DOM 更新、生命周期、ref，不可中断。

**追问 2：双缓存是什么？**

> current 树是屏幕上的树，workInProgress 是正在构建的新树；构建完成后切换，避免半成品直接显示。

**陷阱/加分：**

- Fiber 不是“更快的 DOM”，它解决的是可中断/优先级。
- 并发特性需要 React 18 的 createRoot。

---

## Q11. React 事件和原生事件的区别？

**直接回答：**

> React 使用合成事件，跨浏览器统一，事件名驼峰；React 17 之前委托到 document，17 之后委托到根容器；`e.target` 是实际触发元素，`e.currentTarget` 是绑定监听器的元素。阻止默认和冒泡的 API 和原生一致。

**追问 1：为什么事件要委托到根容器？**

> 减少监听器数量、统一管理、支持动态节点；React 17 改到根容器是为了多版本 React 共存和微前端隔离。

**追问 2：合成事件对象会被复用吗？**

> 旧版本会复用，异步访问要 `e.persist()`；新版本不再复用，可以异步访问。

**陷阱/加分：**

- `onClick` 不是 `onclick`。
- 原生事件和 React 事件可以混用，但要注意执行顺序。

---

## Q12. 受控组件和非受控组件的区别？

**直接回答：**

> 受控组件的值由 state 控制，每次输入都触发 onChange 和重渲染，适合实时校验/联动；非受控组件用 defaultValue 和 ref，值存在 DOM 里，适合简单表单/文件上传。大型表单常用 react-hook-form。

**追问 1：受控组件性能差吗？**

> 每次输入都渲染，但通常没问题；大表单可以局部 state、非受控或 react-hook-form。

**追问 2：文件上传为什么用非受控？**

> `input type="file"` 的值是只读的，只能用 ref 读取文件对象。

**陷阱/加分：**

- 受控组件忘了写 onChange，输入框会变只读。
- 受控组件的 value 不能是 undefined。

---

## Q13. Context 有什么用？有什么缺点？

**直接回答：**

> Context 用于跨层传值，比如主题、登录用户、语言，避免 props 一层层传。缺点是值变化会让所有消费者重新渲染，嵌套多了可读性差。

**追问 1：怎么减少 Context 的重渲染？**

> 拆分 Context、用 memo 包裹消费者、把低频变化的值放 Context，高频状态用状态管理库。

**追问 2：Context 和 Redux 的区别？**

> Context 是传值机制，不是状态管理；Redux 提供 store、dispatch、中间件、DevTools。小范围共享用 Context，复杂状态用 Redux/Zustand。

**陷阱/加分：**

- Provider 的 value 每次渲染新建对象，会导致所有消费者重渲染，要用 useMemo 稳定。
- Context 适合低频变化的数据。

---

## Q14. 错误边界能捕获哪些错误？

**直接回答：**

> 只能捕获子组件在渲染、生命周期、构造函数里的错误。捕获不了事件处理、异步代码（setTimeout/Promise）、服务端渲染、错误边界自身的错误。

**追问 1：错误边界怎么写？**

> 类组件实现 `static getDerivedStateFromError` 和 `componentDidCatch`，渲染 fallback。

**追问 2：异步错误怎么处理？**

> 用 try/catch、Promise.catch、全局 `window.onerror`/`unhandledrejection`，或 React 19 的 `use`/错误处理方案。

**陷阱/加分：**

- 错误边界要放在可能出错的子树外层。
- 不要让整个应用只有一个错误边界，粒度要合理。

---

## Q15. React 18 有哪些新特性？

**直接回答：**

> 自动批处理、并发渲染（useTransition/useDeferredValue）、Suspense 增强、`createRoot`、新的 StrictMode 行为、`useId`、流式 SSR。

**追问 1：自动批处理是什么？**

> 多个 state 更新会合并成一次渲染；React 18 在事件、Promise、setTimeout 里都会自动批处理。

**追问 2：useTransition 用在哪？**

> 把非紧急更新（大列表过滤）标记为 transition，让输入等高优先级更新不被阻塞。

**陷阱/加分：**

- React 18 要用 createRoot，旧 ReactDOM.render 不再推荐。
- 并发特性不是多线程，是任务调度。

---

## Q16. React 怎么性能优化？

**直接回答：**

> 先用 Profiler 定位；减少重渲染（memo/useCallback/useMemo、状态下放、稳定 key）；长列表虚拟滚动；代码分割（lazy/Suspense）；图片懒加载；避免在 render 里做重计算/请求；大计算用 Web Worker；必要时用并发特性。

**追问 1：memo 为什么没生效？**

> props 里有每次新建的对象/函数，浅比较不相等；用 useMemo/useCallback 稳定，或自定义比较函数。

**追问 2：状态放哪最合适？**

> 放在最近需要它的共同父级；能下放就下放，避免整个页面重渲染。

**陷阱/加分：**

- 不要盲目加 memo/useMemo，先测量。
- key 不稳定会导致组件重建，性能更差。

---

## Q17. setState 之后发生了什么？

**直接回答：**

> 调用 setState 后，React 把更新加入队列，调度器根据优先级安排渲染；render 阶段计算新的虚拟 DOM 并 diff；commit 阶段更新真实 DOM、执行 layout effect 和 effect。函数组件里对应的是重新执行整个函数。

**追问 1：为什么 setState 有时同步有时异步？**

> React 会批处理更新，在事件/生命周期里合并后异步渲染；flushSync 可以强制同步，但很少用。

**追问 2：setState 会立即改变 this.state 吗？**

> 不会，state 在下次渲染前还是旧值；需要基于旧值更新用函数式写法。

**陷阱/加分：**

- 类组件 setState 是浅合并，函数组件 useState 是替换。
- 多次 setState 可能只触发一次渲染。

---

## Q18. Hooks 的使用规则？为什么？

**直接回答：**

> 只能在函数组件或自定义 Hook 的顶层调用，不能在条件、循环、嵌套函数里调用。因为 React 靠 Hook 的调用顺序来对应 state，条件调用会让顺序错乱。

**追问 1：为什么不能在普通函数里用 Hook？**

> 普通函数没有 React 的 current hook 上下文，无法正确挂载状态；要抽逻辑就写自定义 Hook（以 use 开头）。

**追问 2：eslint-plugin-react-hooks 有什么用？**

> 检查 Hook 调用规则和 useEffect 依赖，提前发现闭包/漏依赖问题。

**陷阱/加分：**

- 自定义 Hook 名字必须以 use 开头，方便 lint 识别。
- 不要用条件语句绕过 Hook 规则，重构组件结构。

---

## Q19. 自定义 Hook 是什么？和普通函数有什么区别？

**直接回答：**

> 自定义 Hook 是以 use 开头的函数，内部可以调用其他 Hook，用来复用状态逻辑。它和普通函数的区别是能使用 React 的 Hook 能力，并且遵循 Hook 规则；它不会共享状态，每次调用都是独立的。

**追问 1：两个组件用同一个自定义 Hook，状态共享吗？**

> 不共享，各自独立；要共享状态用 Context/状态管理。

**追问 2：自定义 Hook 能返回什么？**

> 可以返回任意值：状态、函数、对象、数组；通常返回一个对象或数组，方便解构。

**陷阱/加分：**

- 自定义 Hook 不是组件，不渲染 UI。
- 依赖要写完整，否则同样有闭包陷阱。

---

## Q20. React 路由怎么用？

**直接回答：**

> 用 react-router-dom v6：`BrowserRouter` 包住应用，`Routes/Route` 配置路径，`useParams` 拿参数，`useNavigate` 跳转，`Link` 做声明式导航。复杂项目可以用 `createBrowserRouter`。

**追问 1：路由懒加载怎么做？**

> `React.lazy(() => import('./Detail'))` + `Suspense`，按路由拆分代码。

**追问 2：刷新 404 怎么解决？**

> 开发服务器配 `historyApiFallback`，生产 Nginx 配 `try_files $uri /index.html`，把未知路径回退到 index.html。

**陷阱/加分：**

- React Router 不是 React 内置，要单独安装。
- 路由参数是字符串，要转数字。

---

## Q21. React 状态管理怎么选？

**直接回答：**

> 组件内部用 useState/useReducer；兄弟组件状态提升；跨层低频用 Context；大型应用/复杂状态用 Redux Toolkit；中小项目用 Zustand；服务端数据用 TanStack Query/SWR。

**追问 1：什么时候需要 Redux？**

> 状态复杂、跨模块共享、需要时间旅行调试/中间件、团队协作规范明确时；简单项目不必上。

**追问 2：Context 能代替 Redux 吗？**

> 小范围可以，但 Context 缺少中间件、DevTools、选择器优化；高频更新容易导致大范围重渲染。

**陷阱/加分：**

- 不要把所有状态都放全局，先区分本地/共享/服务端状态。
- 服务端数据缓存和 UI 状态是两类问题。

---

## Q22. SSR 和 CSR 的区别？

**直接回答：**

> CSR 是客户端渲染，首屏 HTML 很空，JS 下载执行后才渲染；SSR 是服务端生成 HTML，首屏更快、SEO 更好，但服务器有压力，还要处理 hydration。SSG 是构建时生成静态 HTML。

**追问 1：什么是 hydration？**

> 客户端接管服务端返回的 HTML，绑定事件、恢复状态；如果前后 HTML 不一致，会 hydration mismatch。

**追问 2：SSR 有什么坑？**

> 浏览器 API 不能在服务端用；数据预取；样式/状态隔离；缓存和降级；服务器成本。

**陷阱/加分：**

- SSR 不一定比 CSR 快，取决于服务端和网络。
- Next.js/Remix 是常见 SSR 框架。

---

## Q23. `React.lazy` 和 `Suspense` 怎么用？

**直接回答：**

> `React.lazy(() => import('./Component'))` 动态加载组件，`Suspense` 提供 fallback，在加载完成前显示 loading。常用于路由级代码分割。

**追问 1：Suspense 能捕获数据请求吗？**

> React 18 的 Suspense 主要用于代码分割；数据请求的 Suspense 需要框架/库支持（如 Relay、Next.js、React 19 的 use）。

**追问 2：lazy 组件加载失败怎么办？**

> 用错误边界捕获，提供重试/降级；注意部署后旧 chunk 404 的问题。

**陷阱/加分：**

- lazy 只能用于默认导出，或 `.then(m => ({ default: m.X }))`。
- Suspense 的 fallback 要避免布局跳动。

---

## Q24. React 19 有哪些新东西？（了解）

**直接回答：**

> React 19 主要有 Actions、`useActionState`、`useOptimistic`、`use` API、ref 作为 prop、文档元数据、更好的 hydration 错误提示，以及 React Compiler（独立工具）做自动 memo 化。面试以 18 为主，19 了解即可。

**追问 1：Actions 解决什么？**

> 简化表单提交/异步 mutation 的 pending、错误、乐观更新处理。

**追问 2：React Compiler 是什么？**

> 编译期自动插入 memo 化，减少手写 useMemo/useCallback；不是运行时库。

**陷阱/加分：**

- 不要把所有项目都迁到 19，先看生态兼容。
- 19 的新 API 仍要理解底层状态/渲染原理。

---

## 25. 快速自测

- [ ] 能说出 React 的优缺点和适用场景。
- [ ] 能解释函数组件/Hooks 为什么成为主流。
- [ ] 能解释 JSX 规则和条件/列表渲染。
- [ ] 能解释 useState 异步、批处理、函数式更新。
- [ ] 能解释 useEffect 依赖、清理、闭包陷阱、竞态。
- [ ] 能解释 useMemo/useCallback 和 memo 的配合。
- [ ] 能解释 key 为什么不能用 index。
- [ ] 能画虚拟 DOM diff 和 Fiber 的 render/commit。
- [ ] 能说出 5 种性能优化。
- [ ] 能区分 Context/Redux/Zustand/TanStack Query。
- [ ] 能解释 SSR/hydration。
