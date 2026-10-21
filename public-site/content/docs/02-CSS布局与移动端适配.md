# 02 · CSS 布局与移动端适配

> 目标：能把设计稿还原成移动端页面；理解盒模型、Flex/Grid、定位、层叠、适配和渲染性能。
>
> 标记：⭐⭐⭐ 必须会｜⭐⭐ 要理解｜⭐ 了解即可

---

## 1. CSS 是什么、怎么写

CSS（Cascading Style Sheets，层叠样式表）负责页面的**表现**。

三种写法：

```html
<!-- 1. 外部样式（推荐） -->
<link rel="stylesheet" href="./style.css" />

<!-- 2. 内部样式 -->
<style>
  .box { color: red; }
</style>

<!-- 3. 行内样式（优先级高，难维护，少用） -->
<div style="color: red;">内容</div>
```

一条 CSS 规则：

```css
/* 选择器 { 属性: 值; } */
.title {
  color: #1f1f1f;
  font-size: 18px;
}
```

---

## 2. 层叠与优先级 ⭐⭐⭐

同一个元素被多条规则命中时，浏览器按下面的顺序决定谁生效：

1. **重要性**：`!important` > 普通。
2. **来源**：用户代理样式（浏览器默认）< 作者样式（你写的）< 用户样式（无障碍设置）。
3. **层叠层**：`@layer` 中，后声明的层优先；未分层的普通样式优先于分层样式。
4. **优先级（Specificity）**。
5. **书写顺序**：优先级相同，后写的覆盖先写的。

### 2.1 优先级怎么算

| 类型 | 权重（简化） | 例子 |
|---|---|---|
| 行内样式 | 1000 | `style="color:red"` |
| ID | 100 | `#app` |
| 类 / 属性 / 伪类 | 10 | `.card`、`[type="text"]`、`:hover` |
| 元素 / 伪元素 | 1 | `div`、`::before` |
| 通配符 / 组合符 | 0 | `*`、`>`、空格 |

```css
/* 0-0-1-0：一个类 */
.card { color: blue; }

/* 0-0-2-0：两个类，胜出 */
.list .card { color: green; }

/* 0-1-0-0：ID，胜出 */
#main .card { color: red; }
```

特例：

- `:where(...)` 内部优先级为 0。
- `:is(...)`、`:not(...)` 取参数中**最高**的优先级。
- `!important` 会反转层叠顺序，尽量别用。

### 2.2 怎么避免优先级战争

- 用类选择器，不用 ID 写样式。
- 层级扁平，命名清晰（BEM）。
- 不滥用 `!important`。
- 用 CSS Modules / scoped 样式隔离。

```css
/* BEM：block__element--modifier */
.card {}
.card__title {}
.card--active {}
```

---

## 3. 盒模型 ⭐⭐⭐

每个元素都是一个盒子：

```text
┌──────────────────────────────┐
│           margin             │
│  ┌────────────────────────┐  │
│  │        border          │  │
│  │  ┌──────────────────┐  │  │
│  │  │     padding      │  │  │
│  │  │  ┌────────────┐  │  │  │
│  │  │  │  content   │  │  │  │
│  │  │  └────────────┘  │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

```css
/* 标准盒模型：width 只算 content */
.box {
  box-sizing: content-box;
  width: 100px;
  padding: 10px;
  border: 2px solid #000;
}
/* 实际占宽 = 100 + 10*2 + 2*2 = 124px */

