# 02 · CSS 面试问答分册

> 对应知识文档：[02-CSS布局与移动端适配.md](../02-CSS布局与移动端适配.md)
>
> 用法：先自己答，再看“直接回答”；追问遮住答案练。

---

## Q1. 盒模型是什么？`content-box` 和 `border-box` 的区别？

**直接回答：**

> 盒模型由 content、padding、border、margin 四部分组成。`content-box` 的 width 只算内容，padding 和 border 会额外增加总尺寸；`border-box` 的 width 包含 content + padding + border，布局更可控。项目里通常全局设置 `box-sizing: border-box`。

**追问 1：实际占宽怎么算？**

> `content-box`：width + padding-left/right + border-left/right。`border-box`：就是 width，padding 和 border 从内容区里扣。

**追问 2：`margin` 的百分比相对谁？**

> 相对包含块的**宽度**，上下 margin 的百分比也相对宽度，不是高度。

**陷阱/加分：**

- `box-sizing` 不影响 margin。
- 行内元素的宽高和垂直 margin 行为不同。

---

## Q2. CSS 优先级怎么计算？

**直接回答：**

> 从高到低：`!important` > 行内样式 > ID > 类/属性/伪类 > 元素/伪元素 > 通配符。权重可以简化成 1000/100/10/1。优先级相同则后写的覆盖先写的。

**追问 1：`:where()` 和 `:is()` 的优先级？**

> `:where()` 内部优先级为 0；`:is()`、`:not()` 取参数中最高优先级的那个。

**追问 2：`@layer` 怎么影响优先级？**

> 层叠层里，后声明的层优先；未分层的普通样式优先于分层样式。它适合做样式重置/第三方样式隔离。

**陷阱/加分：**

- `!important` 会反转层叠顺序，尽量别用。
- 选择器写得越深不代表优先级越高，关键看类型。

---

## Q3. BFC 是什么？能解决什么问题？

**直接回答：**

> BFC 是块级格式化上下文，一个独立的布局区域，内部元素不会影响外部。触发方式有 `display: flow-root`、`overflow: hidden`、`float`、`position: absolute/fixed`、`display: flex/grid` 等。它能清除浮动、防止 margin 塌陷、阻止元素被浮动覆盖。

**追问 1：为什么推荐 `display: flow-root`？**

> 它专门用来创建 BFC，没有 `overflow: hidden` 裁剪内容、`float` 改变布局的副作用。

**追问 2：BFC 和层叠上下文是一回事吗？**

> 不是。BFC 管布局（浮动、margin），层叠上下文管绘制顺序（z-index）。两者可能由同一属性触发，但概念不同。

**陷阱/加分：**

- `overflow: hidden` 会裁剪溢出内容，做 BFC 时要注意。
- Flex/Grid 子项不会发生 margin 塌陷。

---

## Q4. 水平垂直居中有几种写法？

**直接回答：**

> 常用四种：Flex 的 `align-items: center; justify-content: center`；Grid 的 `place-items: center`；绝对定位 + `top/left: 50%` + `translate(-50%, -50%)`；绝对定位 + `inset: 0` + `margin: auto`（需要固定宽高）。单行文本还可以 `line-height` + `text-align`。

**追问 1：不定宽高怎么做？**

> Flex、Grid、绝对定位 + transform 都支持不定宽高；`margin: auto` 方案需要固定宽高。

**追问 2：绝对定位居中相对谁？**

> 相对最近的非 static 祖先；没有就相对初始包含块。

**陷阱/加分：**

- `transform: translate(-50%, -50%)` 的百分比相对自身尺寸。
- 移动端优先用 Flex/Grid，代码更少。

---

## Q5. `flex: 1` 是什么？为什么省略号要加 `min-width: 0`？

**直接回答：**

> `flex: 1` 等价于 `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`，表示按比例等分剩余空间。Flex 子项默认 `min-width: auto`，内容会把宽度撑开，导致 `overflow: hidden` 没有生效空间；加 `min-width: 0` 才能让子项收缩并出现省略号。

**追问 1：`flex: auto` 和 `flex: none` 呢？**

> `flex: auto` 是 `1 1 auto`，按内容大小伸缩；`flex: none` 是 `0 0 auto`，不伸不缩。

**追问 2：`flex: 1` 为什么有时不等分？**

> 子项内容宽度不同且没有 `min-width: 0` 时，`min-width: auto` 会阻止收缩，看起来就不等分。

**陷阱/加分：**

- 文本省略三件套：`overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`。
- Flex 子项里的图片/长单词也可能撑破布局。

