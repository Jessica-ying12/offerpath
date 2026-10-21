# 03 · JavaScript 面试问答分册

> 对应知识文档：[03-JavaScript核心与底层原理.md](../03-JavaScript核心与底层原理.md)
>
> 用法：先自己答，再看“直接回答”；追问遮住答案练。

---

## Q1. `var`、`let`、`const` 的区别？

**直接回答：**

> `var` 是函数作用域，会提升且初始化为 undefined，可以重复声明，全局时挂到 window；`let/const` 是块级作用域，会提升但有 TDZ，不能重复声明。`const` 不能重新赋值，但对象内容可以改。业务里默认用 `const`，需要重新赋值用 `let`，基本不用 `var`。

**追问 1：什么是 TDZ？**

> 暂时性死区。`let/const` 从块开始到声明语句之间，变量存在但不能访问，访问会报 `ReferenceError`。

**追问 2：`const` 定义的对象能改吗？**

> 能改内容，不能重新赋值。`const` 保证的是绑定不变，不是值不可变；要真正冻结用 `Object.freeze`。

**陷阱/加分：**

- `var` 在循环里共享同一个变量，配合 `setTimeout` 会出现 3 3 3。
- 函数声明会提升，函数表达式不会。

---

## Q2. JS 有哪些数据类型？怎么判断？

**直接回答：**

> 7 种原始类型：string、number、boolean、undefined、null、symbol、bigint；再加引用类型 object（数组、函数、日期等都是对象）。`typeof` 适合原始类型，但 `typeof null` 是 'object'；数组用 `Array.isArray`，更通用的用 `Object.prototype.toString.call`。

**追问 1：为什么 `typeof null` 是 object？**

> 这是 JS 早期实现的历史 bug。当时用低位标识类型，对象的标识是 000，null 的机器表示全是 0，被误判为 object；为了兼容性一直没修。

**追问 2：`instanceof` 和 `Object.prototype.toString` 怎么选？**

> `instanceof` 看原型链，不能跨 iframe；`toString.call` 更通用，能区分 Array、Date、RegExp、Null 等。

**陷阱/加分：**

- `NaN` 是 number 类型。
- 函数 `typeof` 是 'function'，但它也是对象。

---

## Q3. `==` 和 `===` 的区别？

**直接回答：**

> `===` 不做类型转换，类型不同直接 false；`==` 会做类型转换，规则复杂，比如 `'' == 0`、`[] == false` 都是 true。业务代码统一用 `===`，只有判断 null/undefined 时可以用 `x == null`。

**追问 1：`null == undefined` 为什么是 true？**

> 规范里规定 null 和 undefined 互相宽松相等，但它们不等于 0、''、false。

**追问 2：`[] == false` 为什么是 true？**

> 两边都转成数字：`[]` 先转成空字符串，再转成 0；`false` 转成 0，所以相等。

**陷阱/加分：**

- `NaN == NaN` 和 `NaN === NaN` 都是 false。
- 用 `Object.is` 可以区分 `0` 和 `-0`，也能判断 NaN。

---

## Q4. 闭包是什么？有什么用？有什么问题？

**直接回答：**

> 闭包是函数和它定义时词法环境的组合。内部函数引用了外部函数的变量，即使外部函数执行完，这些变量仍然保留。它常用于私有变量、函数工厂、防抖节流、缓存。代价是变量不会被回收，滥用可能导致内存泄漏。

**追问 1：闭包为什么会内存泄漏？**

> 闭包持有的变量不会被垃圾回收，如果闭包长期存在（挂在全局、定时器、事件监听上）且引用了大对象，大对象就回收不了。

**追问 2：循环里为什么用 var 输出 3 3 3？**

> var 是函数作用域，三个回调共享同一个 i，循环结束时 i 是 3。用 let 每次迭代创建新的块级绑定，就能输出 0 1 2。

**陷阱/加分：**

- 闭包不是“函数里再写一个函数”这么简单，关键是引用了外部变量。
- 防抖/节流保存 timer 就是闭包。

