# 14 · TypeScript

> 目标：能读懂、能写现代 React/RN 项目里的 TypeScript；掌握类型、泛型、收窄、工具类型、React/RN 类型写法，并能回答高频面试题。
>
> 标记：⭐⭐⭐ 必须会｜⭐⭐ 要理解｜⭐ 了解即可

---

## 1. 为什么用 TypeScript

TypeScript = JavaScript + 静态类型。

```ts
function add(a: number, b: number): number {
  return a + b;
}

add(1, 2);      // ✅
add('1', 2);    // ❌ 编译期报错
```

好处：

- 编译期发现类型错误，减少运行时崩溃。
- 编辑器自动补全/跳转/重构更准。
- 类型就是文档，接口字段一目了然。
- 大型项目/多人协作更可控。

代价：

- 需要写类型、配置 tsconfig。
- 类型复杂时学习成本高。
- 类型只在编译期，运行时仍要做校验。

> **关键认知：TS 类型会在编译后被擦除，不能替代运行时校验。**

---

## 2. 环境与 tsconfig

```bash
npm i -D typescript
npx tsc --init
```

一个常用的 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

`strict: true` 会开启：

- `noImplicitAny`：不能有隐式 any。
- `strictNullChecks`：null/undefined 不能随便赋给其他类型。
- `strictFunctionTypes`：函数参数逆变检查。
- `strictBindCallApply`：call/apply/bind 参数检查。
- `noImplicitThis`：this 不能隐式 any。
- `alwaysStrict`：严格模式。
- `useUnknownInCatchVariables`：catch 变量是 unknown。

**新手建议：新项目直接 `strict: true`，不要关。**

---

## 3. 基础类型

```ts
let name: string = 'Tom';
let age: number = 18;
let isVip: boolean = true;
let nothing: null = null;
let undef: undefined = undefined;

// 数组
let nums: number[] = [1, 2, 3];
let names: Array<string> = ['a', 'b'];

// 元组：固定长度和类型
let pair: [string, number] = ['Tom', 18];

// 对象
let user: { name: string; age?: number } = { name: 'Tom' };

// 函数
function greet(name: string): string {
  return `hi ${name}`;
}

// 箭头函数
const add = (a: number, b: number): number => a + b;
```

### 3.1 字面量类型

```ts
type Direction = 'up' | 'down' | 'left' | 'right';

let dir: Direction = 'up'; // ✅
// let dir2: Direction = 'top'; // ❌
```

### 3.2 `any` vs `unknown` vs `never`

```ts
let a: any = 1;
a.foo.bar(); // 编译不报错，运行时可能崩

let u: unknown = 1;
// u.foo; // ❌ 必须先收窄
if (typeof u === 'number') {
  console.log(u + 1);
}

function fail(msg: string): never {
  throw new Error(msg);
}
```

| 类型 | 含义 | 使用建议 |
|---|---|---|
| `any` | 关闭类型检查 | 尽量不用 |
| `unknown` | 未知类型，使用前必须收窄 | 接口返回/外部输入优先 |
| `never` | 永远不会返回 | 抛错函数、穷尽检查 |

### 3.3 `void`

```ts
function log(msg: string): void {
  console.log(msg);
}
```

---

## 4. interface vs type

```ts
interface User {
  id: number;
  name: string;
}

type Point = {
  x: number;
  y: number;
};
```

| 维度 | interface | type |
|---|---|---|
| 对象形状 | ✅ | ✅ |
| 联合/交叉 | 有限 | ✅ |
| 元组/字面量 | 不方便 | ✅ |
| 声明合并 | ✅ | ❌ |
| 扩展 | `extends` | `&` |
| 性能 | 通常更好 | 复杂类型可能慢 |

**怎么选：**

- 对象/类的契约用 `interface`。
- 联合、映射、条件、工具类型用 `type`。
- 团队统一即可，不必纠结。

```ts
interface User {
  id: number;
}
interface User {
  name: string;
}
// 合并成 { id: number; name: string }
```

---

## 5. 联合、交叉、收窄