---

## Q6. Flex 和 Grid 的区别？怎么选？

**直接回答：**

> Flex 是一维布局，主要解决一行或一列的排列；Grid 是二维布局，可以同时控制行和列。简单排列用 Flex，复杂网格用 Grid，两者可以嵌套。

**追问 1：Grid 的 `auto-fit` 和 `auto-fill` 区别？**

> `auto-fit` 会拉伸已有列填满剩余空间；`auto-fill` 会保留空列，不拉伸。响应式卡片常用 `repeat(auto-fit, minmax(160px, 1fr))`。

**追问 2：整页布局用哪个？**

> 整页三行/两列更适合 Grid；卡片内部、导航、按钮组用 Flex。

**陷阱/加分：**

- Grid 的 `fr` 是剩余空间份数，不是百分比。
- Grid 子项可以重叠（同一单元格），适合做复杂封面。

---

## Q7. `position` 有哪些值？分别相对谁定位？

**直接回答：**

> `static` 默认；`relative` 相对自身原位置；`absolute` 相对最近的非 static 祖先；`fixed` 相对视口；`sticky` 相对最近滚动容器，滚动到阈值后粘住。

**追问 1：父元素有 `transform`，`fixed` 还相对视口吗？**

> 不。`transform` 会让父元素成为包含块，`fixed` 子元素相对它定位，这是常见的“固定定位失效”原因。

**追问 2：`sticky` 为什么没效果？**

> 常见原因：没有设置 `top/bottom/left/right`；祖先有 `overflow: hidden/auto`；父容器高度不够；sticky 元素没有可粘的空间。

**陷阱/加分：**

- `absolute` 脱离文档流，不占原空间。
- `relative` 不脱离文档流，原位置仍保留。

---

## Q8. `z-index` 为什么失效？

**直接回答：**

> `z-index` 只对定位元素（relative/absolute/fixed/sticky）或 flex/grid 子项生效；而且只在同一层叠上下文内比较。父元素如果有 `transform`、`opacity < 1`、`filter`、`will-change` 等，会创建新的层叠上下文，子元素的 `z-index` 再大也跳不出父级。

**追问 1：哪些属性会创建层叠上下文？**

> 根元素、定位 + z-index、fixed/sticky、opacity < 1、transform/filter/perspective、isolation: isolate、flex/grid 子项且 z-index 不为 auto 等。

**追问 2：弹窗被父级遮挡怎么解决？**

> 把弹窗挂到 `body`（React Portal / Vue Teleport），或移除父级的 transform/opacity，或调整 DOM 层级。

**陷阱/加分：**

- `z-index` 不是全局排序，是层叠上下文内的排序。
- 不要用 `z-index: 9999` 硬压，先找层叠上下文。

---

## Q9. 移动端适配有哪些方案？

**直接回答：**

> 常见有 viewport + rem、vw、媒体查询、Flex/Grid + 百分比。rem 根据屏幕宽度动态设置根字号，设计稿 px / 100 = rem；vw 是屏幕宽度的 1%，配合 PostCSS 自动转换；媒体查询按断点调整布局。再配合安全区、1px、`100dvh`、图片 `srcset`。

**追问 1：750 设计稿的 rem 怎么算？**

> 常用 `1rem = 屏幕宽度 / 7.5`，设计稿 100px 写成 1rem。也可以用 PostCSS 插件自动把 px 转 rem/vw。

**追问 2：rem 和 vw 怎么选？**

> rem 兼容性好、需要 JS 或插件设置根字号；vw 更现代、纯 CSS，但极端宽屏要注意最大宽度。新项目可以优先 vw + `clamp()`。

**陷阱/加分：**

- 不要写死 375px 宽度。
- 字号不要用 vw 无限制缩放，要设上下限。
- `100vh` 在移动端会被地址栏影响，优先 `100dvh`。

---

## Q10. 移动端 1px 边框怎么处理？

**直接回答：**

> 高清屏上 1 CSS 像素会被放大成多个物理像素，看起来偏粗。常用方案是用伪元素画 1px 高的线，再用 `transform: scaleY(0.5)`（DPR=2）或 `scaleY(0.3333)`（DPR=3）缩放。

**追问 1：四条边框怎么写？**

> 伪元素 `inset: 0`，设置 `border: 1px solid`，再 `transform: scale(0.5)`，`transform-origin: 0 0`，并加 `pointer-events: none` 防止影响点击。

**追问 2：还有其他方案吗？**

> `box-shadow`、`border-image`、`0.5px`；但 `0.5px` 在部分 Android 上表现不一致，transform 方案更稳定。

