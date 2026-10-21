# 01 · HTML 面试问答分册

> 对应知识文档：[01-HTML基础与浏览器渲染.md](../01-HTML基础与浏览器渲染.md)
>
> 用法：先自己答，再看“直接回答”；追问部分遮住答案再练。

---

## Q1. 什么是语义化？为什么重要？

**直接回答：**

> 语义化就是用含义正确的标签描述内容，比如导航用 `nav`、主内容用 `main`、文章用 `article`，而不是全部用 `div`。好处是 SEO 更好、读屏软件能理解、代码可维护、移动端默认行为更正确。

**追问 1：不用语义化会有什么问题？**

> 页面仍然能显示，但搜索引擎和读屏软件拿不到结构信息，键盘/无障碍体验差；团队维护时也很难一眼看出哪块是导航、哪块是主体。

**追问 2：`header`、`nav`、`main`、`section`、`article` 怎么区分？**

> `header` 是页头或区块头；`nav` 是导航链接；`main` 是页面唯一主体；`section` 是有主题的分组，通常带标题；`article` 是独立完整、可单独分发的内容，比如文章、商品卡、帖子。

**陷阱/加分：**

- 一个页面通常只写一个 `main`，但可以有多个 `header/footer`。
- `section` 不是“随便包一层”，它应该有主题。
- 不要用 `<div onclick>` 代替 `<button>`。

---

## Q2. HTML5 有哪些新特性？

**直接回答：**

> 主要分几类：语义化标签（`header/nav/main/article/section`）、表单增强（`type="email/tel/date"`、`required`、`pattern`）、多媒体（`video/audio/canvas/svg`）、存储（`localStorage/sessionStorage/IndexedDB`）、通信（`WebSocket`、SSE）、新 API（`history.pushState`、`geolocation`、`File API`、`Drag and Drop`），以及 `defer/async`、`data-*`、`template`、`dialog` 等。

**追问 1：你最常用的是哪些？**

> 语义化标签、`data-*`、`defer/async`、`localStorage`、`video`、`dialog`，以及 `history.pushState` 做前端路由。

**追问 2：HTML5 的 `localStorage` 和 Cookie 有什么区别？**

> Cookie 约 4KB、会随请求发送、可设过期时间；`localStorage` 约 5-10MB、不随请求发送、永久存储，除非手动删除。敏感 token 不建议放 `localStorage`，因为 XSS 能读。

**陷阱/加分：**

- HTML5 不是“新语言”，是 HTML 标准的第五次大版本。
- `localStorage` 是同步 API，大量读写会阻塞主线程。

---

## Q3. `defer` 和 `async` 的区别？

**直接回答：**

> 两者都会并行下载脚本、不阻塞 HTML 解析。区别在执行时机：`async` 下载完立刻执行，顺序不保证，可能打断解析；`defer` 等 HTML 解析完、`DOMContentLoaded` 之前按顺序执行。有依赖关系用 `defer`，独立脚本（统计、广告）用 `async`。

**追问 1：`type="module"` 的脚本呢？**

> 模块脚本默认就是 `defer` 行为，按顺序执行，并且只在模块作用域里运行，顶层 `this` 是 `undefined`。

**追问 2：为什么通常把 `script` 放在 `body` 末尾？**

> 因为普通脚本会阻塞 HTML 解析；放末尾可以保证 DOM 已经解析完，也不会挡住首屏内容。现代项目更常用 `defer` 或打包工具处理。

**陷阱/加分：**

- `async` 不保证顺序，多个 async 脚本谁先下载完谁先执行。
- `defer` 保证顺序，但只在 HTML 解析完成后执行。

---

## Q4. `DOMContentLoaded` 和 `load` 的区别？

**直接回答：**

> `DOMContentLoaded` 在 DOM 解析完成时触发，不等待图片、样式、iframe；`load` 要等所有资源（图片、样式、iframe）加载完才触发。操作 DOM 用前者，统计资源加载用后者。

**追问 1：CSS 会阻塞 `DOMContentLoaded` 吗？**

