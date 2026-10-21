# 03 · JavaScript 核心与底层原理

> 目标：掌握 JS 的语法、运行机制、异步模型；能手写常见工具函数；能解释闭包、this、原型、事件循环。
>
> 标记：⭐⭐⭐ 必须会｜⭐⭐ 要理解｜⭐ 了解即可

---

## 1. JavaScript 是什么

- 一门**解释型**（现在也有 JIT 编译）、**动态类型**、**单线程**的脚本语言。
- 最初只跑在浏览器里，现在也能跑在 Node.js、小程序 JSCore、RN 的 Hermes 里。
- 单线程指的是**主线程只有一个调用栈**，但浏览器/Node 底层有多线程（定时器、网络、IO）。

```js
// 一行最简单的 JS
console.log('Hello');
```

### 1.1 在 HTML 里引入

```html
<!-- 内联 -->
<script>
  console.log('inline');
</script>

<!-- 外部 -->
<script src="./main.js"></script>

<!-- 并行下载，解析完执行 -->
<script src="./main.js" defer></script>
```

### 1.2 严格模式

```js
'use strict';

// 严格模式下的变化：
// 1. 未声明变量赋值会报错
// 2. 函数普通调用时 this 是 undefined，不是 window
// 3. 不能删除变量/函数
// 4. 参数不能重名
// 5. arguments 不会随参数变化
```

ES Module 默认就是严格模式。

---

## 2. 变量、作用域、提升 ⭐⭐⭐

### 2.1 var / let / const

| 特性 | `var` | `let` | `const` |
|---|---|---|---|
| 作用域 | 函数/全局 | 块级 `{}` | 块级 `{}` |
| 提升 | 是，初始值 undefined | 是，但有 TDZ | 是，但有 TDZ |
| 重复声明 | 可以 | 报错 | 报错 |
| 重新赋值 | 可以 | 可以 | 不可以（对象内容可变） |
| 挂到 window | 是（全局） | 否 | 否 |

```js
{
  var a = 1;
  let b = 2;
  const c = 3;
}
console.log(a); // 1：var 泄漏到块外
// console.log(b); // ReferenceError
// console.log(c); // ReferenceError
```

`const` 保证的是**绑定不变**，不是值不变：

```js
const user = { name: 'Tom' };
user.name = 'Jerry'; // 可以，改的是对象内容
// user = {};        // TypeError，不能重新赋值
```

### 2.2 提升（Hoisting）

```js
console.log(a); // undefined：声明被提升，赋值没提升
var a = 1;

console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 2;
```

`let/const` 的 TDZ（暂时性死区）：从块开始到声明语句之间，变量存在但**不能访问**。

```js
let x = 1;
{
  // 这个块里声明了 x，所以外面的 x 被遮蔽
  // console.log(x); // ReferenceError
  let x = 2;
}
```

函数声明也会提升：

```js
sayHi(); // 可以执行
function sayHi() {
  console.log('hi');
}

// 函数表达式不会
// sayBye(); // TypeError: sayBye is not a function
var sayBye = function () {
  console.log('bye');
};
```

### 2.3 作用域链

```js
const global = 'global';

function outer() {
  const outerVar = 'outer';

  function inner() {
    const innerVar = 'inner';
    // 查找顺序：inner → outer → global → 找不到就 ReferenceError
    console.log(global, outerVar, innerVar);
  }

  inner();
}

outer();
```

**词法作用域**：函数在哪里定义，就决定了它能访问哪些变量，和在哪里调用无关。

---

## 3. 数据类型 ⭐⭐⭐

### 3.1 八种类型

**原始类型（7 种）：**

```js
typeof 'abc'      // 'string'
typeof 123        // 'number'
typeof true       // 'boolean'
typeof undefined  // 'undefined'
typeof null       // 'object'（历史遗留 bug，null 不是对象）
typeof Symbol()   // 'symbol'
typeof 123n       // 'bigint'
```

**引用类型：**

```js
typeof {}                 // 'object'
typeof []                 // 'object'
typeof function () {}     // 'function'
typeof new Date()         // 'object'
typeof /abc/              // 'object'
```

### 3.2 判断类型的几种方式

```js
// 1. typeof：适合原始类型，null 和数组不可靠
typeof [] // 'object'

// 2. Array.isArray：判断数组
Array.isArray([]) // true

// 3. instanceof：判断原型链，不能跨 iframe
[] instanceof Array // true

// 4. Object.prototype.toString：最通用
Object.prototype.toString.call([])        // '[object Array]'
Object.prototype.toString.call(null)      // '[object Null]'
Object.prototype.toString.call(undefined) // '[object Undefined]'
Object.prototype.toString.call(new Date())// '[object Date]'

// 5. Number.isNaN / Number.isFinite
Number.isNaN(NaN)        // true
Number.isNaN('abc')      // false（不会隐式转换）
isNaN('abc')             // true（会先转数字）
```

### 3.3 原始值与引用值

```js
// 原始值：按值传递
let a = 1;
let b = a;
b = 2;
console.log(a); // 1

// 引用值：传递的是地址
const obj1 = { count: 1 };
const obj2 = obj1;
obj2.count = 2;
console.log(obj1.count); // 2，两个变量指向同一个对象
```

```js
function change(x) {
  x = 100;
}
let n = 1;
change(n);
console.log(n); // 1，函数内重新赋值不影响外面

function changeObj(o) {
  o.name = 'new'; // 修改对象内容，外面能看到
}
const user = { name: 'old' };
changeObj(user);
console.log(user.name); // 'new'
```

### 3.4 栈和堆

- 原始值通常存在**栈**里，大小固定，访问快。
- 对象存在**堆**里，变量保存的是地址。
- 栈内存由系统自动回收；堆内存由垃圾回收器管理。

---

## 4. 类型转换与比较 ⭐⭐⭐

### 4.1 显式转换

```js
Number('123')       // 123
Number('')          // 0
Number('  ')        // 0
Number('12px')      // NaN
Number(true)        // 1
Number(null)        // 0
Number(undefined)   // NaN

parseInt('12px')    // 12（从左往右解析到非数字）
parseInt('px12')    // NaN
parseFloat('1.5rem')// 1.5

String(123)         // '123'
Boolean(0)          // false
Boolean('0')        // true
Boolean([])         // true
Boolean({})         // true
```

### 4.2 隐式转换

```js
1 + '2'        // '12'：只要有一边是字符串，就拼接
'3' - 1        // 2：减号会转数字
true + 1       // 2
null + 1       // 1
undefined + 1  // NaN
[] + {}        // '[object Object]'
[] + []        // ''
[1, 2] + ''    // '1,2'
0.1 + 0.2      // 0.30000000000000004（浮点数精度）
```

### 4.3 假值（falsy）

只有 8 个：

```js
false
0
-0
0n
''
null
undefined
NaN
```

其他都是真值，包括 `[]`、`{}`、`'0'`、`'false'`、`function(){}`。

### 4.4 `==` vs `===`

- `===`：类型不同直接 false，不做转换。
- `==`：会做类型转换，规则复杂，容易踩坑。

```js
1 === '1'   // false
1 == '1'    // true
null == undefined  // true
null == 0          // false
null == false      // false
undefined == 0     // false
'' == 0            // true
'0' == false       // true
[] == false        // true
[1] == 1           // true
[1, 2] == '1,2'    // true
NaN == NaN         // false
```

**结论：业务代码统一用 `===`；只有判断 `null/undefined` 时可以写 `x == null`（同时匹配两者）。**

### 4.5 `NaN` 和 `Object.is`

```js
NaN === NaN          // false
Number.isNaN(NaN)    // true
Object.is(NaN, NaN)  // true
Object.is(0, -0)     // false
Object.is(1, 1)      // true
```