### 5.1 联合类型

```ts
type ID = string | number;

function printId(id: ID) {
  if (typeof id === 'string') {
    console.log(id.toUpperCase()); // 这里收窄为 string
  } else {
    console.log(id.toFixed(0));    // 这里收窄为 number
  }
}
```

### 5.2 交叉类型

```ts
type User = { name: string };
type WithAge = { age: number };

type UserWithAge = User & WithAge;
// { name: string; age: number }
```

### 5.3 可辨识联合

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.data;
  throw new Error(result.error);
}
```

`ok` 是判别字段，`if (result.ok)` 后 TS 自动收窄。

### 5.4 收窄方式

```ts
// typeof
if (typeof value === 'string') {}

// instanceof
if (err instanceof Error) {}

// in
if ('name' in user) {}

// 字面量
if (status === 'success') {}

// 自定义类型守卫
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value
  );
}
```

---

## 6. 泛型

### 6.1 基础

```ts
function identity<T>(value: T): T {
  return value;
}

identity<string>('a');
identity(1); // 自动推断 T = number
```

### 6.2 约束

```ts
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Tom' };
pluck(user, 'name'); // string
// pluck(user, 'age'); // ❌
```

### 6.3 默认类型

```ts
type ApiResponse<T = unknown> = {
  code: number;
  data: T;
  message: string;
};
```

### 6.4 泛型组件

```tsx
type ListProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
};

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>;
}
```

---

## 7. 常用工具类型

```ts
type User = {
  id: number;
  name: string;
  age?: number;
};

type PartialUser = Partial<User>;      // 全部可选
type RequiredUser = Required<User>;    // 全部必填
type ReadonlyUser = Readonly<User>;    // 只读
type NameOnly = Pick<User, 'name'>;    // 选字段
type NoAge = Omit<User, 'age'>;        // 去掉字段
type UserMap = Record<string, User>;   // 字典

type Status = 'a' | 'b' | 'c';
type AB = Exclude<Status, 'c'>;        // 'a' | 'b'
type B = Extract<Status, 'b'>;         // 'b'
type NotNull = NonNullable<string | null>; // string

type Fn = (a: number, b: string) => boolean;
type Ret = ReturnType<Fn>;             // boolean
type Params = Parameters<Fn>;          // [number, string]
type AwaitedValue = Awaited<Promise<number>>; // number
```

### 7.1 `keyof` / `typeof` / 索引访问

```ts
const user = { id: 1, name: 'Tom' };

type UserKeys = keyof typeof user; // 'id' | 'name'
type NameType = (typeof user)['name']; // string
```

### 7.2 `as const` / `satisfies`

```ts
const config = {
  mode: 'production',
  port: 3000,
} as const;
// mode: 'production'，port: 3000 字面量

type Config = { mode: 'development' | 'production'; port: number };
const cfg = {
  mode: 'production',
  port: 3000,
} satisfies Config;
// 保留具体字面量类型，同时检查是否符合 Config
```

---

## 8. 类与面向对象

```ts
class User {
  readonly id: number;
  private password: string;
  protected age: number;

  constructor(id: number, password: string, age: number) {
    this.id = id;
    this.password = password;
    this.age = age;
  }

  public getName(): string {
    return `user-${this.id}`;
  }
}

// 参数属性简写
class Point {
  constructor(public x: number, public y: number) {}
}

// 抽象类
abstract class Shape {
  abstract area(): number;
}

class Circle extends Shape {
  constructor(private r: number) {
    super();
  }
  area() {
    return Math.PI * this.r ** 2;
  }
}

// 接口实现
interface Flyable {
  fly(): void;
}
class Bird implements Flyable {
  fly() {}
}
```

---

## 9. React 中的 TS

### 9.1 组件 props

```tsx
type ButtonProps = {
  title: string;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
};