---

## Q5. `this` 的指向规则？

**直接回答：**

> 五条规则：默认绑定（普通调用，严格模式 undefined，非严格 window）、隐式绑定（`obj.fn()` 指向 obj）、显式绑定（call/apply/bind）、new 绑定（指向新对象）、箭头函数（没有自己的 this，取外层）。优先级：new > bind > call/apply > 隐式 > 默认。

**追问 1：`const fn = obj.method; fn()` 的 this 是谁？**

> 默认绑定。严格模式/模块里是 undefined，非严格浏览器里是 window；不是 obj。

**追问 2：箭头函数能被 bind 改变 this 吗？**

> 不能。箭头函数的 this 在定义时就确定了，bind 无效。

**陷阱/加分：**

- `new` 一个 bind 过的函数，this 指向新对象，bind 失效。
- setTimeout/setInterval 的普通函数回调最容易丢 this。

---

## Q6. 原型链是什么？

**直接回答：**

> 每个对象都有 `__proto__` 指向它的原型，每个函数都有 `prototype` 属性。访问属性时先找自身，找不到就沿 `__proto__` 向上找，直到 `Object.prototype`，再往上就是 null。这就是原型链。

**追问 1：`prototype` 和 `__proto__` 的区别？**

> `prototype` 是函数才有的属性，指向原型对象；`__proto__` 是对象都有的属性，指向它的原型。`p.__proto__ === Person.prototype`。

**追问 2：`instanceof` 的原理？**

> 沿对象的原型链查找，看能否找到构造函数的 `prototype`；找到返回 true，到 null 返回 false。

**陷阱/加分：**

- 原型链终点是 `Object.prototype.__proto__ === null`。
- `Object.create(null)` 创建没有原型的对象，适合做字典。

---

## Q7. `new` 做了什么？

**直接回答：**

> 四步：创建一个新对象；把新对象的 `__proto__` 指向构造函数的 `prototype`；把 this 指向新对象并执行构造函数；如果构造函数返回对象，就返回这个对象，否则返回新对象。

**追问 1：构造函数返回原始值会怎样？**

> 忽略返回值，仍然返回新创建的对象。

**追问 2：手写 new 的关键点？**

> `Object.create(Ctor.prototype)` 创建对象，`Ctor.apply(obj, args)` 执行构造函数，最后判断返回值是否是对象/函数。

**陷阱/加分：**

- 箭头函数不能 new。
- class 必须用 new 调用。

---

## Q8. JS 继承有哪些方式？class 和构造函数的关系？

**直接回答：**

> 有原型链继承、构造函数继承、组合继承、寄生组合继承，ES6 class 用 `extends/super`。class 本质上是原型继承的语法糖，但更严格：必须 new、内部自动严格模式、方法不可枚举。

**追问 1：组合继承有什么问题？**

> 会调用两次父类构造函数，父类实例属性被创建两次；寄生组合继承用 `Object.create(Parent.prototype)` 解决。

**追问 2：`super` 做了什么？**

> 调用父类构造函数（constructor 里）或父类方法；在 constructor 里必须先调用 super 才能使用 this。

**陷阱/加分：**

- class 声明有 TDZ，不能提前使用。
- class 方法不可枚举，构造函数原型方法可枚举。

---

## Q9. 事件循环是什么？

**直接回答：**

> JS 单线程，同步代码在调用栈执行。异步任务完成后，回调进入任务队列。事件循环不断取任务执行：先执行同步代码，调用栈清空后清空所有微任务，然后可能渲染，再取一个宏任务，如此循环。Promise.then 是微任务，setTimeout 是宏任务。

**追问 1：宏任务和微任务分别有哪些？**

> 宏任务：script、setTimeout、setInterval、MessageChannel、I/O、UI 事件；微任务：Promise.then、queueMicrotask、MutationObserver。

**追问 2：Node 的事件循环和浏览器一样吗？**

> 不完全一样。Node 分 timers、poll、check 等阶段，每个阶段之间清空 nextTick 和 Promise 微任务；`process.nextTick` 优先于 Promise。