### 4.6 浮点数精度

```js
0.1 + 0.2 === 0.3 // false

// 解决：转成整数再算，或保留小数
(0.1 * 10 + 0.2 * 10) / 10 // 0.3
Number((0.1 + 0.2).toFixed(2)) // 0.3
```

金额计算建议用整数（分）或 `decimal.js`。

---

## 5. 运算符

```js
// 算术
+ - * / % **

// 比较
> < >= <= == === != !==

// 逻辑
&& || !

// 空值合并：只有 null/undefined 才走右边
const name = input ?? '默认';

// 可选链：左边是 null/undefined 就返回 undefined，不报错
const city = user?.address?.city;

// 逻辑赋值
a ||= 1; // a 为假值时赋值
a &&= 2; // a 为真值时赋值
a ??= 3; // a 为 null/undefined 时赋值

// 三元
const label = isVip ? '会员' : '普通';

// 展开
const arr2 = [...arr1];
const obj2 = { ...obj1 };

// 逗号：返回最后一个
const x = (1, 2, 3); // 3
```

**可选链的坑：**

```js
const obj = { a: null };
obj?.a.b;   // TypeError，因为 obj?.a 是 null，再 .b 就报错
obj?.a?.b;  // undefined，正确写法
```

---

## 6. 流程控制

```js
if (score >= 90) {
  console.log('A');
} else if (score >= 60) {
  console.log('B');
} else {
  console.log('C');
}

switch (type) {
  case 'a':
    console.log('a');
    break; // 不写会继续执行下一个 case（穿透）
  case 'b':
  case 'c':
    console.log('b 或 c');
    break;
  default:
    console.log('unknown');
}

for (let i = 0; i < 3; i++) {
  if (i === 1) continue; // 跳过本次
  if (i === 2) break;    // 结束循环
  console.log(i);
}

for (const item of list) {  // 遍历值（数组、字符串、Map、Set）
  console.log(item);
}

for (const key in obj) {    // 遍历键（包括原型链上的可枚举属性）
  if (Object.hasOwn(obj, key)) {
    console.log(key);
  }
}

list.forEach((item) => console.log(item)); // 不能 break
```

---

## 7. 函数 ⭐⭐⭐

### 7.1 声明方式

```js
// 函数声明：会提升
function add(a, b) {
  return a + b;
}

// 函数表达式：不会提升
const add2 = function (a, b) {
  return a + b;
};

// 箭头函数
const add3 = (a, b) => a + b;

// 方法简写
const obj = {
  add(a, b) {
    return a + b;
  },
};
```

### 7.2 参数

```js
// 默认参数：只有 undefined 才用默认值，null 不会
function greet(name = '访客') {
  return `你好，${name}`;
}
greet();          // '你好，访客'
greet(undefined); // '你好，访客'
greet(null);      // '你好，null'

// 剩余参数：收集成真数组
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3); // 6

// 解构参数
function createUser({ name, age = 18 }) {
  return { name, age };
}
createUser({ name: 'Tom' }); // { name: 'Tom', age: 18 }
```

### 7.3 `arguments` vs 剩余参数

```js
function normal() {
  console.log(arguments); // 类数组，有 length，没有数组方法
}
const arrow = () => {
  // arguments 来自外层函数，箭头函数自己没有
};
function modern(...args) {
  console.log(args); // 真数组
}
```

### 7.4 纯函数、副作用、高阶函数

- **纯函数**：相同输入永远得到相同输出，不修改外部状态。
- **副作用**：修改外部变量、发请求、操作 DOM、写文件。
- **高阶函数**：接收函数作为参数，或返回函数。

```js
// 纯函数
function add(a, b) {
  return a + b;
}

// 非纯函数：依赖并修改外部状态
let count = 0;
function increment() {
  count++;
}

// 高阶函数
function withLog(fn) {
  return function (...args) {
    console.log('调用参数', args);
    return fn(...args);
  };
}
```

### 7.5 回调

```js
function fetchData(callback) {
  setTimeout(() => {
    callback('数据');
  }, 1000);
}

fetchData((data) => {
  console.log(data);
});
```

回调多了会形成“回调地狱”，后面用 Promise / async-await 解决。

---

## 8. 闭包 ⭐⭐⭐

### 8.1 定义

**闭包 = 函数 + 函数定义时所在的词法环境。**

函数内部可以访问外部函数的变量，即使外部函数已经执行完毕，这些变量也不会被销毁。

```js
function createCounter() {
  let count = 0; // 被闭包引用，不会随函数结束而销毁

  return function () {
    count += 1;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

const counter2 = createCounter(); // 新的独立闭包
console.log(counter2()); // 1
```

### 8.2 闭包用在哪

1. **私有变量**：上面的 `count` 外部无法直接修改。
2. **函数工厂**：生成不同配置的函数。
3. **防抖/节流**：保存定时器 id。
4. **缓存/记忆化**。
5. **模块模式**：ESM 之前模拟私有成员。

```js
// 记忆化斐波那契
function memoize(fn) {
  const cache = new Map(); // 闭包保存缓存
  return function (n) {
    if (cache.has(n)) return cache.get(n);
    const result = fn(n);
    cache.set(n, result);
    return result;
  };
}

const fib = memoize(function (n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
});
```

### 8.3 经典循环陷阱

```js
// var：全局只有一个 i，循环结束后 i = 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 3 3 3
}

// let：每次循环创建新的块级绑定
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0); // 0 1 2
}

// 用 IIFE 保存每次的值（ES5 解法）
for (var k = 0; k < 3; k++) {
  (function (value) {
    setTimeout(() => console.log(value), 0);
  })(k);
}
```

### 8.4 闭包的内存问题

闭包会阻止变量被回收。如果闭包长期存在（挂在全局、定时器、事件监听），大对象就回收不了。

```js
function attach() {
  const hugeData = new Array(1e6).fill('x');

  window.addEventListener('click', () => {
    // 只要监听器不移除，hugeData 就一直被引用
    console.log(hugeData.length);
  });
}
```

解决：不需要时移除监听器，或把不需要的数据置空。

### 8.5 面试答法

> 闭包是函数和它词法环境的组合。内部函数引用了外部函数的变量，外部函数执行完后，这些变量仍然被保留，就形成了闭包。它能实现私有变量、函数工厂、防抖节流、缓存等。代价是变量不会被回收，滥用可能导致内存泄漏。

---

## 9. `this` ⭐⭐⭐

### 9.1 五条绑定规则

**1. 默认绑定**：普通函数调用。

```js
function fn() {
  console.log(this);
}
fn(); // 严格模式/模块：undefined；非严格浏览器：window
```

**2. 隐式绑定**：作为对象方法调用。

```js
const obj = {
  name: 'Tom',
  say() {
    console.log(this.name);
  },
};
obj.say(); // Tom

const fn = obj.say;
fn(); // undefined（丢失了 obj 这个调用上下文）
```

**3. 显式绑定**：`call` / `apply` / `bind`。

```js
function say() {
  console.log(this.name);
}
say.call({ name: 'A' });  // A
say.apply({ name: 'B' }); // B
const bound = say.bind({ name: 'C' });
bound(); // C
```

**4. new 绑定**：`new` 调用时，this 指向新创建的对象。

```js
function Person(name) {
  this.name = name;
}
const p = new Person('Tom');
console.log(p.name); // Tom
```

**5. 箭头函数**：没有自己的 this，取定义时外层作用域的 this。

```js
const obj = {
  name: 'Tom',
  regular() {
    console.log(this.name);
  },
  arrow: () => {
    console.log(this.name);
  },
};

obj.regular(); // Tom
obj.arrow();   // undefined（外层是模块/全局，没有 name）
```