/* IE 盒模型：width 包含 content + padding + border */
.box {
  box-sizing: border-box;
  width: 100px;
  padding: 10px;
  border: 2px solid #000;
}
/* 实际占宽 = 100px，内容区被压缩 */
```

**项目里几乎都会写：**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

### 3.1 margin 塌陷 ⭐⭐

**相邻兄弟**的上下 margin 会合并，取较大值：

```css
.a { margin-bottom: 20px; }
.b { margin-top: 30px; }
/* 两者间距是 30px，不是 50px */
```

**父子**之间：父元素没有 border/padding/overflow/BFC 时，子元素的 margin-top 会“穿透”到父元素外面。

```css
.parent { /* 没有 border/padding */ }
.child { margin-top: 20px; } /* 父元素被一起推下去 */
```

解决：

- 父元素加 `padding-top` 或 `border-top`。
- 父元素加 `overflow: hidden` 或 `display: flow-root`（触发 BFC）。
- 用 Flex/Grid 布局（不会塌陷）。

### 3.2 `box-sizing` 面试答法

`content-box` 的 width 只包含内容，padding 和 border 会额外增加尺寸；`border-box` 的 width 包含 padding 和 border，布局更可控。项目里通常全局设为 `border-box`。

---

## 4. display ⭐⭐⭐

| 值 | 特点 |
|---|---|
| `block` | 独占一行，可设宽高，默认宽度撑满父级 |
| `inline` | 不独占一行，宽高失效，垂直 padding/margin 不影响布局 |
| `inline-block` | 不独占一行，可设宽高，底部可能有基线空隙 |
| `none` | 不渲染，不占空间 |
| `flex` | 弹性布局容器 |
| `grid` | 网格布局容器 |
| `flow-root` | 触发 BFC 的块级容器 |

### 隐藏元素的几种方式

| 写法 | 占空间 | 可交互 | 读屏 | 场景 |
|---|---|---|---|---|
| `display: none` | 否 | 否 | 否 | 彻底隐藏 |
| `visibility: hidden` | 是 | 否 | 否 | 保留占位 |
| `opacity: 0` | 是 | **是** | 是 | 做动画/遮罩 |
| `position: absolute; left: -9999px` | 否 | 可聚焦 | 是 | 视觉隐藏但保留无障碍 |
| `clip-path: inset(50%)` | 否 | 可聚焦 | 是 | 同上，更现代 |

> `opacity: 0` 的元素仍然能点击，做“消失但可点”的按钮时要小心。

---

## 5. 定位与 z-index ⭐⭐⭐

```css
.box {
  position: static;   /* 默认，不定位 */
  position: relative; /* 相对自身原位置偏移，仍占原空间 */
  position: absolute; /* 相对最近的定位祖先偏移，脱离文档流 */
  position: fixed;    /* 相对视口固定，脱离文档流 */
  position: sticky;   /* 滚动到阈值后“粘住” */
  top: 10px;
  left: 20px;
  z-index: 10;
}
```

### 5.1 定位参照谁

- `relative`：相对**自己原来的位置**。
- `absolute`：相对**最近的 position 不为 static 的祖先**；没有就相对初始包含块（视口）。
- `fixed`：相对**视口**（有 transform 的祖先会改变参照）。
- `sticky`：相对**最近的滚动容器**，需要设置 `top/bottom/left/right` 之一。

```css
/* 子元素铺满父元素 */
.parent { position: relative; }
.mask {
  position: absolute;
  inset: 0; /* 等价于 top/right/bottom/left 都为 0 */
  background: rgba(0, 0, 0, 0.5);
}

/* 底部固定导航 */
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

/* 吸顶头部 */
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}
```

### 5.2 z-index 为什么失效 ⭐⭐

`z-index` 只对**定位元素**（relative/absolute/fixed/sticky）或 **flex/grid 子项**生效。

即使生效，它也只在同一**层叠上下文（stacking context）**内比较。以下情况会创建新的层叠上下文：

- 根元素 `<html>`。
- `position` 为 relative/absolute 且 `z-index` 不为 auto。
- `position: fixed` / `sticky`。
- `opacity < 1`。
- `transform`、`filter`、`perspective`、`backdrop-filter` 不为 none。
- `will-change` 指定了上述属性。
- `isolation: isolate`。
- flex/grid 子项且 `z-index` 不为 auto。

**典型 bug**：父元素有 `transform`，子元素 `z-index: 9999` 也盖不过外面的元素，因为父元素创建了层叠上下文，子元素只在父级内部比较。

---

## 6. Flex 布局 ⭐⭐⭐

Flex 是移动端最常用的布局方式。

```css
.container {
  display: flex;
  flex-direction: row;        /* 主轴方向：row | column */
  flex-wrap: nowrap;          /* 是否换行：nowrap | wrap */
  justify-content: flex-start;/* 主轴对齐 */
  align-items: stretch;       /* 交叉轴对齐 */
  align-content: flex-start;  /* 多行时的交叉轴对齐 */
  gap: 12px;                  /* 子项间距 */
}
```

### 6.1 容器属性

| 属性 | 常用值 | 作用 |
|---|---|---|
| `flex-direction` | row / column / row-reverse / column-reverse | 主轴方向 |
| `flex-wrap` | nowrap / wrap / wrap-reverse | 是否换行 |
| `justify-content` | flex-start / center / space-between / space-around / space-evenly | 主轴排列 |
| `align-items` | stretch / center / flex-start / flex-end / baseline | 单行交叉轴 |
| `align-content` | 同 justify-content | 多行交叉轴 |
| `gap` | 8px / 12px | 行列间距 |

### 6.2 子项属性

| 属性 | 作用 |
|---|---|
| `flex-grow` | 剩余空间如何放大，默认 0 |
| `flex-shrink` | 空间不足如何缩小，默认 1 |
| `flex-basis` | 初始主轴尺寸，默认 auto |
| `flex` | 上面三个的简写 |
| `align-self` | 单独覆盖 align-items |
| `order` | 排列顺序，默认 0 |

简写含义：

```css
.item1 { flex: 1; }      /* 1 1 0%：等分剩余空间 */
.item2 { flex: auto; }   /* 1 1 auto：按内容大小伸缩 */
.item3 { flex: none; }   /* 0 0 auto：不伸不缩 */
.item4 { flex: 0 0 100px; } /* 固定 100px，不伸不缩 */
```

### 6.3 必背布局代码

```css
/* 1. 水平垂直居中 */
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 2. 两端对齐 */
.between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 3. 左侧固定，右侧自适应 */
.row {
  display: flex;
  align-items: center;
}
.row__left { width: 80px; flex-shrink: 0; }
.row__right { flex: 1; min-width: 0; } /* min-width:0 防止内容撑破 */