**陷阱/加分：**

- 伪元素要加 `content: ""`。
- 圆角要用 `border-radius: inherit`，否则边框和圆角对不上。

---

## Q11. 移动端安全区怎么适配？

**直接回答：**

> 先在 viewport 加 `viewport-fit=cover`，然后用 `env(safe-area-inset-top/right/bottom/left)` 给页面或固定底栏加 padding，避免内容被刘海、圆角、底部小白条遮挡。

**追问 1：`constant()` 和 `env()` 的区别？**

> `constant()` 是 iOS 11 早期写法，`env()` 是新标准；通常两个都写，后者覆盖前者。

**追问 2：底部固定导航怎么做？**

> `position: fixed; bottom: 0; padding-bottom: env(safe-area-inset-bottom);`，页面内容再留出同样高度的 padding，避免被遮挡。

**陷阱/加分：**

- 只有 `viewport-fit=cover` 时安全区变量才生效。
- Android 的刘海/手势区也要测。

---

## Q12. 重排和重绘的区别？怎么优化？

**直接回答：**

> 重排是几何属性变化，浏览器要重新计算布局，代价高；重绘是颜色等外观变化，不改变布局。优化方式：批量修改样式、先读后写、用 class 切换、动画用 `transform/opacity`、图片写宽高、长列表虚拟滚动、避免频繁读取 `offsetWidth` 等布局属性。

**追问 1：哪些操作会强制同步布局？**

> 读取 `offsetWidth/offsetHeight/getBoundingClientRect/scrollTop`，然后马上修改样式，会强制浏览器立即布局。

**追问 2：为什么 `transform` 动画性能好？**

> 它可以只触发合成阶段，由 GPU 处理，不引起重排重绘。

**陷阱/加分：**

- 读取布局属性本身不一定慢，慢的是“读-写-读-写”交替。
- `will-change` 不要滥用，占显存。

---

## Q13. `display: none`、`visibility: hidden`、`opacity: 0` 的区别？

**直接回答：**

> `display: none` 不渲染、不占位、不可交互、读屏不可见；`visibility: hidden` 占位但不可见、不可交互；`opacity: 0` 占位、不可见，但仍然可以点击，也会被读屏读到。

**追问 1：想做淡入淡出用哪个？**

> 用 `opacity` + `transition`，或 `visibility` 配合 transition；不要用 `display` 做过渡，它不连续。

**追问 2：想视觉隐藏但保留无障碍呢？**

> 用 `position: absolute; left: -9999px` 或 `clip-path: inset(50%)`，不要用 `display: none`。

**陷阱/加分：**

- `opacity: 0` 的元素仍然能挡住点击。
- `visibility: hidden` 的子元素可以设 `visibility: visible` 显示。

---

## Q14. `margin` 塌陷是什么？怎么解决？

**直接回答：**

> 相邻兄弟的上下 margin 会合并取较大值；父子之间在没有 border/padding/BFC 时，子元素的 margin 会穿透到父元素外。解决：父元素触发 BFC（`display: flow-root`）、加 padding/border，或改用 Flex/Grid。

**追问 1：为什么 Flex 子项不会塌陷？**

> Flex 容器建立了新的格式化上下文，子项的 margin 不会和父级/兄弟发生普通块布局的塌陷。

**追问 2：空元素也会塌陷吗？**

> 会。空块元素自己的上下 margin 也会合并。

**陷阱/加分：**

- 塌陷只发生在普通块的垂直方向，水平 margin 不塌陷。
- `overflow: hidden` 也能解决，但可能裁剪内容。

---

## Q15. 伪类和伪元素的区别？

**直接回答：**

> 伪类是元素在某种状态下的选择，比如 `:hover`、`:focus`、`:nth-child`；伪元素是创建一个虚拟的子元素，比如 `::before`、`::after`、`::first-line`。伪元素必须写 `content` 才会显示。

**追问 1：`::before` 和 `:before` 有什么区别？**

> 单冒号是 CSS2 的旧写法，双冒号是 CSS3 区分伪元素的标准写法；现代代码用双冒号。

**追问 2：`:has()` 有什么用？**

> 可以根据子元素反选父元素，比如 `.card:has(.active)`；现代浏览器支持，老项目要注意兼容。

**陷阱/加分：**

- 伪元素默认是行内元素，要设 `display` 才能控制宽高。
- 伪元素不影响 DOM，读屏一般不读。

---

## Q16. CSS 动画为什么优先用 `transform` 和 `opacity`？

**直接回答：**