### 9.2 优先级

```text
new > bind > call/apply > 隐式绑定 > 默认绑定
```

注意：`new` 一个 bind 过的函数，this 会指向新对象，bind 失效。

```js
function Foo() {
  this.name = 'foo';
}
const BoundFoo = Foo.bind({ name: 'bound' });
const instance = new BoundFoo();
console.log(instance.name); // 'foo'，new 优先
```

### 9.3 常见场景

```js
const timer = {
  seconds: 0,
  start() {
    // 普通函数：this 是 window/undefined
    // setInterval(function () {
    //   this.seconds++;
    // }, 1000);

    // 箭头函数：this 继承 start 的 this，即 timer
    setInterval(() => {
      this.seconds++;
    }, 1000);
  },
};
```

```js
// React 类组件里的经典写法
class App extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    // 箭头函数，this 永远是组件实例
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return <button onClick={this.handleClick}>+1</button>;
  }
}
```

### 9.4 `call` / `apply` / `bind` 区别

| 方法 | 是否立即执行 | 参数 |
|---|---|---|
| `call(thisArg, a, b)` | 是 | 逐个传 |
| `apply(thisArg, [a, b])` | 是 | 数组 |
| `bind(thisArg, a)` | 否，返回新函数 | 可预设参数 |

---

## 10. 原型与继承 ⭐⭐⭐

### 10.1 三个关键概念

- `prototype`：**函数**才有的属性，指向原型对象。
- `__proto__`：**对象**都有的属性（标准写法 `Object.getPrototypeOf`），指向它的原型。
- `constructor`：原型对象上的属性，指回构造函数。

```js
function Person(name) {
  this.name = name;
}

Person.prototype.say = function () {
  console.log(this.name);
};

const p = new Person('Tom');

console.log(p.__proto__ === Person.prototype);        // true
console.log(Person.prototype.constructor === Person); // true
console.log(p.constructor === Person);                // true（沿原型链找到）
```

### 10.2 原型链

```text
p
└── __proto__ → Person.prototype
                 ├── say()
                 └── __proto__ → Object.prototype
                                  ├── toString()
                                  └── __proto__ → null
```

访问 `p.toString()` 时，先找 `p` 自己，没有；再找 `Person.prototype`，没有；再找 `Object.prototype`，找到并调用。

```js
console.log(Object.prototype.__proto__); // null，原型链终点
```

### 10.3 `new` 做了什么

```js
function myNew(Ctor, ...args) {
  // 1. 创建一个空对象，原型指向构造函数的 prototype
  const obj = Object.create(Ctor.prototype);
  // 2. 把 this 指向这个对象，执行构造函数
  const result = Ctor.apply(obj, args);
  // 3. 如果构造函数返回对象，就返回它；否则返回新对象
  return result !== null && (typeof result === 'object' || typeof result === 'function')
    ? result
    : obj;
}
```

### 10.4 继承的几种方式

```js
// 1. 原型链继承：子类原型指向父类实例
function Animal() {}
Animal.prototype.eat = function () { console.log('eat'); };

function Dog() {}
Dog.prototype = new Animal(); // 缺点：所有实例共享引用属性，无法传参

// 2. 构造函数继承：在子类里调用父类
function Cat(name) {
  Animal.call(this); // 只能继承实例属性，不能继承原型方法
  this.name = name;
}

// 3. 组合继承
function Bird(name) {
  Animal.call(this);
  this.name = name;
}
Bird.prototype = Object.create(Animal.prototype);
Bird.prototype.constructor = Bird;

// 4. 寄生组合继承（最常用）
function inherit(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
}

// 5. ES6 class
class Animal2 {
  constructor(name) {
    this.name = name;
  }
  eat() {
    console.log(`${this.name} eat`);
  }
}

class Dog2 extends Animal2 {
  constructor(name, breed) {
    super(name); // 必须先调用 super，才能用 this
    this.breed = breed;
  }
  eat() {
    super.eat();
    console.log('dog eat');
  }
}
```

### 10.5 `instanceof` 原理

```js
function myInstanceof(obj, Ctor) {
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false;
  }
  let proto = Object.getPrototypeOf(obj);
  while (proto) {
    if (proto === Ctor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```

### 10.6 面试答法

> 每个函数都有 prototype 属性，每个对象都有 __proto__ 指向它的原型。访问属性时，先找自身，找不到就沿 __proto__ 向上找，直到 null，这就是原型链。new 会创建对象、把原型指向构造函数的 prototype、执行构造函数、返回对象。ES6 class 本质上是原型继承的语法糖，但更严格。

---

## 11. 对象 ⭐⭐

### 11.1 创建与访问

```js
const obj = { name: 'Tom' };

// 点访问
obj.name;
// 方括号访问：属性名是变量时
const key = 'name';
obj[key];

// 属性简写
const name = 'Tom';
const user = { name };

// 计算属性
const field = 'age';
const user2 = { [field]: 18 };

// 方法简写
const user3 = {
  say() {
    console.log('hi');
  },
};
```

### 11.2 属性描述符

```js
const obj = {};

Object.defineProperty(obj, 'age', {
  value: 18,
  writable: false,    // 不能修改
  enumerable: true,   // 可以被 for...in / Object.keys 遍历
  configurable: false,// 不能删除/重新定义
});

obj.age = 20;
console.log(obj.age); // 18
```

### 11.3 常用方法

```js
const obj = { a: 1, b: 2 };

Object.keys(obj);     // ['a', 'b']
Object.values(obj);   // [1, 2]
Object.entries(obj);  // [['a', 1], ['b', 2]]
Object.fromEntries([['a', 1], ['b', 2]]); // { a: 1, b: 2 }
Object.assign({}, obj, { c: 3 }); // 浅拷贝 + 合并
Object.hasOwn(obj, 'a'); // true
Object.freeze(obj);   // 冻结，不能增删改
Object.create(null);  // 创建没有原型的对象（适合做字典）
```

### 11.4 浅拷贝 vs 深拷贝

```js
// 浅拷贝：只复制第一层，嵌套对象仍是同一个引用
const shallow = { ...obj };
const shallow2 = Object.assign({}, obj);

// JSON 深拷贝：有局限
const deep = JSON.parse(JSON.stringify(obj));
// 缺点：丢失 undefined、函数、Symbol；Date 变字符串；循环引用报错；Map/Set 变空对象

// 浏览器/Node 现代 API：structuredClone
const deep2 = structuredClone(obj);
// 支持 Date、Map、Set、循环引用；不支持函数、DOM 节点
```

---

## 12. 数组 ⭐⭐⭐

### 12.1 常用方法速查

| 方法 | 作用 | 是否改变原数组 |
|---|---|---|
| `push` / `pop` | 尾部增/删 | 是 |
| `unshift` / `shift` | 头部增/删 | 是 |
| `splice(start, n, ...items)` | 删除/插入/替换 | 是 |
| `sort` | 排序 | 是 |
| `reverse` | 反转 | 是 |
| `slice(start, end)` | 截取 | 否 |
| `concat` | 拼接 | 否 |
| `join` | 转字符串 | 否 |
| `indexOf` / `lastIndexOf` | 查索引 | 否 |
| `includes` | 是否包含 | 否 |
| `find` / `findIndex` | 找第一个满足条件的 | 否 |
| `filter` | 过滤 | 否 |
| `map` | 映射 | 否 |
| `reduce` | 归约 | 否 |
| `some` / `every` | 存在/全部满足 | 否 |
| `forEach` | 遍历 | 否 |
| `flat(depth)` | 扁平化 | 否 |
| `flatMap` | map + flat | 否 |
| `at(index)` | 支持负数索引 | 否 |