/* 4. 单行文本省略号 */
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 5. Flex 子项里的省略号：必须 min-width: 0 */
.ellipsis-item {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 6. 多行文本省略 */
.clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 7. 顶部固定 + 中间滚动 + 底部固定 */
.page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}
.page__header { flex-shrink: 0; }
.page__body { flex: 1; overflow-y: auto; }
.page__footer { flex-shrink: 0; }

/* 8. 标签自动换行 */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 9. 子项被内容撑开的经典问题：加 min-width: 0 */
```

### 6.4 Flex 常见坑

- **子项无法省略号**：Flex 子项默认 `min-width: auto`，内容会把宽度撑开。加 `min-width: 0`。
- **垂直居中失效**：父元素没有高度；`align-items: center` 需要交叉轴有空间。
- **`flex: 1` 不能等分**：子项内容宽度不同时，`flex: 1` 仍按内容比例？不会，`flex-basis: 0%` 会等分，但如果内容 `min-width: auto` 阻止收缩，就会不等分。加 `min-width: 0`。
- **`gap` 兼容性**：现代浏览器和 RN 新版本都支持，老项目可能用 margin。

---

## 7. Grid 布局 ⭐⭐

适合二维布局：商品网格、仪表盘、表单。

```css
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 两列等宽 */
  gap: 12px;
}

/* 响应式：自动换列，每列最小 160px */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

/* 三行布局：头部固定、中间自适应、底部固定 */
.layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}

/* 指定区域 */
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr auto;
}
.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
```

### Flex vs Grid 怎么选

| 场景 | 选择 |
|---|---|
| 一维排列（一行/一列） | Flex |
| 二维网格 | Grid |
| 导航、按钮组、卡片内部 | Flex |
| 商品列表、仪表盘、整页布局 | Grid |
| 需要子项对齐到网格线 | Grid |

---

## 8. 单位、颜色、函数

### 8.1 单位

| 单位 | 含义 | 场景 |
|---|---|---|
| `px` | CSS 像素 | 边框、固定尺寸 |
| `%` | 相对父元素 | 宽高 |
| `em` | 相对当前元素 font-size | 组件内间距 |
| `rem` | 相对根元素 font-size | 移动端适配 |
| `vw` / `vh` | 视口宽/高的 1% | 全屏、适配 |
| `dvh` / `svh` / `lvh` | 动态/小/大视口高度 | 移动端全屏 |
| `fr` | Grid 剩余空间份数 | Grid |
| `ch` | 字符宽度 | 文本宽度 |
| `rpx` | 小程序单位，750rpx = 屏幕宽 | 小程序 |

> 移动端 `100vh` 会被浏览器地址栏影响，导致内容被挡。优先用 `100dvh`，并给旧浏览器 fallback：
> ```css
> .page { height: 100vh; height: 100dvh; }
> ```

### 8.2 颜色

```css
.box {
  color: #1f1f1f;                 /* hex */
  color: rgb(31 31 31);           /* rgb */
  color: rgba(31, 31, 31, 0.8);   /* 带透明度 */
  color: hsl(0 0% 12%);           /* 色相/饱和度/亮度 */
  color: transparent;             /* 透明 */
  color: currentColor;            /* 跟随 color */
}
```

### 8.3 常用函数

```css
.box {
  width: calc(100% - 32px);
  width: min(100%, 720px);
  width: max(320px, 50%);
  font-size: clamp(14px, 4vw, 20px); /* 最小 14，理想 4vw，最大 20 */
}
```

CSS 变量：

```css
:root {
  --brand: #07c160;
  --radius: 12px;
  --space: 16px;
}

.card {
  color: var(--brand);
  border-radius: var(--radius);
  padding: var(--space);
  /* 第二个参数是 fallback */
  margin: var(--space-lg, 24px);
}
```

---

## 9. 移动端适配 ⭐⭐⭐

### 9.1 第一步：viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 9.2 方案一：rem（传统，兼容好）

以 750px 设计稿为例：

```js
// 1rem = 屏幕宽度 / 7.5
// 750 设计稿上 100px 的元素，写成 1rem
function setRem() {
  const width = Math.min(document.documentElement.clientWidth, 750);
  document.documentElement.style.fontSize = width / 7.5 + 'px';
}
setRem();
window.addEventListener('resize', setRem);
```

```css
.card {
  width: 3.4rem;   /* 设计稿 340px */
  padding: 0.24rem; /* 设计稿 24px */
}
```

### 9.3 方案二：vw（更现代）

```css
/* 750 设计稿：1px = 100vw / 750 */
.card {
  width: 45.33vw;  /* 340px */
  padding: 3.2vw;  /* 24px */
}
```

或者用 PostCSS 插件自动转换：

```bash
npm i -D postcss-px-to-viewport-8-plugin
```

```js
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-px-to-viewport-8-plugin': {
      viewportWidth: 750, // 设计稿宽度
      unitPrecision: 5,
      viewportUnit: 'vw',
      selectorBlackList: ['.ignore-'],
      minPixelValue: 1,
      mediaQuery: false,
    },
  },
};
```

### 9.4 方案三：媒体查询（响应式）

```css
/* 移动优先：先写小屏，再逐步增强 */
.card { width: 100%; }