> 它们可以只触发合成阶段，由 GPU 处理，不引起重排重绘；而 `width/height/top/left` 会触发布局，性能差很多。

**追问 1：`will-change` 怎么用？**

> 可以提前告诉浏览器元素会变化，比如 `will-change: transform`，但不要滥用，用完最好移除，否则占显存。

**追问 2：动画卡顿怎么排查？**

> 用 Chrome Performance 录制，看主线程长任务、Layout/Paint 耗时、是否掉帧；优先减少布局和绘制，必要时用 `transform` 提升合成层。

**陷阱/加分：**

- `transform` 会创建层叠上下文/包含块，可能影响 fixed 定位。
- 尊重 `prefers-reduced-motion`。

---

## Q17. 响应式怎么做？移动优先是什么意思？

**直接回答：**

> 用媒体查询、百分比、Flex/Grid、`auto-fit` 等，让布局随屏幕宽度变化。移动优先是先写小屏样式，再用 `min-width` 逐步增强大屏，避免覆盖来覆盖去。

**追问 1：断点怎么定？**

> 按内容和设计稿定，不迷信固定值；常见 640/768/1024/1200。关键是内容什么时候需要换行/变列。

**追问 2：容器查询是什么？**

> 根据父容器宽度而不是视口宽度改样式，适合组件库；`container-type: inline-size` + `@container`。

**陷阱/加分：**

- 移动优先用 `min-width`，桌面优先用 `max-width`。
- 响应式不只是宽度，还要考虑横屏、字体缩放、安全区。

---

## Q18. CSS 变量、Sass、CSS Modules、Tailwind 怎么选？

**直接回答：**

> CSS 变量适合主题/运行时切换；Sass 提供变量、嵌套、mixin，适合组件库/老项目；CSS Modules 做局部作用域，适合 React；Tailwind 用原子类快速写样式，适合中小项目和快速迭代。

**追问 1：CSS 变量和 Sass 变量的区别？**

> Sass 变量编译时替换，不能运行时改；CSS 变量是运行时值，可以用 JS 修改，支持级联和继承。

**追问 2：CSS Modules 的原理？**

> 构建时把类名编译成哈希，组件里通过 `styles.xxx` 引用，避免全局冲突。

**陷阱/加分：**

- Sass 嵌套不要太深，编译后选择器很长。
- Tailwind 的 HTML 类名很长，团队要统一规范。

---

## Q19. 多行省略和 Flex 省略号怎么写？

**直接回答：**

> 单行：`overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`。多行：`display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;`。在 Flex 子项里，必须加 `min-width: 0`，否则内容撑开，省略号不生效。

**追问 1：`line-clamp` 兼容性怎么样？**

> 现代浏览器基本支持 `-webkit-line-clamp`，但它是 WebKit 前缀；生产项目要测目标浏览器。

**追问 2：为什么 `min-width: 0` 能解决？**

> Flex 子项默认 `min-width: auto`，不会小于内容最小宽度；设 0 后允许收缩，`overflow: hidden` 才有空间。

**陷阱/加分：**

- 多行省略需要固定宽度/最大宽度。
- 按钮文字省略要同时设 `max-width`。

---

## Q20. CSS 选择器性能要注意什么？

**直接回答：**

> 现代浏览器选择器性能通常不是瓶颈，但要注意避免过深嵌套、通配符大范围匹配、在组件里用标签/ID 选择器；优先用类选择器，命名清晰，减少不必要的 `!important`。

**追问 1：为什么组件里不建议用标签选择器？**

> 样式容易互相影响，复用和隔离差；小程序/Shadow DOM 里标签选择器还可能不生效。

**追问 2：样式冲突怎么排查？**

> DevTools 看 Elements → Styles，划掉的规则就是被更高优先级覆盖；再看 Computed 的最终值。

**陷阱/加分：**

- “选择器性能”远不如“重排重绘/图片/JS”影响大。
- 真正影响维护的是命名和层级，不是选择器长度。

---

## 21. 快速自测

- [ ] 能画出盒模型并算实际占宽。
- [ ] 能说出优先级和 `:where/:is` 的特殊规则。
- [ ] 能解释 BFC 的触发和用途。
- [ ] 能默写 4 种居中。
- [ ] 能解释 `flex: 1` 和 `min-width: 0`。
- [ ] 能解释 z-index 失效的层叠上下文原因。
- [ ] 能说出移动端适配、1px、安全区方案。
- [ ] 能说出重排/重绘的区别和优化。
- [ ] 能写单行/多行省略。
- [ ] 能说出动画为什么用 transform。