function Button({ title, variant = 'primary', onPress, children }: ButtonProps) {
  return (
    <button className={variant} onClick={onPress}>
      {title}
      {children}
    </button>
  );
}
```

### 9.2 常用 React 类型

```tsx
React.ReactNode;        // 任意可渲染内容
React.ReactElement;     // React 元素
React.CSSProperties;    // style 对象
React.ChangeEvent<HTMLInputElement>;
React.MouseEvent<HTMLButtonElement>;
React.FormEvent<HTMLFormElement>;
React.RefObject<HTMLDivElement>;
```

### 9.3 Hooks 泛型

```tsx
const [user, setUser] = useState<User | null>(null);
const inputRef = useRef<HTMLInputElement>(null);
const [list, setList] = useState<Post[]>([]);
```

### 9.4 事件

```tsx
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setKeyword(e.target.value);
}

function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
}
```

### 9.5 `forwardRef`

```tsx
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <input ref={ref} {...props} />
);
```

> React 19 起 ref 可以直接作为 prop，`forwardRef` 逐步不再是必须；老项目仍常见。

### 9.6 不要滥用 `React.FC`

`React.FC` 早期会给 children 隐式类型，现在已修正；但它不支持泛型组件，且不是必须。直接写 props 类型即可。

---

## 10. React Native 中的 TS

```tsx
type Post = {
  id: number;
  title: string;
  body: string;
};

type PostItemProps = {
  item: Post;
  onPress: (id: number) => void;
};

function PostItem({ item, onPress }: PostItemProps) {
  return (
    <Pressable onPress={() => onPress(item.id)}>
      <Text>{item.title}</Text>
    </Pressable>
  );
}
```

导航类型：

```tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  List: undefined;
  Detail: { id: number };
};

type DetailProps = NativeStackScreenProps<RootStackParamList, 'Detail'>;

function DetailScreen({ route, navigation }: DetailProps) {
  const { id } = route.params;
  return <Text>{id}</Text>;
}
```

样式类型：

```tsx
import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native';

const styles = StyleSheet.create({
  card: { padding: 16 } as ViewStyle,
  title: { fontSize: 16 } as TextStyle,
});
```

---

## 11. 接口与请求泛型

```ts
type ApiResponse<T> = {
  code: number;
  data: T;
  message: string;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 0) throw new Error(json.message);
  return json.data;
}

type User = { id: number; name: string };

const user = await request<User>('/api/user/1');
// user: User
```

**注意：** `as ApiResponse<T>` 是断言，不是运行时校验；接口字段不可信时用 zod/io-ts 校验。

```ts
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const user = UserSchema.parse(await res.json());
// user: { id: number; name: string }
```

---

## 12. 类型声明与模块

```ts
// types/user.ts
export type User = { id: number; name: string };

// 导入类型
import type { User } from './types/user';

// 只导入类型时用 import type，避免运行时引入
```

第三方库没有类型：

```bash
npm i -D @types/lodash
```

自己声明：

```ts
// types/global.d.ts
declare global {
  interface Window {
    AndroidBridge?: {
      postMessage: (msg: string) => void;
    };
  }
}