@media (min-width: 768px) {
  .card { width: 50%; }
}

@media (min-width: 1200px) {
  .card { width: 25%; }
}
```

### 9.5 1px 边框问题 ⭐⭐⭐

设计稿上的 1px，在高清屏（DPR = 2/3）上如果直接写 `border: 1px`，会显示成 2/3 个物理像素，看起来偏粗。

解决方案：用伪元素画 1px，再缩放。

```css
.hairline {
  position: relative;
}

.hairline::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: #e5e5e5;
  transform: scaleY(0.5); /* DPR=2 时缩一半 */
  transform-origin: 0 100%;
}

/* DPR=3 时缩 1/3 */
@media (-webkit-min-device-pixel-ratio: 3) {
  .hairline::after {
    transform: scaleY(0.3333);
  }
}

/* 四条边框的版本 */
.hairline-all::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid #e5e5e5;
  border-radius: inherit;
  transform: scale(0.5);
  transform-origin: 0 0;
  pointer-events: none; /* 不影响点击 */
}
```

### 9.6 安全区（刘海屏/底部小白条） ⭐⭐

```css
.tabbar {
  padding-bottom: constant(safe-area-inset-bottom); /* iOS 11 旧写法 */
  padding-bottom: env(safe-area-inset-bottom);      /* 新写法 */
}