### 12.2 易错点

```js
// sort 默认按字符串排序
[10, 2, 1].sort(); // [1, 10, 2]
[10, 2, 1].sort((a, b) => a - b); // [1, 2, 10]

// splice 会修改原数组
const arr = [1, 2, 3, 4];
arr.splice(1, 2); // 返回 [2, 3]，arr 变成 [1, 4]

// slice 不会
const arr2 = [1, 2, 3, 4];
arr2.slice(1, 3); // [2, 3]，arr2 不变

// map 不会跳过空位，forEach 会跳过空位（稀疏数组）
// reduce 不给初始值时，空数组会报错
[].reduce((a, b) => a + b); // TypeError
[].reduce((a, b) => a + b, 0); // 0
```

### 12.3 `map` / `filter` / `reduce`

```js
const nums = [1, 2, 3, 4];

// map：一对一转换，返回新数组
const doubled = nums.map((n) => n * 2); // [2, 4, 6, 8]

// filter：保留满足条件的
const even = nums.filter((n) => n % 2 === 0); // [2, 4]

// reduce：把数组归约成一个值
const sum = nums.reduce((acc, n) => acc + n, 0); // 10

// reduce 实现 groupBy
const list = [
  { type: 'fruit', name: 'apple' },
  { type: 'veg', name: 'carrot' },
  { type: 'fruit', name: 'banana' },
];
const grouped = list.reduce((acc, item) => {
  (acc[item.type] ||= []).push(item.name);
  return acc;
}, {});
// { fruit: ['apple', 'banana'], veg: ['carrot'] }
```

### 12.4 `forEach` 和 `map` 的区别

- `map` 返回新数组，`forEach` 返回 undefined。
- `forEach` 不能 `break`，`map` 也不能，但可以用 `some/every` 提前终止。
- 只是遍历用 `forEach`，需要结果用 `map`。

---

## 13. 字符串、数字、日期、JSON

```js
const str = 'Hello World';

str.length;                 // 11
str.toUpperCase();          // 'HELLO WORLD'
str.toLowerCase();          // 'hello world'
str.trim();                 // 去首尾空格
str.includes('World');      // true
str.startsWith('Hello');    // true
str.endsWith('World');      // true
str.indexOf('o');           // 4
str.slice(0, 5);            // 'Hello'
str.substring(0, 5);        // 'Hello'
str.split(' ');             // ['Hello', 'World']
str.replace('World', 'JS'); // 'Hello JS'
str.replaceAll('l', 'L');   // 'HeLLo WorLd'
str.padStart(15, '*');      // '****Hello World'
str.at(-1);                 // 'd'
```

```js
// 数字
(123.456).toFixed(2); // '123.46'（返回字符串）
Number.parseInt('12px', 10); // 12
Number.parseFloat('1.5rem'); // 1.5
Number.isInteger(1); // true
Number.MAX_SAFE_INTEGER; // 9007199254740991

// 日期
const now = new Date();
now.getFullYear();
now.getMonth(); // 0-11，1 月是 0
now.getDate();
now.getDay(); // 0 是周日
now.toISOString();

// 时间戳
Date.now();
new Date('2026-10-22T10:00:00+08:00').getTime();

// JSON
JSON.stringify({ a: 1 }); // '{"a":1}'
JSON.parse('{"a":1}');    // { a: 1 }
```

---

## 14. DOM ⭐⭐⭐

### 14.1 查询

```js
document.getElementById('app');
document.querySelector('.card');      // 第一个匹配
document.querySelectorAll('.card');   // NodeList，静态
document.getElementsByClassName('card'); // HTMLCollection，动态
```

### 14.2 创建、插入、删除

```js
const div = document.createElement('div');
div.className = 'card';
div.textContent = '内容'; // 只当文本，防 XSS
// div.innerHTML = '<b>内容</b>'; // 会解析 HTML，危险

document.body.appendChild(div);
document.body.insertBefore(div, null);
div.remove();

// 批量插入用 DocumentFragment，减少重排
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li');
  li.textContent = `item ${i}`;
  fragment.appendChild(li);
}
document.querySelector('ul').appendChild(fragment);
```

### 14.3 样式与类名

```js
el.style.color = 'red';
el.style.cssText = 'color: red; font-size: 14px;';
el.classList.add('active');
el.classList.remove('active');
el.classList.toggle('active');
el.classList.contains('active');
el.dataset.id; // data-id
```

### 14.4 读写内容与属性

```js
el.textContent = '纯文本';
el.innerHTML = '<span>HTML</span>';
el.getAttribute('href');
el.setAttribute('href', '/home');
el.removeAttribute('disabled');
el.value; // 表单值
el.checked; // 复选框
```

### 14.5 位置与尺寸

```js
const rect = el.getBoundingClientRect();
rect.top; rect.left; rect.width; rect.height;

el.offsetWidth;  // 含 border
el.clientWidth;  // 含 padding，不含 border
el.scrollHeight; // 内容总高度
el.scrollTop;    // 滚动距离
```

### 14.6 XSS 安全

```js
// 危险：用户输入直接拼进 innerHTML
container.innerHTML = `<p>${userInput}</p>`;
// 用户输入 <img src=x onerror="alert(1)"> 就会执行

// 安全：用 textContent
container.textContent = userInput;

// 必须渲染 HTML 时，用 DOMPurify 清洗
const clean = DOMPurify.sanitize(userInput);
container.innerHTML = clean;
```

---

## 15. 事件 ⭐⭐⭐

### 15.1 事件流

```text
捕获阶段（window → document → ... → 目标父级）
    ↓
目标阶段（target）
    ↓
冒泡阶段（target 父级 → ... → document → window）
```

```js
el.addEventListener('click', handler); // 默认冒泡阶段
el.addEventListener('click', handler, true); // 捕获阶段
el.addEventListener('click', handler, { capture: true, once: true, passive: true });
```

- `once`：只执行一次。
- `passive: true`：告诉浏览器不会 `preventDefault`，滚动更流畅（touchmove/wheel 建议加）。

### 15.2 `target` vs `currentTarget`

```js
list.addEventListener('click', (e) => {
  console.log(e.target);        // 实际点击的最深元素
  console.log(e.currentTarget); // 绑定监听器的元素（list）
});
```

### 15.3 阻止默认与阻止冒泡

```js
// 阻止默认行为：链接跳转、表单提交
e.preventDefault();

// 阻止冒泡：不再往上触发
e.stopPropagation();

// 阻止同一元素上的其他监听器
e.stopImmediatePropagation();
```

### 15.4 事件委托 ⭐⭐⭐

把监听器绑在父元素上，利用冒泡处理子元素事件。适合列表、动态生成的元素。

```html
<ul id="list">
  <li data-id="1">A</li>
  <li data-id="2">B</li>
</ul>
```

```js
document.getElementById('list').addEventListener('click', (e) => {
  const item = e.target.closest('li'); // 从点击位置向上找 li
  if (!item) return;
  console.log('点击了', item.dataset.id);
});
```

优点：

- 只绑一个监听器，内存占用小。
- 动态新增的子元素自动生效。
- 不需要逐个解绑。

### 15.5 自定义事件

```js
const event = new CustomEvent('cart:add', {
  detail: { id: 1, count: 2 },
});
window.dispatchEvent(event);

window.addEventListener('cart:add', (e) => {
  console.log(e.detail);
});
```

---

## 16. BOM 与存储