**陷阱/加分：**

- 每执行完一个宏任务，都会清空一次微任务队列。
- 微任务里新产生的微任务也会在本轮清空。

---

## Q10. 输出题：`1 4 3 2` 为什么？

```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
```

**直接回答：**

> 先执行同步代码，打印 1、4；调用栈清空后清空微任务，打印 3；最后执行宏任务 setTimeout，打印 2。

**追问 1：如果在 then 里再套一个 then 呢？**

> 第二个 then 会在当前微任务队列清空时继续执行，仍然早于 setTimeout。

**追问 2：async/await 的输出怎么排？**

> await 会暂停当前函数，把后面的代码放到微任务；同步代码先执行，然后按入队顺序执行微任务，最后才是宏任务。

**陷阱/加分：**

- `setTimeout(fn, 0)` 不是立即执行，是至少 0ms 后进入宏任务队列。
- 渲染时机在微任务清空之后、下一个宏任务之前。

---

## Q11. Promise 有哪些状态？`then` 返回什么？

**直接回答：**

> 三种状态：pending、fulfilled、rejected，状态一旦改变不可逆。`then` 返回一个新的 Promise，所以可以链式调用；回调里返回值会传给下一个 then，返回 Promise 会等待它，抛错会进入 catch。

**追问 1：`catch` 能捕获哪些错误？**

> 前面任意一步的 reject、then 回调里抛出的错误、以及返回的 Promise 的 reject；不能捕获回调里异步抛出的错误。

**追问 2：`finally` 有什么特点？**

> 不管成功失败都执行，不接收结果；如果返回 Promise，会等它完成，但不会改变原结果（除非抛错）。

**陷阱/加分：**

- 没有 catch 的 rejection 会变成 unhandledrejection。
- `then(onFulfilled, onRejected)` 的 onRejected 只捕获当前 Promise 的失败，不捕获 onFulfilled 里的错误，所以通常用 catch。

---

## Q12. async/await 的原理？

**直接回答：**

> async 函数永远返回 Promise；await 会暂停当前函数的执行，把后面的代码放到微任务里，等 Promise 完成后再继续。它本质上是 Promise 的语法糖，让异步代码看起来像同步。错误用 try/catch 捕获。

**追问 1：async 函数里 return 一个 Promise 会怎样？**

> 会等待这个 Promise 完成，再把结果作为外层 Promise 的结果。

**追问 2：怎么并行执行多个 await？**

> 用 `Promise.all([p1, p2])`，不要一个接一个 await，否则总耗时是相加的。

**陷阱/加分：**

- `forEach` 里的 async 不会被外层 await。
- `await` 后面的代码相当于 then 回调，是异步的。

---

## Q13. 深拷贝和浅拷贝的区别？

**直接回答：**

> 浅拷贝只复制第一层，嵌套对象还是同一个引用；深拷贝递归复制所有层级。浅拷贝用展开运算符、`Object.assign`；深拷贝可以用 `structuredClone`、递归 + WeakMap 处理循环引用；JSON 方法有局限，会丢失函数、undefined、Symbol，Date 变字符串。

**追问 1：怎么处理循环引用？**

> 用 WeakMap 记录已拷贝的对象，遇到已存在的直接返回，避免无限递归。

**追问 2：`structuredClone` 有什么限制？**

> 支持 Date、Map、Set、循环引用，但不支持函数、DOM 节点、原型链上的自定义类。

**陷阱/加分：**

- 展开运算符只拷贝可枚举的自有属性。
- 深拷贝函数通常按引用返回。

---

## Q14. 防抖和节流的区别？

**直接回答：**

> 防抖是连续触发时只在停止后执行一次，适合搜索输入、窗口 resize；节流是固定时间内最多执行一次，适合滚动加载、拖拽。防抖用 clearTimeout + setTimeout，节流用时间戳或定时器。

**追问 1：防抖怎么立刻执行一次？**