.page {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

需要 `viewport-fit=cover` 才生效。

### 9.7 移动端其他坑

| 问题 | 解决 |
|---|---|
| 点击高亮蓝框 | `-webkit-tap-highlight-color: transparent;` |
| 长按复制 | `-webkit-user-select: none;`（按需） |
| 图片拖拽 | `-webkit-user-drag: none;` |
| 滚动卡顿 | `-webkit-overflow-scrolling: touch;`（老 iOS） |
| 输入框自动放大 | `font-size: 16px` |
| 300ms 点击延迟 | 现代浏览器加 viewport 后基本没有了；复杂手势用 `touch-action` |
| 横向滚动条 | 检查固定宽度、`100vw`、负 margin |
| 字体不统一 | 设置 `font-family` 字体栈 |
| 1px 粗 | 伪元素 + transform |
| 底部被挡 | 安全区 + padding |
| 弹窗滚动穿透 | 打开时给 body 加 `overflow: hidden`，或用 `position: fixed` |

---

## 10. 伪类与伪元素 ⭐⭐

### 10.1 伪类

```css
a:hover { color: red; }
button:active { transform: scale(0.98); }
input:focus { border-color: #07c160; }
input:focus-visible { outline: 2px solid #07c160; } /* 键盘聚焦才显示 */
li:first-child { margin-top: 0; }
li:last-child { margin-bottom: 0; }
li:nth-child(2n+1) { background: #fafafa; }
.card:not(.active) { opacity: 0.6; }
.list:has(.active) { border-color: red; } /* 现代浏览器 */
```

### 10.2 伪元素

```css
.card::before {
  content: "";
  display: block;
  width: 4px;
  height: 18px;
  background: #07c160;
}

.clearfix::after {
  content: "";
  display: block;
  clear: both;
}

/* 首行、首字母 */
p::first-line { font-weight: 600; }
p::first-letter { font-size: 24px; }

/* 选中文本 */
::selection { background: #07c160; color: #fff; }

/* 输入框 placeholder */
input::placeholder { color: #999; }
```

伪元素必须写 `content`（即使是空字符串），否则不显示。

---

## 11. 过渡与动画 ⭐⭐

### 11.1 transition

```css
.button {
  background: #07c160;
  transition: background-color 0.2s ease, transform 0.2s ease;
}
.button:hover { background: #06ad56; }
.button:active { transform: scale(0.96); }
```

### 11.2 animation

```css
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fade-up 0.3s ease-out both;
}
```

属性：

```css
animation-name: fade-up;
animation-duration: 0.3s;
animation-timing-function: ease-out;
animation-delay: 0s;
animation-iteration-count: 1;
animation-direction: normal;
animation-fill-mode: both; /* 保留首尾状态 */
animation-play-state: running;
```

简写：

```css
animation: fade-up 0.3s ease-out 0s 1 normal both;
```

### 11.3 动画性能 ⭐⭐⭐

**优先动画 `transform` 和 `opacity`**，它们可以只触发合成，不重排重绘。

```css
/* 好：GPU 合成 */
.toast { transform: translateY(100%); transition: transform 0.3s; }
.toast.show { transform: translateY(0); }

/* 差：每帧都在重排 */
.toast { bottom: -60px; transition: bottom 0.3s; }
```

其他建议：

- 不要动画 `width/height/top/left/margin`。
- `will-change: transform` 可以提前提升图层，但不要滥用（占显存）。
- 用 `transform: translateZ(0)` 强制合成层是旧技巧，现代浏览器慎用。
- 尊重用户减少动画的设置：

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. BFC ⭐⭐⭐

BFC（Block Formatting Context，块级格式化上下文）是一个**独立的布局区域**，里面的元素不会影响外面的元素。

### 12.1 如何触发 BFC

- 根元素 `<html>`。
- `float` 不为 none。
- `position: absolute/fixed`。
- `display: inline-block / flow-root / flex / grid / table-cell`。
- `overflow` 不为 visible（hidden/auto/scroll）。
- `contain: layout / paint / content`。

**最推荐 `display: flow-root`**，它专门用来创建 BFC，没有副作用。

### 12.2 BFC 能解决什么

1. **清除浮动**：父元素高度塌陷。
2. **防止 margin 塌陷**。
3. **阻止元素被浮动元素覆盖**（两栏布局）。
4. **包含内部浮动**。

```css
/* 父元素高度塌陷 */
.parent { display: flow-root; }

/* 防止 margin 穿透 */
.parent { display: flow-root; }
```

### 12.3 清除浮动的其他方式

```css
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}
```

---

## 13. 更多现代 CSS ⭐

```css
/* 宽高比：图片/视频占位，防止抖动 */
.cover {
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

/* 粘性头部 */
.header {
  position: sticky;
  top: 0;
}

/* 滚动吸附 */
.scroll-x {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.scroll-x > * {
  scroll-snap-align: start;
  flex: 0 0 80%;
}

/* 滚动条隐藏 */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }

/* 内容可见性优化：屏幕外的内容跳过渲染 */
.section {
  content-visibility: auto;
  contain-intrinsic-size: 500px; /* 估算高度，避免滚动条跳动 */
}

/* 容器查询：根据父容器宽度改样式 */
.card-container { container-type: inline-size; }
@container (min-width: 400px) {
  .card { display: flex; }
}
```

---

## 14. CSS 方案与预处理器 ⭐

### 14.1 Sass / Less

```scss
// 变量
$brand: #07c160;

// 嵌套
.card {
  padding: 16px;

  &__title {
    font-size: 18px;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

// 混入
@mixin ellipsis($lines: 1) {
  @if $lines == 1 {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  } @else {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: $lines;
    overflow: hidden;
  }
}
.title { @include ellipsis(2); }
```

### 14.2 CSS Modules

```css
/* button.module.css */
.primary { background: #07c160; }
```

```jsx
import styles from './button.module.css';

export default function Button() {
  return <button className={styles.primary}>按钮</button>;
}
```

类名会被编译成哈希，避免全局冲突。

### 14.3 原子化 CSS

Tailwind CSS：用一堆小类拼样式。

```html
<button class="px-4 py-2 rounded-full bg-green-500 text-white">按钮</button>
```

优点：不用起类名、体积可控；缺点：HTML 很长、需要熟悉类名。

### 14.4 方案怎么选

| 场景 | 推荐 |
|---|---|
| 小项目/练习 | 原生 CSS + BEM |
| React 项目 | CSS Modules / Tailwind |
| 组件库 | Sass + BEM + CSS 变量 |
| 快速页面 | Tailwind |

---

## 15. CSS 性能与底层 ⭐⭐

### 15.1 浏览器如何使用 CSS

1. 下载 CSS，解析成 CSSOM。
2. DOM + CSSOM 匹配，生成渲染树。
3. 计算每个元素的最终样式（层叠、继承、优先级）。
4. 布局（Layout）：算位置和大小。
5. 绘制（Paint）：生成绘制指令。
6. 合成（Composite）：GPU 合成图层。

### 15.2 选择器性能

现代浏览器已经很聪明，选择器性能通常不是瓶颈。但要注意：

- 避免过深嵌套（`.a .b .c .d .e`）。
- 避免通配符大范围匹配（`* { ... }` 谨慎）。
- 用类选择器，命名清晰。
- 减少不必要的 `!important`。

### 15.3 减少重排重绘

- 批量修改 DOM/样式，先读后写。
- 用 `class` 切换代替逐条改 `style`。
- 动画用 `transform/opacity`。
- 复杂动画用 `will-change` 提前提升图层（用完移除）。
- 长列表用虚拟滚动。
- 图片写宽高，避免加载后撑开布局。
- 字体加载用 `font-display: swap`，避免文字长时间不可见。

### 15.4 关键 CSS

首屏只加载关键 CSS，剩余异步加载：

```html
<link rel="preload" href="./critical.css" as="style" onload="this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="./critical.css" /></noscript>
```

工程化项目通常用工具自动提取关键 CSS，不必手写。

---

## 16. 完整示例：移动端商品列表

保存为 `goods.html`。包含：吸顶搜索、两列商品网格、1px 分割线、多行省略、底部固定导航、安全区、桌面端响应式。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>商品列表</title>

  <style>
    :root {
      --brand: #ff5000;
      --text: #222;
      --sub: #999;
      --bg: #f5f5f5;
      --card: #fff;
      --tabbar-h: 56px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      -webkit-text-size-adjust: 100%; /* 防止横屏时字体自动放大 */
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: var(--bg);
      color: var(--text);
      -webkit-tap-highlight-color: transparent; /* 去掉点击蓝色高亮 */
    }

    /* ===== 页面容器：底部给 tabbar 留空间，并适配安全区 ===== */
    .page {
      min-height: 100vh;
      min-height: 100dvh;
      padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
    }

    /* ===== 吸顶搜索栏 ===== */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px); /* 毛玻璃，部分安卓不支持则降级为半透明白 */
      border-bottom: 1px solid #eee;
    }

    .search {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 12px;
      background: #f2f2f2;
      border-radius: 18px;
    }

    .search__input {
      flex: 1;
      min-width: 0; /* 允许输入框收缩，不撑破容器 */
      height: 100%;
      font-size: 14px;
      background: transparent;
      border: none;
      outline: none;
    }

    .search__btn {
      flex-shrink: 0;
      padding: 4px 10px;
      font-size: 13px;
      color: #fff;
      background: var(--brand);
      border: none;
      border-radius: 12px;
    }

    /* ===== 分类横滑 ===== */
    .tabs {
      display: flex;
      gap: 16px;
      padding: 10px 12px;
      overflow-x: auto;
      background: #fff;
      scrollbar-width: none;
    }
    .tabs::-webkit-scrollbar { display: none; }

    .tabs__item {
      flex: 0 0 auto;
      padding-bottom: 4px;
      font-size: 14px;
      color: var(--sub);
      white-space: nowrap;
    }

    .tabs__item--active {
      color: var(--brand);
      font-weight: 600;
      border-bottom: 2px solid var(--brand);
    }

    /* ===== 商品网格：两列，自适应 ===== */
    .goods {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 10px 12px;
    }

    .goods-card {
      overflow: hidden;
      background: var(--card);
      border-radius: 10px;
    }

    /* 图片容器固定比例，图片裁切填满，避免抖动 */
    .goods-card__cover {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      display: block;
      background: #eee;
    }

    .goods-card__body {
      padding: 8px 10px 10px;
    }

    .goods-card__title {
      min-height: 40px; /* 两行高度，避免卡片高低不齐 */
      font-size: 14px;
      line-height: 20px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .goods-card__meta {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-top: 6px;
    }

    .price {
      color: var(--brand);
      font-size: 18px;
      font-weight: 700;
    }

    .price__symbol {
      font-size: 12px;
    }

    .sales {
      font-size: 12px;
      color: var(--sub);
    }

    .tag {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 6px;
      font-size: 11px;
      color: var(--brand);
      background: rgba(255, 80, 0, 0.08);
      border-radius: 4px;
    }

    /* ===== 1px 底部分割线（DPR=2 时） ===== */
    .hairline {
      position: relative;
    }
    .hairline::after {
      content: "";
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: 0;
      height: 1px;
      background: #eee;
      transform: scaleY(0.5);
      transform-origin: 0 100%;
      pointer-events: none;
    }

    /* ===== 底部固定导航 ===== */
    .tabbar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 30;
      display: flex;
      height: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
      background: rgba(255, 255, 255, 0.96);
      border-top: 1px solid #eee;
    }

    .tabbar__item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      font-size: 11px;
      color: var(--sub);
      text-decoration: none;
    }

    .tabbar__dot {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      background: #ddd;
    }

    .tabbar__item--active {
      color: var(--brand);
    }

    .tabbar__item--active .tabbar__dot {
      background: var(--brand);
    }

    /* ===== 桌面端：最多四列，内容居中 ===== */
    @media (min-width: 768px) {
      .page {
        max-width: 960px;
        margin: 0 auto;
      }

      .goods {
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }

      .tabbar {
        left: 50%;
        right: auto;
        width: min(960px, 100%);
        transform: translateX(-50%);
      }
    }
  </style>