> 普通情况下 CSS 不直接阻塞 `DOMContentLoaded`，但 CSS 会阻塞后面脚本的执行，而脚本可能阻塞解析，所以间接会影响。图片不会阻塞 `DOMContentLoaded`。

**追问 2：页面卸载时想提示用户，用哪个事件？**

> `beforeunload`，可以 `preventDefault()` 并设置 `returnValue` 触发浏览器确认框；`unload` 里不能可靠地做异步操作。

**陷阱/加分：**

- `DOMContentLoaded` 可能早于样式表加载完。
- `load` 不适合做首屏逻辑，太晚。

---

## Q5. `viewport` 有什么用？每个参数什么意思？

**直接回答：**

> `viewport` 告诉移动端浏览器如何设置视口。`width=device-width` 让页面宽度等于设备宽度，`initial-scale=1.0` 设置初始缩放，`viewport-fit=cover` 让页面延伸到刘海屏区域，配合安全区使用。

**追问 1：不写 `viewport` 会怎样？**

> 手机浏览器会按大约 980px 的虚拟宽度渲染再缩小，文字和按钮会显得很小，需要用户手动放大。

**追问 2：`viewport-fit=cover` 之后要注意什么？**

> 内容可能被刘海/圆角/底部小白条遮挡，要用 `env(safe-area-inset-*)` 给页面加安全区 padding。

**陷阱/加分：**

- `user-scalable=no` 会伤害无障碍体验，非必要不要用。
- 移动端 1px、安全区、输入框字体 16px 都是配套问题。

---

## Q6. `label` 有什么作用？

**直接回答：**

> `label` 把文字和表单控件关联起来。`for` 等于控件的 `id`，点击文字也能聚焦输入框或勾选复选框，提升可用性和无障碍体验。

**追问 1：`label` 包裹 `input` 和用 `for` 有什么区别？**

> 包裹写法不需要 `id`，点击范围是整个 label；`for` 写法更灵活，label 和 input 可以分开。两种都行，但不能同时指向不同控件。

**追问 2：读屏软件怎么识别？**

> 读屏会把 label 文本作为控件的可访问名称；没有 label 时，只能用 `aria-label` 或 `placeholder` 兜底。

**陷阱/加分：**

- `placeholder` 不能替代 label，输入后提示就消失了。
- 图标按钮没有文字时，用 `aria-label`。

---

## Q7. `alt` 和 `title` 的区别？

**直接回答：**

> `alt` 是图片的替代文本，图片加载失败或读屏时使用，是必需的；`title` 是鼠标悬停提示，可选，不能替代 `alt`。

**追问 1：装饰性图片的 `alt` 怎么写？**

> 写空 `alt=""`，让读屏跳过，避免朗读无意义信息。

**追问 2：`alt` 对 SEO 有用吗？**

> 有辅助作用，搜索引擎能理解图片内容，但不要堆关键词；关键是准确描述图片。

**陷阱/加分：**

- 图片链接的 `alt` 要说明点击后的目的。
- 不要用 `title` 承担关键信息，移动端没有 hover。

---

## Q8. `data-*` 有什么用？

**直接回答：**

> 用来在 HTML 元素上存自定义业务数据，JS 通过 `element.dataset` 读取，比如 `data-goods-id="1"` 对应 `dataset.goodsId`。常用于事件委托时识别操作对象。

**追问 1：`dataset` 的值是什么类型？**

> 都是字符串；数字要手动转换，布尔值也要判断，比如 `Number(el.dataset.id)`。

**追问 2：和把数据放全局变量相比有什么好处？**

> 数据跟 DOM 绑定，动态生成的元素也能直接带数据；事件委托时从 `currentTarget.dataset` 取，不需要额外维护映射。

**陷阱/加分：**

- 不要用 `data-*` 存大对象/敏感信息，HTML 是公开的。
- 属性名是 kebab-case，JS 里自动转驼峰。

---

## Q9. `src` 和 `href` 的区别？

**直接回答：**