```js
// location
location.href;        // 完整 URL
location.pathname;    // 路径
location.search;      // ?a=1
location.hash;        // #top
location.reload();
location.assign('/home');
location.replace('/home'); // 不产生历史记录

// history
history.pushState({ page: 1 }, '', '/page1');
history.replaceState({}, '', '/page2');
history.back();
history.forward();

// navigator
navigator.userAgent;
navigator.onLine;
navigator.language;

// 定时器
const id = setTimeout(() => {}, 1000);
clearTimeout(id);
const intervalId = setInterval(() => {}, 1000);
clearInterval(intervalId);

// 动画帧
function loop() {
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

### 16.1 存储对比 ⭐⭐

| 方式 | 容量 | 生命周期 | 是否随请求发送 | 同步/异步 |
|---|---|---|---|---|
| Cookie | 约 4KB | 可设置过期时间 | 是 | 同步 |
| localStorage | 5-10MB | 永久，除非手动删除 | 否 | 同步 |
| sessionStorage | 5-10MB | 当前标签页关闭 | 否 | 同步 |
| IndexedDB | 很大 | 永久 | 否 | 异步 |

```js
localStorage.setItem('token', 'abc');
localStorage.getItem('token');
localStorage.removeItem('token');
localStorage.clear();

// 存对象要序列化
localStorage.setItem('user', JSON.stringify({ name: 'Tom' }));
const user = JSON.parse(localStorage.getItem('user') || '{}');
```

> token 不建议放 localStorage（XSS 可读），更安全的方案是 HttpOnly Cookie + CSRF 防护。

---

## 17. 异步 ⭐⭐⭐

### 17.1 回调

```js
function request(url, success, fail) {
  setTimeout(() => {
    if (Math.random() > 0.2) success({ code: 0 });
    else fail(new Error('网络错误'));
  }, 500);
}

request(
  '/api/user',
  (res) => console.log('成功', res),
  (err) => console.error('失败', err)
);
```

问题：嵌套多了难维护、错误处理分散、无法优雅地并行/串行。

### 17.2 Promise

```js
const promise = new Promise((resolve, reject) => {
  // executor 是同步执行的
  setTimeout(() => {
    const ok = true;
    if (ok) resolve('成功');
    else reject(new Error('失败'));
  }, 1000);
});

promise
  .then((value) => {
    console.log(value);
    return '下一步'; // 返回值会传给下一个 then
  })
  .then((value) => console.log(value))
  .catch((err) => console.error(err))
  .finally(() => console.log('结束'));
```

三种状态：

```text
pending（进行中）
  ├── resolve → fulfilled（成功）
  └── reject  → rejected（失败）

状态一旦改变，就不能再变。
```

关键点：

- `.then` 返回一个**新的 Promise**，所以可以链式调用。
- `.then` 里返回 Promise，会等待它完成。
- `.catch` 捕获前面任意一步的错误。
- `.finally` 不管成功失败都执行。
- 没有 `.catch` 的 rejection 会变成 `unhandledrejection`。

### 17.3 Promise 组合器

```js
// 全部成功才成功，有一个失败就失败
Promise.all([p1, p2, p3])
  .then(([r1, r2, r3]) => {})
  .catch((err) => {});

// 等待全部结束（成功/失败都算），返回结果数组
Promise.allSettled([p1, p2]).then((results) => {
  results.forEach((r) => {
    if (r.status === 'fulfilled') console.log(r.value);
    else console.log(r.reason);
  });
});

// 第一个成功/失败就返回
Promise.race([p1, p2]).then((value) => {});

// 第一个成功就返回；全部失败才失败
Promise.any([p1, p2])
  .then((value) => {})
  .catch((err) => console.log(err.errors));
```

### 17.4 async / await

```js
async function getUser() {
  try {
    const res = await fetch('/api/user'); // await 等待 Promise
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('请求失败', err);
    throw err; // 继续往外抛，调用方可以 catch
  }
}

// async 函数永远返回 Promise
getUser().then((data) => console.log(data));
```

### 17.5 串行 vs 并行

```js
// 串行：一个等一个，总耗时 = 各请求之和
async function serial() {
  const a = await requestA();
  const b = await requestB(a.id);
  return b;
}

// 并行：同时发起，总耗时 = 最慢的那个
async function parallel() {
  const [a, b] = await Promise.all([requestA(), requestB()]);
  return [a, b];
}

// 错误：forEach 里的 async 不会被 await
async function wrong() {
  [1, 2, 3].forEach(async (id) => {
    await request(id); // 外层不会等
  });
  console.log('done'); // 可能先打印
}

// 正确：for...of 串行
async function right() {
  for (const id of [1, 2, 3]) {
    await request(id);
  }
  console.log('done');
}
```

### 17.6 并发控制

```js
// 限制同时最多 3 个请求
async function limitPool(tasks, limit = 3) {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}
```

---

## 18. 事件循环 ⭐⭐⭐

### 18.1 浏览器的事件循环

组成部分：

- **调用栈（Call Stack）**：执行同步代码。
- **Web APIs**：定时器、网络请求、DOM 事件，由浏览器其他线程处理。
- **任务队列（宏任务，macrotask）**：`setTimeout`、`setInterval`、`MessageChannel`、I/O、UI 事件。
- **微任务队列（microtask）**：`Promise.then`、`queueMicrotask`、`MutationObserver`。

执行顺序：

```text
1. 执行调用栈里的同步代码
2. 调用栈清空后，清空所有微任务（包括微任务里新产生的微任务）
3. 需要时执行渲染（layout/paint）
4. 取一个宏任务执行
5. 重复 2-4
```

**重点：每个宏任务执行完，都会清空一次微任务队列；微任务优先级高于下一个宏任务。**

### 18.2 经典输出题

```js
console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

Promise.resolve().then(() => {
  console.log('3');
});

console.log('4');

// 输出：1 4 3 2
```

原因：同步代码先执行（1、4），然后清空微任务（3），再执行宏任务（2）。

### 18.3 async/await 输出题

```js
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

console.log('script end');

// 输出：
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```

解释：

1. 同步执行：`script start`。
2. `async1()` 调用，打印 `async1 start`。
3. `await async2()`：先执行 `async2`，打印 `async2`；await 把后面的代码挂起，放入微任务。
4. `new Promise` 的 executor 同步执行，打印 `promise1`；`.then` 放入微任务。
5. 打印 `script end`。
6. 清空微任务：`async1 end`、`promise2`（顺序取决于入队顺序）。
7. 宏任务：`setTimeout`。

### 18.4 Node.js 的事件循环

六个阶段（简化）：

```text
timers          → setTimeout/setInterval 到期回调
pending callbacks → 某些系统回调
idle/prepare    → 内部准备
poll            → 获取 I/O 事件，执行 I/O 回调
check           → setImmediate
close callbacks → close 事件
```

每个阶段之间会清空 `process.nextTick` 队列和 Promise 微任务。

```js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// 在顶层：顺序不确定，取决于启动耗时
// 在 I/O 回调里：setImmediate 通常先于 setTimeout
```

```js
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));

// 输出：nextTick promise
// process.nextTick 优先级高于 Promise 微任务
```

### 18.5 面试答法

> JS 是单线程的，同步代码在调用栈执行。异步任务完成后，回调会被放到任务队列。事件循环不断从队列取任务执行。任务分宏任务和微任务，每执行完一个宏任务，会把微任务队列全部清空，再进行渲染，然后取下一个宏任务。Promise.then 是微任务，setTimeout 是宏任务，所以微任务总是先执行。

---

## 19. 模块化 ⭐⭐

### 19.1 CommonJS（Node 传统）

```js
// math.js
const add = (a, b) => a + b;
module.exports = { add };

// main.js
const { add } = require('./math');
console.log(add(1, 2));
```

特点：运行时加载、同步、值拷贝、`this` 指向 `module.exports`。

### 19.2 ES Module

```js
// math.js
export const add = (a, b) => a + b;
export default function multiply(a, b) {
  return a * b;
}