</head>

<body>
  <div class="page">
    <!-- 吸顶搜索 -->
    <header class="topbar">
      <div class="search">
        <input class="search__input" type="search" placeholder="搜索商品" />
        <button class="search__btn" type="button">搜索</button>
      </div>
    </header>

    <!-- 横向分类 -->
    <nav class="tabs" aria-label="商品分类">
      <a class="tabs__item tabs__item--active" href="#">推荐</a>
      <a class="tabs__item" href="#">数码</a>
      <a class="tabs__item" href="#">家居</a>
      <a class="tabs__item" href="#">服饰</a>
      <a class="tabs__item" href="#">食品</a>
    </nav>

    <!-- 商品网格 -->
    <main class="goods">
      <!-- 第一张卡片 -->
      <article class="goods-card hairline">
        <img
          class="goods-card__cover"
          src="https://picsum.photos/seed/goods1/400/400"
          alt="无线蓝牙耳机"
          width="400"
          height="400"
          loading="lazy"
        />
        <div class="goods-card__body">
          <h2 class="goods-card__title">无线蓝牙耳机 降噪长续航 运动入耳式</h2>
          <div class="goods-card__meta">
            <p class="price"><span class="price__symbol">¥</span>199</p>
            <p class="sales">已售 1.2 万</p>
          </div>
          <span class="tag">包邮</span>
        </div>
      </article>

      <!-- 第二张卡片 -->
      <article class="goods-card hairline">
        <img
          class="goods-card__cover"
          src="https://picsum.photos/seed/goods2/400/400"
          alt="便携咖啡杯"
          width="400"
          height="400"
          loading="lazy"
        />
        <div class="goods-card__body">
          <h2 class="goods-card__title">便携咖啡杯 316 不锈钢 保温杯 男女同款</h2>
          <div class="goods-card__meta">
            <p class="price"><span class="price__symbol">¥</span>89</p>
            <p class="sales">已售 8600</p>
          </div>
          <span class="tag">七天无理由</span>
        </div>
      </article>

      <!-- 第三张卡片 -->
      <article class="goods-card hairline">
        <img
          class="goods-card__cover"
          src="https://picsum.photos/seed/goods3/400/400"
          alt="机械键盘"
          width="400"
          height="400"
          loading="lazy"
        />
        <div class="goods-card__body">
          <h2 class="goods-card__title">机械键盘 87 键 热插拔 客制化 RGB 背光</h2>
          <div class="goods-card__meta">
            <p class="price"><span class="price__symbol">¥</span>329</p>
            <p class="sales">已售 3200</p>
          </div>
          <span class="tag">新品</span>
        </div>
      </article>

      <!-- 第四张卡片 -->
      <article class="goods-card hairline">
        <img
          class="goods-card__cover"
          src="https://picsum.photos/seed/goods4/400/400"
          alt="桌面台灯"
          width="400"
          height="400"
          loading="lazy"
        />
        <div class="goods-card__body">
          <h2 class="goods-card__title">护眼台灯 无频闪 三档色温 学生宿舍阅读灯</h2>
          <div class="goods-card__meta">
            <p class="price"><span class="price__symbol">¥</span>129</p>
            <p class="sales">已售 5400</p>
          </div>
          <span class="tag">满减</span>
        </div>
      </article>
    </main>
  </div>

  <!-- 底部导航 -->
  <nav class="tabbar" aria-label="底部导航">
    <a class="tabbar__item tabbar__item--active" href="#">
      <span class="tabbar__dot"></span>
      <span>首页</span>
    </a>
    <a class="tabbar__item" href="#">
      <span class="tabbar__dot"></span>
      <span>分类</span>
    </a>
    <a class="tabbar__item" href="#">
      <span class="tabbar__dot"></span>
      <span>购物车</span>
    </a>
    <a class="tabbar__item" href="#">
      <span class="tabbar__dot"></span>
      <span>我的</span>
    </a>
  </nav>