> `src` 是引入资源并替换当前元素，浏览器会下载并执行/显示，比如 `img`、`script`、`iframe`；`href` 是建立引用关系，比如 `a`、`link`，不会替换当前内容。

**追问 1：为什么 `script` 用 `src` 会阻塞？**

> 浏览器遇到普通 `script` 必须下载并执行完，才能继续解析后面的 HTML，因为脚本可能修改 DOM。

**追问 2：`link` 的 `href` 为什么不会替换页面？**

> `link` 是外部资源引用，浏览器根据 `rel` 决定用途（样式表、图标、预加载），不是把资源内容嵌入当前位置。

**陷阱/加分：**

- `a href="#"` 会跳到顶部，通常要 `preventDefault`。
- `script src` 和 `link href` 都可能触发网络请求。

---

## Q10. 块级元素和行内元素的区别？

**直接回答：**

> 块级元素（`div/p/h1`）独占一行，宽高、margin、padding 都生效；行内元素（`span/a/strong`）不独占一行，宽高不生效，垂直 margin 不影响布局。`inline-block` 可以设宽高但不独占一行。

**追问 1：为什么行内元素的垂直 padding 看起来有效但不撑开布局？**

> 垂直 padding 会绘制出来，但不参与行盒的高度计算，可能覆盖相邻内容，所以布局上不可靠。

**追问 2：现在布局还用 `inline-block` 吗？**

> 少用，容易有基线空隙和对齐问题；现在优先 Flex/Grid。

**陷阱/加分：**

- `img` 是替换元素，虽然是行内，但可以设宽高。
- `display` 可以改变元素的布局行为。

---

## Q11. 表单提交有几种方式？怎么做校验？

**直接回答：**

> 两种：传统 `action + method` 提交会跳转页面；现在主流是监听 `submit`，`preventDefault()` 后用 `fetch/axios` 提交。校验可以先用 HTML 原生属性（`required`、`pattern`、`minlength`），再用 JS 做自定义校验和错误提示。

**追问 1：`FormData` 有什么用？**

> 能直接收集带 `name` 的表单控件，包括文件；可以 `Object.fromEntries(formData)` 转对象，或直接作为 `fetch` 的 body。

**追问 2：移动端表单有什么坑？**

> iOS 输入框字体小于 16px 会自动放大页面；数字键盘用 `type="tel"` + `inputmode="numeric"`；键盘弹起可能遮挡输入框；密码要设置正确的 `autocomplete`。

**陷阱/加分：**

- 校验失败要聚焦到第一个错误字段。
- 提交按钮要防重复点击（禁用/loading）。

---

## Q12. `iframe` 有什么优缺点？怎么保证安全？

**直接回答：**

> 优点是可以嵌入第三方页面、隔离样式和 JS；缺点是性能开销大、SEO 不友好、移动端体验差、通信麻烦。安全上要用 `sandbox` 限制权限，跨域通信只用 `postMessage`，并校验 `origin`。

**追问 1：`sandbox` 有哪些常用值？**

> `allow-scripts` 允许脚本、`allow-same-origin` 保留同源、`allow-forms` 允许表单、`allow-popups` 允许弹窗。不要同时给 `allow-scripts` 和 `allow-same-origin`，否则可能逃逸沙箱。

**追问 2：父页面和 iframe 怎么通信？**

> 用 `postMessage` 发送，接收方监听 `message` 事件并校验 `event.origin`，不要信任任意来源。

**陷阱/加分：**

- iframe 会阻塞父页面 `load`。
- 第三方内容尽量用独立域名，避免 XSS 影响主站。

---

## Q13. 从输入 URL 到页面展示，HTML 部分发生了什么？

**直接回答：**

> 浏览器拿到 HTML 字节后，按编码解析成字符，再分词、构建节点，生成 DOM 树；同时解析 CSS 生成 CSSOM。遇到普通脚本会阻塞解析，下载并执行；DOM 和 CSSOM 准备好后生成渲染树，布局、绘制、合成。图片等资源继续加载，最后触发 `load`。

**追问 1：CSS 会阻塞什么？**