> 加 `immediate` 参数：第一次触发立即执行，之后等停止 delay 才允许下一次。

**追问 2：节流怎么保证最后一次也执行？**

> 用时间戳 + 定时器结合，尾部补一次；或者记录最后一次参数，在定时器里执行。

**陷阱/加分：**

- 防抖/节流返回的函数要保留 this 和参数。
- 组件卸载时要 cancel，避免内存泄漏。

---

## Q15. 数组常用方法有哪些？哪些会改变原数组？

**直接回答：**

> 增删改：push/pop/shift/unshift/splice/sort/reverse 会改变原数组；slice/concat/map/filter/reduce/find/some/every/flat 不改。`sort` 默认按字符串排序，要传比较函数。

**追问 1：`map`、`filter`、`reduce` 的区别？**

> map 一对一转换，返回等长新数组；filter 过滤，返回子集；reduce 归约成一个值，可以做求和、分组、扁平化。

**追问 2：`splice` 和 `slice` 的区别？**

> splice 会修改原数组，返回被删除的元素；slice 不修改，返回截取的新数组。

**陷阱/加分：**

- `[10, 2, 1].sort()` 得到 `[1, 10, 2]`。
- `reduce` 不给初始值且数组为空会报错。

---

## Q16. `map` 和 `forEach` 的区别？

**直接回答：**

> `map` 返回一个新数组，长度不变；`forEach` 只遍历，返回 undefined。需要转换结果用 map，只做副作用用 forEach。两者都不能 break，需要提前终止用 some/every 或 for 循环。

**追问 1：`forEach` 能 return 吗？**

> 能 return，但只是跳过当前回调，不会终止循环，也不会改变返回值。

**追问 2：哪个性能好？**

> 通常差别不大；map 会创建新数组，内存开销更大。选语义合适的。

**陷阱/加分：**

- `map` 里的 async 不会自动 await。
- 稀疏数组：forEach 跳过空位，map 保留空位。

---

## Q17. `for...in` 和 `for...of` 的区别？

**直接回答：**

> `for...in` 遍历对象的可枚举键，包括原型链上的，适合对象但要用 `Object.hasOwn` 过滤；`for...of` 遍历可迭代对象的值（数组、字符串、Map、Set），不能直接遍历普通对象。

**追问 1：为什么 for...in 会遍历到原型属性？**

> 它遍历的是可枚举属性，包括原型链；所以要用 `Object.hasOwn(obj, key)` 或 `Object.keys`。

**追问 2：普通对象怎么用 for...of？**

> 用 `Object.keys/values/entries` 转成数组，或给对象实现 `Symbol.iterator`。

**陷阱/加分：**

- 数组用 for...in 拿到的是字符串索引，不推荐。
- for...of 可以用 break/continue。

---

## Q18. 事件流是什么？事件委托怎么做？

**直接回答：**

> 事件流分捕获、目标、冒泡三个阶段。事件委托是把监听器绑在父元素上，利用冒泡处理子元素事件，通过 `e.target.closest()` 找到实际目标。好处是只绑一个监听器、动态元素自动生效、不用逐个解绑。

**追问 1：`target` 和 `currentTarget` 的区别？**

> target 是实际触发事件的最深元素；currentTarget 是绑定监听器的元素。事件委托里常用 currentTarget 拿 data-*。

**追问 2：怎么阻止冒泡和默认行为？**

> `stopPropagation()` 阻止冒泡；`preventDefault()` 阻止默认行为（链接跳转、表单提交）；`stopImmediatePropagation()` 还阻止同元素其他监听器。

**陷阱/加分：**

- `passive: true` 用于滚动事件，告诉浏览器不会 preventDefault，滚动更流畅。
- 事件委托不适合不冒泡的事件（如 focus/blur，需用 capture）。

---

## Q19. DOM 操作怎么做？怎么减少重排？

**直接回答：**