export {};
```

---

## 13. 常见错误与修复

| 错误 | 原因 | 修复 |
|---|---|---|
| `Object is possibly 'null'` | strictNullChecks | 判空/可选链/默认值 |
| `Property 'x' does not exist on type` | 类型没定义该字段 | 补类型/收窄/索引签名 |
| `Type 'string' is not assignable to type 'number'` | 类型不匹配 | 转换/改类型 |
| `Argument of type ... is not assignable` | 参数类型不符 | 检查函数签名 |
| `Cannot find module 'xxx'` | 没装依赖/没声明类型 | `npm i`、`@types/xxx`、声明文件 |
| `JSX element implicitly has type 'any'` | 没配 JSX/React 类型 | 配 `jsx`、装 `@types/react` |
| `Type 'X' is missing the following properties` | 对象缺字段 | 补字段/改类型 |
| `Conversion of type ... may be a mistake` | 断言不兼容 | 先收窄/用 `unknown` 中转 |

---

## 14. 面试高频

### Q1：interface 和 type 的区别？ ⭐⭐⭐

**答：** 都能描述对象。interface 支持声明合并、extends，适合对象/类契约；type 支持联合、交叉、元组、映射、条件类型，适合组合类型。团队统一即可，不必纠结。

### Q2：`any` 和 `unknown` 的区别？ ⭐⭐⭐

**答：** any 关闭类型检查，能随便访问；unknown 是安全版的 any，使用前必须收窄（typeof/instanceof/类型守卫）。外部输入优先 unknown。

### Q3：`never` 有什么用？ ⭐⭐

**答：** 表示永远不会返回/不可能的值，比如抛错函数、死循环、穷尽检查的 default 分支。它能帮我们做 exhaustiveness check。

### Q4：泛型是什么？ ⭐⭐⭐

**答：** 类型参数，让函数/组件/类在多种类型下复用，同时保持类型安全。比如 `function identity<T>(x: T): T`，调用时推断或显式指定 T。

### Q5：`keyof` 和 `typeof` 怎么用？ ⭐⭐

**答：** `keyof T` 取 T 的键联合；`typeof value` 取值的类型。常配合 `T[K]` 做类型安全的属性访问，比如 `pluck<T, K extends keyof T>(obj: T, key: K): T[K]`。

### Q6：常用工具类型有哪些？ ⭐⭐⭐

**答：** Partial、Required、Readonly、Pick、Omit、Record、Exclude、Extract、NonNullable、ReturnType、Parameters、Awaited。

### Q7：类型守卫是什么？ ⭐⭐

**答：** 用 `value is Type` 告诉 TS 收窄类型，比如 `function isUser(v: unknown): v is User`；也可以用 typeof/instanceof/in/判别字段。

### Q8：TS 类型能保证运行时安全吗？ ⭐⭐⭐

**答：** 不能。类型在编译后擦除，接口返回/用户输入仍可能不符合类型；要用 zod/io-ts 做运行时校验。

### Q9：React 组件 props 怎么定义？ ⭐⭐

**答：** 用 type/interface 定义 props，函数参数解构；children 用 React.ReactNode；事件用 React.ChangeEvent 等；泛型组件直接写 `<T>`。

### Q10：`as` 和 `satisfies` 的区别？ ⭐⭐

**答：** `as` 是类型断言，可能绕过检查；`satisfies` 检查值是否符合类型，同时保留更具体的推断类型。配置对象常用 satisfies。

### Q11：tsconfig 的 strict 包含什么？ ⭐⭐

**答：** noImplicitAny、strictNullChecks、strictFunctionTypes、strictBindCallApply、noImplicitThis、alwaysStrict、useUnknownInCatchVariables 等。

### Q12：为什么 catch 变量是 unknown？ ⭐⭐

**答：** 因为抛出的不一定是 Error，可能是字符串/对象；TS 让你先收窄再访问 message，避免运行时错误。

---

## 15. 练习

1. 给一个 `User` 接口，包含可选 `age`、只读 `id`。
2. 写一个泛型 `pluck`，类型安全地取对象属性。
3. 用可辨识联合表示 `Loading/Success/Error` 三种状态。
4. 写一个类型守卫 `isPost(value: unknown): value is Post`。
5. 用 `Partial/Omit/Pick` 派生表单类型。
6. 给 React 按钮组件写 props 和事件类型。
7. 给 RN 列表项和导航参数写类型。
8. 封装 `request<T>`，并用 zod 校验返回值。
9. 把一段 JS 代码迁移到 strict TS，消除所有 any。
10. 解释 `as const` 和 `satisfies` 的区别。

---

## 16. 自查清单

- [ ] 能配置 strict tsconfig。
- [ ] 能区分 any/unknown/never/void。
- [ ] 能说清 interface/type 的取舍。
- [ ] 会用联合、交叉、收窄、类型守卫。
- [ ] 会写泛型函数/组件/约束。
- [ ] 会用常用工具类型。
- [ ] 会写 React props/事件/Hooks 类型。
- [ ] 会写 RN props/导航/样式类型。
- [ ] 会封装泛型请求并做运行时校验。
- [ ] 能解释类型擦除和 `as` 的风险。