</body>
</html>
```

### 这个例子用到了哪些知识点

- `box-sizing: border-box` 全局重置。
- CSS 变量管理颜色和尺寸。
- `position: sticky` 吸顶。
- `position: fixed` 底部导航。
- Grid 两列/四列响应式。
- `aspect-ratio` + `object-fit` 固定图片比例。
- `-webkit-line-clamp` 多行省略。
- Flex `min-width: 0` 让输入框正确收缩。
- 伪元素 + `transform: scaleY(0.5)` 实现 1px。
- `env(safe-area-inset-bottom)` 适配安全区。
- `100dvh` 解决移动端视口高度问题。
- `@media` 桌面端增强。
- `backdrop-filter` 毛玻璃及降级。

---

## 17. 面试高频题

### Q1：盒子模型是什么？`content-box` 和 `border-box` 的区别？ ⭐⭐⭐

**答：** 盒子由 content、padding、border、margin 组成。`content-box` 的 width 只包含内容，padding 和 border 额外增加总尺寸；`border-box` 的 width 包含 content + padding + border，布局更可控。项目里通常全局设置 `box-sizing: border-box`。

### Q2：CSS 优先级怎么计算？ ⭐⭐⭐

**答：** 从高到低：`!important` > 行内样式 > ID > 类/属性/伪类 > 元素/伪元素 > 通配符。权重可以简化成 1000/100/10/1。优先级相同则后写的覆盖先写的。`:where()` 优先级为 0，`:is()`/`:not()` 取参数最高优先级。

### Q3：BFC 是什么？能解决什么问题？ ⭐⭐⭐

**答：** BFC 是块级格式化上下文，一个独立的布局区域。触发方式有 `display: flow-root`、`overflow: hidden`、`float`、`position: absolute/fixed`、`display: flex/grid` 等。它能清除浮动、防止 margin 塌陷、阻止元素被浮动覆盖。推荐用 `display: flow-root`，没有副作用。

### Q4：水平垂直居中几种写法？ ⭐⭐⭐

**答：**

```css
/* 1. Flex */
.center { display: flex; align-items: center; justify-content: center; }

/* 2. Grid */
.center { display: grid; place-items: center; }

/* 3. 绝对定位 + transform */
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 4. 绝对定位 + inset + margin auto（需固定宽高） */
.center {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 100px;
  height: 100px;
}