// main.js
import multiply, { add } from './math.js';
```

特点：静态分析、编译时确定依赖、异步加载、**live binding**（导出变量变化，导入方能看到）、`this` 是 undefined。

### 19.3 区别

| 维度 | CommonJS | ESM |
|---|---|---|
| 语法 | require / module.exports | import / export |
| 加载时机 | 运行时 | 编译时（静态） |
| 加载方式 | 同步 | 异步 |
| 导出值 | 拷贝 | 实时绑定 |
| Tree Shaking | 不支持 | 支持 |
| 顶层 await | 不支持 | 支持 |
| 循环依赖 | 返回未完成的对象 | 暂时性死区，可能报错 |

### 19.4 动态导入

```js
// 按需加载，返回 Promise
button.addEventListener('click', async () => {
  const { default: Chart } = await import('./chart.js');
  new Chart();
});
```

React 里的 `React.lazy`、路由懒加载都基于动态 import。

---

## 20. 错误处理 ⭐⭐

```js
try {
  JSON.parse('{bad json}');
} catch (err) {
  console.error(err.name);    // SyntaxError
  console.error(err.message); // 具体信息
  console.error(err.stack);   // 调用栈
} finally {
  console.log('不管成功失败都执行');
}
```

错误类型：

- `SyntaxError`：语法错误，通常在解析阶段。
- `ReferenceError`：变量不存在。
- `TypeError`：类型不对，例如 `undefined.foo`。
- `RangeError`：超出范围，例如递归栈溢出。
- `URIError`：URL 编解码错误。
- 自定义错误：`class HttpError extends Error`。

```js
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
```

异步错误：

```js
// Promise 的错误用 catch
fetch('/api').then((res) => res.json()).catch(handleError);

// async 函数用 try/catch
async function load() {
  try {
    await fetch('/api');
  } catch (err) {
    handleError(err);
  }
}

// 全局兜底
window.addEventListener('error', (event) => {
  console.error('JS 错误', event.error);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise', event.reason);
});
```

> `try/catch` 只能捕获同步错误和 `await` 的错误，不能捕获回调里异步抛出的错误。

---

## 21. 内存管理与垃圾回收 ⭐⭐

### 21.1 垃圾回收算法

- **引用计数**：记录每个对象被引用次数，归零就回收。缺点：循环引用无法回收。
- **标记-清除（Mark-and-Sweep）**：从根对象出发，标记可达对象，未标记的回收。现代浏览器主要用这个。
- **分代回收**：新生代用 Scavenge（复制算法），老生代用标记-清除/标记-整理。

### 21.2 常见内存泄漏

```js
// 1. 意外的全局变量
function leak() {
  accidental = 'global'; // 没有声明，挂到 window
}

// 2. 忘记清除定时器
const timer = setInterval(() => {}, 1000); // 页面卸载也没清

// 3. 事件监听器没移除
window.addEventListener('resize', handler); // 组件销毁时没 remove

// 4. 闭包引用大对象
function create() {
  const huge = new Array(1e7);
  return () => huge.length; // huge 一直被引用
}

// 5. DOM 引用未释放
let detached = document.createElement('div');
document.body.appendChild(detached);
document.body.removeChild(detached);
// detached 变量仍引用着，无法回收

// 6. Map/Set 的键没有删除
const cache = new Map();
cache.set(largeObject, data); // 如果一直不 delete，内存持续增长
```

### 21.3 如何排查

- Chrome DevTools → Memory → Heap Snapshot（堆快照）。
- Performance Monitor 看内存曲线是否持续上升。
- 对比操作前后的快照，找 Detached DOM 和异常增长的对象。

---

## 22. V8 基础（面试加分） ⭐

```text
源码
  ↓ 解析（Parser）
AST（抽象语法树）
  ↓ Ignition 解释器
字节码（Bytecode）
  ↓ 热点代码
TurboFan 优化编译器
机器码
```

- **隐藏类（Hidden Class）**：V8 给对象建立形状，属性访问更快。
- **内联缓存（Inline Cache）**：缓存属性查找结果。
- **去优化（Deopt）**：类型变化导致优化失效，回退到字节码。

优化建议：

```js
// 好：创建后保持形状稳定
function Point(x, y) {
  this.x = x;
  this.y = y;
}

// 差：运行时增删属性，破坏隐藏类
const p = { x: 1 };
p.y = 2;
delete p.x;

// 差：数组混装不同类型
const arr = [1, 'a', true];

// 好：同类型数组
const nums = [1, 2, 3];
```

---

## 23. 手写题（面试必考） ⭐⭐⭐

### 23.1 防抖 debounce

> 连续触发时，只在停止触发 `delay` 毫秒后执行一次。

```js
function debounce(fn, delay = 300, immediate = false) {
  let timer = null; // 闭包保存定时器

  return function (...args) {
    const context = this; // 保留调用时的 this
    const callNow = immediate && !timer; // 首次是否立即执行

    if (timer) clearTimeout(timer); // 取消上一次

    timer = setTimeout(() => {
      timer = null; // 执行完重置
      if (!immediate) {
        fn.apply(context, args); // 非立即执行模式
      }
    }, delay);

    if (callNow) {
      fn.apply(context, args); // 立即执行模式
    }
  };
}

// 用法：搜索框输入
const onSearch = debounce((keyword) => {
  console.log('搜索', keyword);
}, 300);

input.addEventListener('input', (e) => onSearch(e.target.value));
```

### 23.2 节流 throttle

> 固定时间内最多执行一次。

```js
function throttle(fn, interval = 300) {
  let last = 0; // 上次执行时间
  let timer = null;

  return function (...args) {
    const now = Date.now();
    const remaining = interval - (now - last); // 距离下次可执行还有多久
    const context = this;

    if (remaining <= 0) {
      // 已到时间，立即执行
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn.apply(context, args);
    } else if (!timer) {
      // 还没到时间，安排一次尾部执行
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(context, args);
      }, remaining);
    }
  };
}

// 用法：滚动加载
window.addEventListener('scroll', throttle(() => {
  console.log('滚动位置', window.scrollY);
}, 200));
```

### 23.3 深拷贝

```js
function deepClone(value, cache = new WeakMap()) {
  // 原始类型直接返回（函数也按引用返回）
  if (value === null || typeof value !== 'object') return value;

  // 处理循环引用
  if (cache.has(value)) return cache.get(value);

  // Date
  if (value instanceof Date) return new Date(value);

  // RegExp
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);

  // Map
  if (value instanceof Map) {
    const map = new Map();
    cache.set(value, map);
    value.forEach((v, k) => {
      map.set(deepClone(k, cache), deepClone(v, cache));
    });
    return map;
  }

  // Set
  if (value instanceof Set) {
    const set = new Set();
    cache.set(value, set);
    value.forEach((v) => set.add(deepClone(v, cache)));
    return set;
  }

  // 数组或普通对象：保持原型
  const cloned = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  cache.set(value, cloned);

  // Reflect.ownKeys 能拿到 Symbol 键
  for (const key of Reflect.ownKeys(value)) {
    cloned[key] = deepClone(value[key], cache);
  }

  return cloned;
}
```

### 23.4 手写 `call` / `apply` / `bind`

```js
// call：立即执行，参数逐个传
Function.prototype.myCall = function (context, ...args) {
  context = context == null ? globalThis : Object(context);

  const key = Symbol('fn'); // 用 Symbol 避免覆盖已有属性
  context[key] = this;      // this 就是调用 myCall 的函数

  const result = context[key](...args);
  delete context[key];      // 清理临时属性

  return result;
};

// apply：立即执行，参数用数组
Function.prototype.myApply = function (context, args = []) {
  return this.myCall(context, ...args);
};