> 查询用 `querySelector/querySelectorAll`，创建用 `createElement`，插入用 `append/insertBefore`，删除用 `remove`，类名用 `classList`。减少重排：用 DocumentFragment 批量插入、先读后写、用 class 批量改样式、图片写宽高、避免频繁读取 offsetWidth。

**追问 1：`innerHTML` 和 `textContent` 的区别？**

> `innerHTML` 会解析 HTML，性能较好但有 XSS 风险；`textContent` 只当纯文本，安全。用户输入优先用 textContent。

**追问 2：DocumentFragment 为什么快？**

> 它不在真实 DOM 树上，批量插入时只触发一次重排，而不是每个节点都触发。

**陷阱/加分：**

- 不要用 `innerHTML` 拼用户输入；富文本要 DOMPurify 清洗。
- `querySelectorAll` 返回静态 NodeList，`getElementsByClassName` 是动态 HTMLCollection。

---

## Q20. 垃圾回收怎么工作？哪些情况会内存泄漏？

**直接回答：**

> 现代浏览器主要用标记-清除：从根对象出发标记可达对象，未标记的回收；还有分代回收。常见泄漏：意外的全局变量、未清除的定时器、未移除的事件监听、闭包引用大对象、Detached DOM、Map 键不删除。

**追问 1：引用计数为什么不能解决循环引用？**

> 两个对象互相引用，引用计数都不为 0，即使外部已经不可达，也回收不了；标记-清除从根出发，能找到它们不可达。

**追问 2：怎么排查内存泄漏？**

> Chrome DevTools → Memory → Heap Snapshot，对比操作前后的快照，看 Detached DOM 和异常增长的对象；Performance Monitor 看内存曲线是否持续上升。

**陷阱/加分：**

- 单页应用切换页面时要清理定时器、监听、订阅。
- WeakMap/WeakSet 的键是弱引用，不阻止回收。

---

## Q21. CommonJS 和 ES Module 的区别？

**直接回答：**

> CommonJS 是运行时同步加载，`require/module.exports`，导出值是拷贝；ESM 是编译时静态分析，`import/export`，异步加载，导出值是实时绑定，支持 tree shaking 和顶层 await。

**追问 1：什么是实时绑定？**

> 导出的变量变化，导入方能看到最新值；CommonJS 导出的是值的拷贝，变化后导入方看不到。

**追问 2：为什么 ESM 能 tree shaking？**

> 依赖关系在编译时就能确定，打包工具可以静态分析哪些导出没被使用并删除；CommonJS 是运行时加载，无法可靠分析。

**陷阱/加分：**

- ESM 顶层 this 是 undefined，CommonJS 是 module.exports。
- ESM 是严格模式。

---

## Q22. `call`、`apply`、`bind` 的区别？

**直接回答：**

> 都能改变 this。call 和 apply 立即执行，call 参数逐个传，apply 传数组；bind 不立即执行，返回一个新函数，可以预设参数，支持 new。

**追问 1：手写 bind 的关键点？**

> 返回函数里用 `fn.apply(this instanceof Bound ? this : context, args)`；还要让 `Bound.prototype = Object.create(fn.prototype)`，保证 new 出来的对象能访问原原型。

**追问 2：bind 后还能被 new 改变 this 吗？**

> 能。用 new 调用绑定函数时，this 指向新对象，bind 的 context 失效。

**陷阱/加分：**

- `apply` 的第二个参数是类数组/数组。
- 箭头函数不能用 call/apply/bind 改变 this。

---

## Q23. `instanceof` 的原理？手写怎么实现？

**直接回答：**

> 沿对象的原型链查找，看能否找到构造函数的 `prototype`；找到返回 true，到 null 返回 false。

**追问 1：为什么原始值 `instanceof` 是 false？**

> 原始值不是对象，没有原型链；`1 instanceof Number` 是 false，但 `new Number(1) instanceof Number` 是 true。

**追问 2：跨 iframe 为什么不可靠？**

> 不同 iframe 有各自的全局环境和构造函数，原型链不是同一个，`instanceof Array` 可能失败；用 `Array.isArray` 更可靠。

**陷阱/加分：**