/* 5. 单行文本 */
.center { height: 40px; line-height: 40px; text-align: center; }
```

### Q5：Flex 的 `flex: 1` 是什么？ ⭐⭐⭐

**答：** `flex: 1` 等价于 `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`，表示按比例等分剩余空间。注意 Flex 子项默认 `min-width: auto`，内容可能阻止收缩，需要省略号时加 `min-width: 0`。

### Q6：`position` 有哪些值？分别相对谁定位？ ⭐⭐

**答：** `static` 默认；`relative` 相对自身原位置；`absolute` 相对最近的非 static 祖先；`fixed` 相对视口；`sticky` 相对最近滚动容器，滚动到阈值后粘住。

### Q7：`z-index` 为什么失效？ ⭐⭐

**答：** `z-index` 只对定位元素或 flex/grid 子项生效；而且只在同一层叠上下文内比较。父元素如果有 `transform`、`opacity < 1`、`filter` 等，会创建新的层叠上下文，子元素的 `z-index` 再大也跳不出父级。

### Q8：移动端 1px 边框怎么处理？ ⭐⭐⭐

**答：** 高清屏上 1 CSS 像素会被放大成多个物理像素，看起来偏粗。常用方案是伪元素画 1px 高/宽的线，再用 `transform: scaleY(0.5)`（DPR=2）或 `scaleY(0.3333)`（DPR=3）缩放；也有用 `box-shadow`、`border-image` 或 `0.5px` 的方案，但兼容性不如 transform。

### Q9：移动端适配有哪些方案？ ⭐⭐⭐

**答：**

- viewport + rem：根据屏幕宽度动态设置根字号，设计稿 px / 100 = rem。
- vw：1vw = 屏幕宽度的 1%，配合 PostCSS 自动转换。
- 媒体查询：按断点调整布局。
- Flex/Grid + 百分比：弹性布局。
- 补充：安全区 `env()`、1px 方案、`100dvh`、图片 `srcset`。

### Q10：重排和重绘的区别？如何优化？ ⭐⭐⭐

**答：** 重排是几何属性变化，浏览器要重新计算布局，代价高；重绘是颜色等外观变化，不改变布局。优化：批量修改样式、先读后写、用 class 切换、动画用 `transform/opacity`、图片写宽高、长列表虚拟滚动、避免频繁读取 `offsetWidth` 等布局属性。

### Q11：`display: none`、`visibility: hidden`、`opacity: 0` 的区别？ ⭐⭐

**答：** `display: none` 不渲染、不占位、不可交互、读屏不可见；`visibility: hidden` 占位但不可见、不可交互；`opacity: 0` 占位、不可见，但仍然可以点击，也会被读屏读到。

### Q12：Flex 和 Grid 的区别？ ⭐⭐

**答：** Flex 是一维布局，主要解决一行或一列的排列；Grid 是二维布局，可以同时控制行和列。简单排列用 Flex，复杂网格用 Grid，两者可以嵌套使用。

### Q13：`margin` 塌陷是什么？怎么解决？ ⭐⭐

**答：** 相邻兄弟的上下 margin 会合并取较大值；父子之间在没有 border/padding/BFC 时，子元素的 margin 会穿透到父元素外。解决：父元素触发 BFC（`display: flow-root`）、加 padding/border，或改用 Flex/Grid。

### Q14：CSS 动画为什么优先用 transform？ ⭐⭐

**答：** `transform` 和 `opacity` 可以只触发合成阶段，由 GPU 处理，不引起重排重绘；而 `width/height/top/left` 会触发布局，性能差很多。

---

## 18. 练习

### 练习 1：三栏布局
左右各 80px 固定，中间自适应，高度 200px。用 Flex 和 Grid 各写一遍。

### 练习 2：移动端卡片
实现一个商品卡片：
- 图片 1:1。
- 标题两行省略。
- 价格和销量两端对齐。
- 底部 1px 分割线（DPR=2 下不粗）。
- 卡片间距 10px。

### 练习 3：底部导航
实现固定底部导航：
- 4 个 tab 等分。
- 适配 iPhone 安全区。
- 页面内容不被遮挡。
- 当前 tab 高亮。

### 练习 4：响应式网格
手机 2 列、平板 3 列、桌面 4 列，间距 12px，用 Grid 的 `auto-fit` 或媒体查询实现。

### 练习 5：仿写
找京东/淘宝/美团任意一个移动端页面，截图，仿写静态布局。先不要管交互，只求布局和视觉一致。

---

## 19. 自查清单

- [ ] 能解释盒模型和 `box-sizing`。
- [ ] 能默写优先级规则。
- [ ] 能说出 BFC 的触发方式和用途。
- [ ] 能默写 5 种居中方式。
- [ ] 能熟练使用 Flex 的容器/子项属性。
- [ ] 能用 Grid 写两列/三列/响应式网格。
- [ ] 能解释 `position` 五个值。
- [ ] 能解释 `z-index` 失效的原因。
- [ ] 会移动端 rem/vw 适配。
- [ ] 会 1px 边框和安全区。
- [ ] 能说出重排/重绘的区别和优化手段。
- [ ] 能独立仿写一个移动端列表页。