> CSS 会阻塞渲染（没有 CSSOM 不敢画），也会阻塞后面脚本的执行，因为脚本可能读取样式。

**追问 2：`defer` 脚本在什么时候执行？**

> HTML 解析完后、`DOMContentLoaded` 之前，按顺序执行。

**陷阱/加分：**

- DOM 是树形对象模型，不是 HTML 字符串。
- 重排/重绘发生在布局和绘制阶段。

---

## Q14. 表格怎么写得语义化？

**直接回答：**

> 用 `caption` 写标题，`thead/tbody/tfoot` 分组，`th` 写表头并加 `scope="col/row"`，数据行用 `td`。表格只用于展示数据，不用来做页面布局。

**追问 1：`scope` 有什么用？**

> 帮助读屏软件理解表头对应哪一行/列，提升无障碍体验。

**追问 2：为什么不用 table 布局？**

> 结构僵硬、响应式麻烦、可访问性差、渲染性能不如 Flex/Grid；现代布局用 Flex/Grid。

**陷阱/加分：**

- `caption` 不是 `title`，它是表格内的标题。
- 合并单元格用 `colspan/rowspan`，但别过度使用。

---

## Q15. 移动端 HTML 有哪些注意点？

**直接回答：**

> 要写 viewport；输入框字体至少 16px；数字输入用 `type="tel"` + `inputmode`；图片写宽高避免抖动；底部适配安全区；点击区域至少 44x44；避免用 hover 才显示关键信息。

**追问 1：300ms 点击延迟还存在吗？**

> 现代浏览器设置 viewport 后基本没有了；复杂手势可以用 `touch-action` 控制，滚动监听加 `passive: true`。

**追问 2：怎么避免移动端点击高亮？**

> `-webkit-tap-highlight-color: transparent;`，但不要因此去掉所有点击反馈，仍要有 `:active` 状态。

**陷阱/加分：**

- 移动端没有 hover，交互要有触摸反馈。
- 输入框聚焦时键盘可能遮挡，要用 `scrollIntoView` 或调整布局。

---

## Q16. `<!DOCTYPE html>` 有什么用？

**直接回答：**

> 告诉浏览器用 HTML5 标准模式渲染。不写会进入怪异模式（quirks mode），盒模型、行高等计算可能和标准不一致。

**追问 1：怪异模式有什么影响？**

> 比如盒模型计算、百分比高度、行内元素尺寸等行为可能不同，容易出现跨浏览器不一致。

**追问 2：HTML5 的 doctype 为什么这么短？**

> HTML5 不再依赖 DTD 引用，`<!DOCTYPE html>` 就够浏览器识别标准模式，简洁且向后兼容。

**陷阱/加分：**

- doctype 必须放在文档最前面。
- 现代项目很少遇到怪异模式，但老页面/邮件模板要注意。

---

## Q17. SEO 相关有哪些 HTML 要点？

**直接回答：**

> 语义化标签、唯一的 `h1`、合理的标题层级、`title` 和 `meta description`、图片 `alt`、可爬取的链接、结构化数据（JSON-LD）、合理的 URL 和 `canonical`。

**追问 1：`title` 和 `h1` 的区别？**

> `title` 是浏览器标签页/搜索结果的标题；`h1` 是页面内容的主标题。两者都重要，但不要堆关键词。

**追问 2：SPA 对 SEO 有什么影响？**

> 纯客户端渲染的首屏 HTML 可能没有内容，爬虫不一定执行 JS；需要 SSR/SSG 或预渲染。

**陷阱/加分：**

- `meta keywords` 现在基本没用。
- 移动端友好、加载速度、结构化数据也会影响搜索表现。

---

## 18. 快速自测

- [ ] 能用 1 分钟说清语义化和好处。
- [ ] 能区分 `defer/async` 和两个加载事件。
- [ ] 能说出 viewport 四个参数。
- [ ] 能写一个带校验和防重复提交的表单。
- [ ] 能解释从 HTML 到 DOM 的流程。
- [ ] 能说出 iframe 的安全风险。
- [ ] 能说出 5 个移动端 HTML 坑。