- `instanceof` 可以判断继承关系，比如 Dog 实例也是 Animal。
- `Object.create(null)` 的对象没有原型链。

---

## Q24. `Promise.all`、`allSettled`、`race`、`any` 的区别？

**直接回答：**

> `all` 全部成功才成功，有一个失败就失败；`allSettled` 等全部结束，返回每个的成功/失败结果；`race` 第一个结束（成功或失败）就返回；`any` 第一个成功就返回，全部失败才失败。

**追问 1：什么时候用 allSettled？**

> 多个接口互不依赖，希望部分失败也保留其他结果，比如首页多个模块。

**追问 2：any 和 race 的区别？**

> race 第一个结束就返回，哪怕是失败；any 忽略失败，等第一个成功，全部失败才 reject。

**陷阱/加分：**

- `all` 的结果顺序和传入顺序一致。
- `any` 全部失败会抛 AggregateError。

---

## Q25. 箭头函数和普通函数的区别？

**直接回答：**

> 箭头函数没有自己的 this，取定义时外层作用域的 this；没有 arguments，用 rest 参数；不能 new，没有 prototype；不能用作生成器。适合回调和短函数，不适合对象方法和需要动态 this 的场景。

**追问 1：为什么对象方法不用箭头函数？**

> 箭头函数的 this 不指向对象，而是外层作用域，`obj.method()` 里拿不到 obj。

**追问 2：箭头函数能写 return 对象吗？**

> 可以，但要加括号：`() => ({ a: 1 })`，否则 `{}` 被当成代码块。

**陷阱/加分：**

- 箭头函数不能改变 this，call/apply/bind 无效。
- 箭头函数没有 prototype，不能作为构造函数。

---

## Q26. 类型转换、NaN、0.1+0.2 怎么答？

**直接回答：**

> 隐式转换常见于 `+`、`==`、条件判断。假值只有 false、0、-0、0n、''、null、undefined、NaN。`NaN` 不等于任何值，用 `Number.isNaN` 判断。`0.1+0.2` 是 IEEE 754 浮点精度问题，金额用整数分或 decimal.js。

**追问 1：`[] + {}` 是什么？**

> `'[object Object]'`。数组转成空字符串，对象转成 `[object Object]`，然后字符串拼接。

**追问 2：`Number('')` 和 `parseInt('')` 分别是什么？**

> `Number('')` 是 0；`parseInt('')` 是 NaN。

**陷阱/加分：**

- `Boolean([])` 和 `Boolean({})` 都是 true。
- `parseInt('12px')` 是 12，`Number('12px')` 是 NaN。

---

## Q27. V8 有哪些优化？写代码要注意什么？

**直接回答：**

> V8 用 Ignition 解释字节码，TurboFan 优化热点代码；用隐藏类、内联缓存加速属性访问。写代码时保持对象形状稳定、不要频繁增删属性、数组不要混装不同类型，避免去优化。

**追问 1：什么是隐藏类？**

> V8 给对象建立形状描述，属性访问按固定偏移查找；对象形状稳定，访问更快。

**追问 2：什么会导致去优化？**

> 类型变化、删除属性、数组元素类型混合、函数参数类型不稳定等，会让优化代码回退到字节码。

**陷阱/加分：**

- 这些是加分项，基础题（闭包/原型/事件循环）更重要。
- 不要为了微优化牺牲可读性。

---

## 28. 快速自测

- [ ] 能解释 var/let/const、TDZ、循环陷阱。
- [ ] 能说出 8 种类型和判断方式。
- [ ] 能解释闭包、this 五规则、原型链、new。
- [ ] 能画事件循环并做对输出题。
- [ ] 能解释 Promise 状态、then 链、async/await。
- [ ] 能手写防抖、节流、深拷贝、call/bind、new。
- [ ] 能解释事件委托、target/currentTarget。
- [ ] 能说出常见内存泄漏。
- [ ] 能区分 CJS/ESM。
- [ ] 能解释 NaN、0.1+0.2、类型转换。