// bind：返回新函数，可预设参数，支持 new
Function.prototype.myBind = function (context, ...boundArgs) {
  if (typeof this !== 'function') {
    throw new TypeError('bind 必须由函数调用');
  }

  const fn = this;

  function BoundFunction(...callArgs) {
    // 用 new 调用时，this 是 BoundFunction 的实例，此时忽略 context
    const finalThis = this instanceof BoundFunction ? this : context;
    return fn.apply(finalThis, [...boundArgs, ...callArgs]);
  }

  // 保持原型链，让 new 出来的对象能访问原函数的 prototype
  if (fn.prototype) {
    BoundFunction.prototype = Object.create(fn.prototype);
  }

  return BoundFunction;
};
```

### 23.5 手写 `new`

```js
function myNew(Ctor, ...args) {
  if (typeof Ctor !== 'function') {
    throw new TypeError('Ctor 必须是函数');
  }

  // 1. 创建对象，原型指向构造函数的 prototype
  const obj = Object.create(Ctor.prototype);

  // 2. 执行构造函数，this 指向 obj
  const result = Ctor.apply(obj, args);

  // 3. 构造函数返回对象则以它为准，否则返回 obj
  const isObject = result !== null && (typeof result === 'object' || typeof result === 'function');
  return isObject ? result : obj;
}
```

### 23.6 手写 `instanceof`

```js
function myInstanceof(obj, Ctor) {
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false;
  }

  let proto = Object.getPrototypeOf(obj);
  while (proto) {
    if (proto === Ctor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```

### 23.7 手写 `Promise.all`

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    let items;
    try {
      items = Array.from(iterable); // 支持数组/Set/迭代器
    } catch (err) {
      return reject(err);
    }

    const results = new Array(items.length);
    let settledCount = 0;

    if (items.length === 0) return resolve(results);

    items.forEach((item, index) => {
      // Promise.resolve 兼容普通值
      Promise.resolve(item).then(
        (value) => {
          results[index] = value; // 保持原顺序
          settledCount += 1;
          if (settledCount === items.length) resolve(results);
        },
        (reason) => reject(reason) // 任何一个失败就失败
      );
    });
  });
}
```

### 23.8 数组扁平化

```js
function flatten(arr, depth = Infinity) {
  if (depth < 1) return arr.slice();

  return arr.reduce((acc, item) => {
    if (Array.isArray(item)) {
      acc.push(...flatten(item, depth - 1));
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}

flatten([1, [2, [3, [4]]]]);    // [1, 2, 3, 4]
flatten([1, [2, [3, [4]]]], 1); // [1, 2, [3, [4]]]
```

### 23.9 数组去重

```js
// 原始值
const unique = (arr) => [...new Set(arr)];

// 对象按 id 去重
function uniqueBy(arr, key) {
  const map = new Map();
  arr.forEach((item) => {
    if (!map.has(item[key])) map.set(item[key], item);
  });
  return [...map.values()];
}
```

### 23.10 柯里化

```js
function curry(fn) {
  function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args); // 参数够了，执行
    }
    return function (...nextArgs) {
      return curried.apply(this, [...args, ...nextArgs]); // 继续收集
    };
  }
  return curried;
}

function add(a, b, c) {
  return a + b + c;
}
const curriedAdd = curry(add);
curriedAdd(1)(2)(3);   // 6
curriedAdd(1, 2)(3);   // 6
curriedAdd(1, 2, 3);   // 6
```

### 23.11 组合与管道

```js
// compose：从右往左执行
const compose = (...fns) => fns.reduce((a, b) => (...args) => a(b(...args)));

// pipe：从左往右执行
const pipe = (...fns) => fns.reduce((a, b) => (...args) => b(a(...args)));

const addOne = (x) => x + 1;
const double = (x) => x * 2;

compose(addOne, double)(3); // addOne(double(3)) = 7
pipe(addOne, double)(3);    // double(addOne(3)) = 8
```

### 23.12 发布订阅

```js
class EventEmitter {
  constructor() {
    this.events = new Map(); // 事件名 → 回调数组
  }

  on(type, handler) {
    if (!this.events.has(type)) this.events.set(type, []);
    this.events.get(type).push(handler);

    // 返回取消订阅函数，方便清理
    return () => this.off(type, handler);
  }

  off(type, handler) {
    const handlers = this.events.get(type);
    if (!handlers) return;
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
    if (handlers.length === 0) this.events.delete(type);
  }

  once(type, handler) {
    const wrapper = (...args) => {
      this.off(type, wrapper);
      handler(...args);
    };
    this.on(type, wrapper);
  }

  emit(type, ...args) {
    const handlers = this.events.get(type);
    if (!handlers || handlers.length === 0) return false;
    [...handlers].forEach((fn) => fn(...args)); // 复制一份，防止遍历中修改
    return true;
  }
}
```

### 23.13 手写 `map` / `filter` / `reduce`

```js
Array.prototype.myMap = function (callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) {
      result[i] = callback.call(thisArg, this[i], i, this);
    }
  }
  return result;
};

Array.prototype.myFilter = function (callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback.call(thisArg, this[i], i, this)) {
      result.push(this[i]);
    }
  }
  return result;
};

Array.prototype.myReduce = function (callback, initialValue) {
  let accumulator = initialValue;
  let startIndex = 0;

  if (arguments.length < 2) {
    // 没有初始值：取第一个非空元素作为初始值
    while (startIndex < this.length && !(startIndex in this)) {
      startIndex++;
    }
    if (startIndex >= this.length) {
      throw new TypeError('Reduce of empty array with no initial value');
    }
    accumulator = this[startIndex++];
  }

  for (let i = startIndex; i < this.length; i++) {
    if (i in this) {
      accumulator = callback(accumulator, this[i], i, this);
    }
  }
  return accumulator;
};
```

### 23.14 `sleep` 与重试

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry(fn, times = 3, delay = 500) {
  let lastError;

  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      return await fn(); // 成功直接返回
    } catch (err) {
      lastError = err;
      if (attempt === times) break;
      await sleep(delay * attempt); // 退避：500、1000、1500...
    }
  }

  throw lastError;
}
```

---

## 24. 面试高频题

### Q1：`var` / `let` / `const` 的区别？ ⭐⭐⭐

**答：** `var` 是函数作用域，会提升且初始化为 undefined，可以重复声明，全局时挂到 window；`let/const` 是块级作用域，会提升但有 TDZ，不能重复声明。`const` 不能重新赋值，但对象内容可以改。业务里默认用 `const`，需要重新赋值用 `let`，基本不用 `var`。

### Q2：闭包是什么？有什么优缺点？ ⭐⭐⭐

**答：** 闭包是函数和它定义时词法环境的组合，内部函数可以访问外部函数的变量，即使外部函数已经执行完。优点：私有变量、函数工厂、防抖节流、缓存。缺点：变量不会被回收，滥用会导致内存泄漏。解决：不需要时移除事件监听、清除定时器、断开引用。

### Q3：`this` 的指向规则？ ⭐⭐⭐

**答：** 五条规则：默认绑定（普通调用，严格模式 undefined，非严格 window）、隐式绑定（obj.fn() 指向 obj）、显式绑定（call/apply/bind）、new 绑定（指向新对象）、箭头函数（没有自己的 this，取外层）。优先级：new > bind > call/apply > 隐式 > 默认。

### Q4：原型链是什么？ ⭐⭐⭐

**答：** 每个对象都有 __proto__ 指向它的原型，每个函数都有 prototype 属性。访问属性时先找自身，找不到就沿 __proto__ 向上找，直到 Object.prototype，再往上就是 null。这就是原型链。instanceof 就是沿着原型链找构造函数的 prototype。

### Q5：`new` 做了什么？ ⭐⭐⭐

**答：** 创建一个新对象；把新对象的 __proto__ 指向构造函数的 prototype；把 this 指向新对象并执行构造函数；如果构造函数返回对象，就返回这个对象，否则返回新对象。

### Q6：事件循环是什么？ ⭐⭐⭐

**答：** JS 单线程，同步代码在调用栈执行。异步任务完成后回调进入任务队列。事件循环不断取任务执行：先执行同步代码，调用栈清空后清空所有微任务，然后可能渲染，再取一个宏任务，如此循环。Promise.then 是微任务，setTimeout 是宏任务，所以 `1 4 3 2` 那道题微任务先于定时器。

### Q7：`Promise` 有哪些状态？`then` 返回什么？ ⭐⭐⭐

**答：** pending、fulfilled、rejected，状态一旦改变不可逆。`then` 返回一个新的 Promise，所以可以链式调用；回调里返回值会传给下一个 then，返回 Promise 会等待它；抛错会进入 catch。

### Q8：`async/await` 的原理？ ⭐⭐

**答：** async 函数返回 Promise；await 会暂停当前函数的执行，把后面的代码放到微任务里，等 Promise 完成后再继续。它本质上是 Promise 的语法糖，让异步代码看起来像同步。错误用 try/catch 捕获。

### Q9：`==` 和 `===` 的区别？ ⭐⭐⭐

**答：** `===` 不做类型转换，类型不同直接 false；`==` 会做类型转换，规则复杂，比如 `'' == 0`、`[] == false` 都是 true。业务代码统一用 `===`，只有判断 null/undefined 时可以用 `x == null`。

### Q10：`typeof null` 为什么是 object？ ⭐

**答：** 这是 JS 早期实现的历史 bug。当时用低位标识类型，对象的标识是 000，null 的机器表示全是 0，被误判为 object。后来为了兼容性没有修复。判断 null 用 `x === null`。

### Q11：深拷贝和浅拷贝的区别？ ⭐⭐⭐

**答：** 浅拷贝只复制第一层，嵌套对象还是同一个引用；深拷贝递归复制所有层级。浅拷贝用展开运算符、Object.assign；深拷贝可以用 structuredClone、递归 + WeakMap 处理循环引用；JSON 方法有局限，会丢失函数、undefined、Symbol，Date 变字符串。

### Q12：防抖和节流的区别？ ⭐⭐⭐

**答：** 防抖是连续触发时只在停止后执行一次，适合搜索输入、窗口 resize；节流是固定时间内最多执行一次，适合滚动加载、拖拽。防抖用 clearTimeout + setTimeout，节流用时间戳或定时器。

### Q13：事件委托是什么？有什么好处？ ⭐⭐⭐

**答：** 把事件监听器绑在父元素上，利用冒泡机制处理子元素的事件，通过 `e.target.closest()` 找到实际目标。好处：只绑一个监听器，性能好；动态新增的子元素自动生效；不用逐个解绑。

### Q14：`null` 和 `undefined` 的区别？ ⭐⭐

**答：** `undefined` 表示“未定义”，变量声明未赋值、函数无返回值、访问不存在的属性都是 undefined；`null` 表示“空值”，通常是主动赋值的。`typeof undefined` 是 'undefined'，`typeof null` 是 'object'。`null == undefined` 为 true，`===` 为 false。

### Q15：`0.1 + 0.2` 为什么不等于 0.3？ ⭐⭐

**答：** JS 用 IEEE 754 双精度浮点数表示数字，十进制小数转二进制时可能无限循环，存储时被截断，产生精度误差。解决：转整数计算、toFixed 保留小数，金额用整数分或 decimal.js。

### Q16：`for...in` 和 `for...of` 的区别？ ⭐⭐

**答：** `for...in` 遍历对象的可枚举键，包括原型链上的，适合对象但要注意用 `Object.hasOwn` 过滤；`for...of` 遍历可迭代对象的值（数组、字符串、Map、Set），不能直接遍历普通对象。

### Q17：`map` 和 `forEach` 的区别？ ⭐⭐

**答：** `map` 返回一个新数组，长度不变；`forEach` 只遍历，返回 undefined。需要转换结果用 map，只做副作用用 forEach。两者都不能 break，需要提前终止用 some/every 或 for 循环。

### Q18：垃圾回收怎么工作？哪些情况会内存泄漏？ ⭐⭐

**答：** 现代浏览器主要用标记-清除：从根对象出发标记可达对象，未标记的回收；还有分代回收。常见泄漏：意外全局变量、未清除的定时器、未移除的事件监听、闭包引用大对象、Detached DOM、Map 键不删除。

### Q19：CommonJS 和 ESM 的区别？ ⭐⭐

**答：** CommonJS 运行时同步加载，require/module.exports，导出值是拷贝；ESM 编译时静态分析，import/export，异步加载，导出值是实时绑定，支持 tree shaking 和顶层 await。

### Q20：`bind`、`call`、`apply` 的区别？ ⭐⭐

**答：** 都能改变 this。call 和 apply 立即执行，call 参数逐个传，apply 传数组；bind 不立即执行，返回一个新函数，可以预设参数，支持 new。

---

## 25. 练习

### 基础
1. 用 `for` 循环打印 1-100，遇到 3 的倍数打印 Fizz，5 的倍数打印 Buzz，同时是 3 和 5 打印 FizzBuzz。
2. 写一个函数，判断字符串是否是回文。
3. 写一个函数，统计数组里每个元素出现的次数。
4. 写一个函数，把二维数组转成一维。
5. 写一个函数，找出数组中的最大值和最小值。

### 进阶
6. 实现一个计数器，支持增加、减少、重置，并保证外部不能直接改 count。
7. 实现一个 `once` 函数：传入的函数只能执行一次。
8. 实现一个 `memoize` 函数，缓存函数结果。
9. 用闭包实现一个简单的模块，暴露 `add` 和 `get` 方法。
10. 解释下面代码的输出，并说明原因：

```js
var name = 'global';
const obj = {
  name: 'obj',
  getName() {
    return this.name;
  },
  getNameArrow: () => this.name,
};
console.log(obj.getName());
console.log(obj.getNameArrow());
const fn = obj.getName;
console.log(fn());
```

### 手写
11. 防抖、节流各写一遍，并说出使用场景。
12. 深拷贝，支持 Date、RegExp、Map、Set、循环引用。
13. 手写 `Promise.all`。
14. 手写 `call`、`apply`、`bind`。
15. 手写 `new` 和 `instanceof`。
16. 手写发布订阅。
17. 手写数组扁平化、去重、柯里化。

### 输出题
18.

```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
```

19.

```js
async function a() {
  console.log('a1');
  await b();
  console.log('a2');
}
async function b() {
  console.log('b');
}
console.log('start');
a();
Promise.resolve().then(() => console.log('p'));
console.log('end');
```

20.

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);
}
```

---

## 26. 自查清单

- [ ] 能解释 var/let/const 的区别和 TDZ。
- [ ] 能说出 8 种数据类型和判断方式。
- [ ] 能解释 `==` 的坑，并坚持用 `===`。
- [ ] 能解释闭包的定义、用途、内存问题。
- [ ] 能默写 this 的五条规则和优先级。
- [ ] 能画出原型链，解释 new 和 instanceof。
- [ ] 能解释事件流、事件委托、target/currentTarget。
- [ ] 能解释 Promise 状态和链式调用。
- [ ] 能解释事件循环，并做对输出题。
- [ ] 能区分 CJS 和 ESM。
- [ ] 能说出常见内存泄漏。
- [ ] 能手写防抖、节流、深拷贝、Promise.all、call/apply/bind、new。
