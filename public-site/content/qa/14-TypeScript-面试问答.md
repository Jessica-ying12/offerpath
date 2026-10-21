# 14 · TypeScript 面试问答分册

> 对应知识文档：[14-TypeScript.md](../14-TypeScript.md)
>
> 用法：先自己答，再看“直接回答”；追问遮住答案练。

---

## Q1. interface 和 type 的区别？

**直接回答：**

> 两者都能描述对象。interface 支持声明合并、extends，适合对象/类的契约；type 支持联合、交叉、元组、映射、条件类型，适合组合类型。团队统一即可，不必纠结。

**追问 1：什么时候必须用 type？**

> 联合类型、元组、字面量、映射类型、条件类型，比如 `type ID = string | number`、`type Keys = keyof T`。

**追问 2：声明合并有什么用？**

> 扩展第三方库的类型、给全局 Window 增加字段；但滥用会让类型来源不清晰。

**陷阱/加分：**

- interface 不能直接表示联合。
- type 不能声明合并。
- 性能差异通常可以忽略。

---

## Q2. `any` 和 `unknown` 的区别？

**直接回答：**

> any 关闭类型检查，能随便访问/调用；unknown 是安全版的 any，使用前必须收窄（typeof/instanceof/类型守卫）。外部输入优先用 unknown。

**追问 1：unknown 怎么用？**

> 先判断类型：`if (typeof value === 'string')`，或用类型守卫 `isUser(value)`，再访问属性。

**追问 2：为什么不要用 any？**

> 它会把类型错误推迟到运行时，失去 TS 的意义；还会传染给调用方。

**陷阱/加分：**

- `JSON.parse` 返回 any，最好断言成 unknown 再校验。
- catch 变量在 strict 下是 unknown。

---

## Q3. `never` 有什么用？

**直接回答：**

> 表示永远不会返回/不可能的值，比如抛错函数、死循环、穷尽检查的 default 分支。它能帮我们做 exhaustiveness check。

**追问 1：怎么用 never 做穷尽检查？**

> 在 switch 的 default 里 `const _exhaustive: never = value;`，如果漏了分支，TS 会报错。

**追问 2：never 和 void 的区别？**

> void 表示函数返回 undefined；never 表示函数不会正常返回（抛错/死循环）。

**陷阱/加分：**

- `never` 是底层类型，可以赋给任何类型。
- 联合类型里 never 会被忽略。

---

## Q4. 泛型是什么？怎么用？

**直接回答：**

> 泛型是类型参数，让函数/组件/类在多种类型下复用，同时保持类型安全。比如 `function identity<T>(x: T): T`，调用时推断或显式指定 T。

**追问 1：泛型约束怎么写？**

> `T extends { id: number }` 或 `K extends keyof T`，保证传入类型具备某些结构。

**追问 2：泛型默认值？**

> `type ApiResponse<T = unknown> = ...`，调用方不传时用默认类型。

**陷阱/加分：**

- 泛型不是“随便一个类型”，约束越明确越好。
- 泛型组件直接写 `function List<T>(props: ListProps<T>)`。

---

## Q5. `keyof` 和 `typeof` 怎么用？

**直接回答：**

> `keyof T` 取 T 的键联合；`typeof value` 取值的类型。常配合 `T[K]` 做类型安全的属性访问，比如 `pluck<T, K extends keyof T>(obj: T, key: K): T[K]`。

**追问 1：`keyof typeof obj` 是什么？**

> 先取 obj 的类型，再取它的键联合；常用于常量对象的键。

**追问 2：索引访问类型是什么？**

> `T[K]` 取 T 在键 K 上的类型，比如 `User['name']` 是 string。

**陷阱/加分：**

- keyof 只作用于类型，不是运行时。
- 数组的 keyof 包含 number 和数组方法。

---

## Q6. 常用工具类型有哪些？

**直接回答：**

> Partial、Required、Readonly、Pick、Omit、Record、Exclude、Extract、NonNullable、ReturnType、Parameters、Awaited。

**追问 1：Pick 和 Omit 的区别？**

> Pick 选字段，Omit 去掉字段；两者都返回新对象类型。

**追问 2：ReturnType 怎么用？**

> `type R = ReturnType<typeof fn>`，取函数返回值类型；常用于第三方函数/接口。

**陷阱/加分：**

- 工具类型是类型层面的，不产生运行时代码。
- 复杂工具类型可能影响编辑器性能。

---

## Q7. 类型守卫是什么？怎么写？

**直接回答：**

> 用 `value is Type` 告诉 TS 收窄类型，比如 `function isUser(v: unknown): v is User`；也可以用 typeof/instanceof/in/判别字段。

**追问 1：类型守卫和断言的区别？**

> 守卫会做运行时检查并收窄；断言 `as` 只是告诉编译器“相信我”，不做检查。

**追问 2：可辨识联合怎么收窄？**

> 用共同的判别字段，比如 `result.ok`，if 后 TS 自动收窄到对应分支。

**陷阱/加分：**

- 守卫函数内部要真的检查，不要直接 return true。
- 守卫可以做组合/取反。

---

## Q8. TS 类型能保证运行时安全吗？

**直接回答：**

> 不能。类型在编译后擦除，接口返回/用户输入仍可能不符合类型；要用 zod/io-ts 做运行时校验。

**追问 1：为什么接口返回不可信？**

> 后端可能改字段、返回 null、字段类型变化；TS 编译期不知道运行时数据。

**追问 2：zod 怎么用？**

> 定义 schema，`schema.parse(data)` 校验并得到类型；失败抛错，可以统一处理。

**陷阱/加分：**

- `as` 不会校验，只是断言。
- 表单/URL/localStorage 数据都要校验。

---

## Q9. React 组件 props 怎么定义？

**直接回答：**

> 用 type/interface 定义 props，函数参数解构；children 用 `React.ReactNode`；事件用 `React.ChangeEvent` 等；泛型组件直接写 `<T>`。

**追问 1：`React.FC` 要用吗？**

> 不是必须。它不支持泛型组件，早期还有 children 隐式类型问题；直接写 props 类型更灵活。

**追问 2：children 类型怎么选？**

> 一般用 `React.ReactNode`；如果只允许单个元素用 `React.ReactElement`。

**陷阱/加分：**

- 可选 props 用 `?`，默认值在解构里给。
- 事件类型要带元素泛型，比如 `HTMLInputElement`。

---

## Q10. useState/useRef/事件类型怎么写？

**直接回答：**

> `useState<User | null>(null)`；`useRef<HTMLInputElement>(null)`；事件用 `React.ChangeEvent<HTMLInputElement>`、`React.FormEvent<HTMLFormElement>`、`React.MouseEvent<HTMLButtonElement>`。

**追问 1：useRef 初始值 null 为什么还要泛型？**

> 让 `.current` 有明确类型；DOM ref 常见 `useRef<HTMLDivElement>(null)`。

**追问 2：事件对象能复用吗？**

> React 新版本不再复用，可以异步访问；但不要把事件对象存太久。

**陷阱/加分：**

- `useState([])` 可能推断 never[]，要写 `useState<Post[]>([])`。
- 事件类型不要用 any。

---

## Q11. `as` 和 `satisfies` 的区别？

**直接回答：**

> `as` 是类型断言，可能绕过检查；`satisfies` 检查值是否符合类型，同时保留更具体的推断类型。配置对象常用 satisfies。

**追问 1：什么时候用 as？**

> 你比编译器更确定类型时，比如 DOM 查询、第三方库类型不准确；但要谨慎。

**追问 2：satisfies 的例子？**

> `const config = { mode: 'production', port: 3000 } satisfies Config;`，既检查 Config，又保留 mode 的字面量类型。

**陷阱/加分：**

- `as` 不能把不兼容的类型硬转，除非先转 unknown。
- 滥用 as 会让类型系统失效。

---

## Q12. tsconfig 的 strict 包含什么？

**直接回答：**

> noImplicitAny、strictNullChecks、strictFunctionTypes、strictBindCallApply、noImplicitThis、alwaysStrict、useUnknownInCatchVariables 等。

**追问 1：strictNullChecks 有什么用？**

> null/undefined 不能随便赋给其他类型，必须显式处理；能避免大量空指针错误。

**追问 2：新项目要开 strict 吗？**

> 建议开；老项目可以逐步开，先 noImplicitAny/strictNullChecks。

**陷阱/加分：**

- 关掉 strict 等于放弃 TS 的一半价值。
- 第三方库类型问题可以用 skipLibCheck 缓解。

---

## Q13. 为什么 catch 变量是 unknown？

**直接回答：**

> 因为抛出的不一定是 Error，可能是字符串/对象；TS 让你先收窄再访问 message，避免运行时错误。

**追问 1：怎么处理？**

> `if (err instanceof Error) console.log(err.message); else console.log(String(err));`。

**追问 2：接口错误怎么统一？**

> 封装 HttpError/业务错误类型，catch 后归一化；不要直接假设 err.message。

**陷阱/加分：**

- `useUnknownInCatchVariables` 是 strict 的一部分。
- 错误上报要保留 stack。

---

## Q14. 第三方库没有类型怎么办？

**直接回答：**

> 先看有没有 `@types/xxx`；没有就自己写 `.d.ts` 声明，或找库自带的类型；实在没有可以临时 `declare module 'xxx'`，但不要长期用 any。

**追问 1：`declare module` 怎么写？**

> `declare module 'foo' { export function bar(x: string): number; }`，放在 `.d.ts` 里。

**追问 2：全局类型扩展怎么做？**

> 用 `declare global { interface Window { ... } }`，并 `export {}` 让文件成为模块。

**陷阱/加分：**

- `skipLibCheck` 只跳过声明文件检查，不解决缺失类型。
- 自己写的声明要与实际 API 一致。

---

## Q15. 从 JS 迁移到 TS，怎么开始？

**直接回答：**

> 先开 `allowJs` 和宽松配置，让项目能编译；从工具函数/接口层开始加类型，逐步开 strict；用 `unknown` 替代 any，补类型守卫和运行时校验；最后处理第三方库和遗留 any。

**追问 1：历史代码太多怎么办？**

> 新代码 strict，老代码逐步加；用 `// @ts-expect-error` 标记临时问题，但要有清理计划。

**追问 2：怎么避免类型和实际不一致？**

> 接口用 zod 校验，类型从 schema 推导；关键路径加测试。

**陷阱/加分：**

- 不要一次性全量迁移，风险大。
- 不要用 any 糊过去，等于没迁移。

---

## 16. 快速自测

- [ ] 能区分 interface/type。
- [ ] 能解释 any/unknown/never。
- [ ] 会写泛型、约束、工具类型。
- [ ] 会用 keyof/typeof/索引访问。
- [ ] 会写类型守卫和可辨识联合。
- [ ] 会写 React props/Hooks/事件类型。
- [ ] 会写 RN props/导航类型。
- [ ] 会封装泛型请求并做运行时校验。
- [ ] 能解释 as/satisfies、类型擦除。
- [ ] 能说出 strict 配置和常见错误修复。
