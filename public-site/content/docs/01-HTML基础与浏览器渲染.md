# 01 · HTML 基础与浏览器渲染

> 目标：能独立写出结构清晰、语义正确、移动端可用的 HTML；理解浏览器拿到 HTML 之后做了什么。
>
> 标记：⭐⭐⭐ 必须会｜⭐⭐ 要理解｜⭐ 了解即可

---

## 1. HTML 是什么

HTML（HyperText Markup Language，超文本标记语言）是**页面的骨架**。

- HTML 负责“有什么”：标题、段落、图片、按钮、输入框。
- CSS 负责“长什么样”：颜色、大小、位置。
- JavaScript 负责“能做什么”：点击、请求、切换。

HTML 不是编程语言，没有变量和循环，它由一个个**标签（tag）**组成：

```html
<p>这是一个段落</p>
<!--  <p> 是开始标签，</p> 是结束标签，"这是一个段落" 是内容 -->
```

有些标签没有内容，叫**空标签**：

```html
<img src="a.jpg" alt="图片" />
<br />
<input type="text" />
```

---

## 2. 一个标准 HTML 文档

```html
<!DOCTYPE html> <!-- ① 声明使用 HTML5 标准，缺少它会进入怪异模式 -->
<html lang="zh-CN"> <!-- ② 根元素；lang 告诉浏览器和搜索引擎这是中文 -->
<head> <!-- ③ 页面的“配置区”，不直接显示在页面上 -->
  <meta charset="UTF-8" /> <!-- ④ 字符编码，防止中文乱码 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <!-- ⑤ 移动端视口 -->
  <meta name="description" content="页面描述，影响搜索结果摘要" />
  <title>页面标题</title> <!-- ⑥ 浏览器标签页上的文字 -->
  <link rel="stylesheet" href="./style.css" /> <!-- ⑦ 引入外部 CSS -->
</head>
<body> <!-- ⑧ 用户能看到的内容都写在这里 -->
  <h1>主标题</h1>
  <p>正文</p>
  <script src="./main.js"></script> <!-- ⑨ 引入 JS，通常放 body 末尾 -->
</body>
</html>
```

### 2.1 `<!DOCTYPE html>` 的作用 ⭐⭐

- 告诉浏览器按**标准模式**渲染。
- 不写会进入**怪异模式（quirks mode）**，盒模型、行高等计算方式可能和标准不同。
- HTML5 的 doctype 就这一行，不区分大小写。

### 2.2 `<head>` 里常见的东西

| 标签 | 作用 |
|---|---|
| `<meta charset="UTF-8">` | 字符编码，必须放在 head 靠前 |
| `<meta name="viewport" ...>` | 移动端视口设置 |
| `<title>` | 标签页标题，SEO 重要 |
| `<meta name="description">` | 搜索摘要 |
| `<link rel="stylesheet">` | 引入 CSS |
| `<link rel="icon">` | 网站图标 |
| `<link rel="preconnect">` | 提前建立连接，优化加载 |
| `<script>` | 引入或内联 JS |
| `<style>` | 内联 CSS |
| `<base>` | 设置相对路径的基准（少用） |

### 2.3 移动端 viewport ⭐⭐⭐

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

| 值 | 含义 |
|---|---|
| `width=device-width` | 页面宽度 = 设备宽度（而不是默认的 980px 虚拟宽度） |
| `initial-scale=1.0` | 初始缩放比例 1 |
| `viewport-fit=cover` | 让页面延伸到刘海屏/圆角区域，配合安全区使用 |
| `maximum-scale=1.0, user-scalable=no` | 禁止缩放（体验/无障碍角度不推荐） |

没有这行，手机浏览器会按 980px 宽渲染再缩小，字会非常小。

---

## 3. 常用标签速查

### 3.1 页面结构（语义化）

| 标签 | 含义 | 使用场景 |
|---|---|---|
| `<header>` | 页头/区块头 | Logo、标题、搜索 |
| `<nav>` | 导航 | 菜单、面包屑 |
| `<main>` | 页面主体（一个页面只能有一个） | 核心内容 |
| `<article>` | 独立完整的内容 | 文章、商品卡、帖子 |
| `<section>` | 主题分组 | 章节、板块 |
| `<aside>` | 侧边栏/补充内容 | 广告、推荐 |
| `<footer>` | 页脚 | 版权、链接 |
| `<h1>`~`<h6>` | 标题层级 | 一个页面通常一个 h1 |
| `<figure>` / `<figcaption>` | 图 + 图注 | 图片说明 |
| `<time>` | 时间 | 发布时间 |
| `<address>` | 联系信息 | 作者联系方式 |

### 3.2 文本

| 标签 | 含义 | 注意 |
|---|---|---|
| `<p>` | 段落 | 块级 |
| `<span>` | 行内容器 | 无默认样式 |
| `<strong>` | 重要（加粗） | 语义是“重要” |
| `<b>` | 加粗 | 无语义，仅样式 |
| `<em>` | 强调（斜体） | 语义是“强调” |
| `<i>` | 斜体 | 常用来放图标 |
| `<br>` | 换行 | 不要用来做段落间距 |
| `<hr>` | 分隔线 | 语义是主题分隔 |
| `<code>` | 行内代码 | 等宽字体 |
| `<pre>` | 预格式化 | 保留空格和换行 |
| `<blockquote>` | 引用块 | |
| `<mark>` | 高亮 | |
| `<small>` | 小字/免责声明 | |
| `<del>` / `<ins>` | 删除/插入 | 价格划线常用 del |

### 3.3 列表

```html
<!-- 无序列表：导航、商品列表最常用 -->
<ul>
  <li>首页</li>
  <li>分类</li>
</ul>

<!-- 有序列表 -->
<ol>
  <li>第一步</li>
  <li>第二步</li>
</ol>

<!-- 定义列表：名词 + 解释 -->
<dl>
  <dt>HTML</dt>
  <dd>负责页面结构</dd>
</dl>
```

> 注意：`<ul>` 的直接子元素只能是 `<li>`。不要为了布局在 ul 里塞 div。

### 3.4 链接与路径

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">新窗口打开</a>
<a href="/about">站内绝对路径</a>
<a href="./detail.html?id=1">相对路径 + 参数</a>
<a href="#section1">页内锚点</a>
<a href="tel:10086">拨打电话</a>
<a href="mailto:a@b.com">发邮件</a>
```

| 写法 | 含义 |
|---|---|
| `/about` | 从域名根目录开始 |
| `./detail.html` | 当前目录 |
| `../img/a.png` | 上一级目录 |
| `#top` | 页面内 id 为 top 的元素 |

`target="_blank"` 建议加 `rel="noopener noreferrer"`，防止新页面通过 `window.opener` 操作原页面。

### 3.5 图片与媒体

```html
<!-- 必须写 alt：图片加载失败时显示，也给读屏软件用 -->
<img src="./cover.jpg" alt="商品封面：无线耳机" width="375" height="200" loading="lazy" decoding="async" />

<!-- 响应式图片：浏览器根据屏幕宽度选择合适尺寸 -->
<img
  src="./photo-800.jpg"
  srcset="./photo-400.jpg 400w, ./photo-800.jpg 800w, ./photo-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 600px"
  alt="风景"
/>

<!-- 艺术方向/格式选择：优先 AVIF，不支持则回退 JPG -->
<picture>
  <source type="image/avif" srcset="./a.avif" />
  <source type="image/webp" srcset="./a.webp" />
  <img src="./a.jpg" alt="示例" />
</picture>

<video src="./movie.mp4" controls poster="./cover.jpg" preload="metadata"></video>
<audio src="./a.mp3" controls></audio>
```

**为什么写 width/height**：提前占位，避免图片加载后页面跳动（CLS 指标）。

**loading="lazy"**：图片进入视口附近才加载，首屏图片不要加。

### 3.6 表格

```html
<table>
  <caption>2026 年销售数据</caption>
  <thead>
    <tr>
      <th scope="col">月份</th>
      <th scope="col">销售额</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1 月</td>
      <td>100 万</td>
    </tr>
  </tbody>
</table>
```

表格只用于**展示数据**，不要用来做页面布局（用 Flex/Grid）。

### 3.7 交互元素

```html
<button type="button">普通按钮</button>
<button type="submit">提交表单</button>
<details>
  <summary>点击展开</summary>
  <p>隐藏的内容</p>
</details>
<dialog id="modal">弹窗内容</dialog>
```

> 能点的地方优先用 `<button>` 或 `<a>`，不要用 `<div onclick>`：键盘无法聚焦、读屏软件不识别、没有默认交互。

---

## 4. 语义化 ⭐⭐⭐

### 4.1 什么是语义化

用**含义正确**的标签，而不是一堆 `<div>`。

```html
<!-- 不语义化：能显示，但没有任何含义 -->
<div class="header">
  <div class="title">新闻</div>
</div>
<div class="content">
  <div class="item">第一条</div>
</div>

<!-- 语义化 -->
<header>
  <h1>新闻</h1>
</header>
<main>
  <article>第一条</article>
</main>
```

### 4.2 为什么重要

1. **SEO**：搜索引擎能理解页面结构。
2. **无障碍**：读屏软件能跳转到导航、主内容。
3. **可维护**：同事一眼看懂。
4. **移动端**：更好的默认行为（如点击、键盘）。
5. **面试**：这是 HTML 第一高频题。

### 4.3 常见错误

- 一个页面多个 `<h1>`（不是绝对错误，但不推荐）。
- 用 `<div>` 做按钮。
- 标题层级跳级：h1 直接到 h4。
- `<section>` 里没有标题（section 应该有主题）。
- 用 `<br>` 做布局间距。

---

## 5. 表单 ⭐⭐⭐

表单是移动端最高频的交互之一：登录、注册、收货地址、搜索、评价。

### 5.1 最小表单

```html
<form action="/api/login" method="post" novalidate>
  <!-- label 的 for 必须等于 input 的 id，点击文字也能聚焦输入框 -->
  <label for="phone">手机号</label>
  <input
    id="phone"
    name="phone"            <!-- 提交时的字段名，后端靠它取值 -->
    type="tel"              <!-- 手机端弹出数字键盘 -->
    inputmode="numeric"     <!-- 更明确的键盘类型 -->
    autocomplete="tel"      <!-- 让浏览器自动填充 -->
    placeholder="请输入手机号"
    maxlength="11"
    required                <!-- 原生必填校验 -->
  />

  <label for="password">密码</label>
  <input
    id="password"
    name="password"
    type="password"
    autocomplete="current-password"
    minlength="6"
    required
  />

  <button type="submit">登录</button>
</form>
```

### 5.2 常用 input 类型

| type | 用途 | 手机键盘 |
|---|---|---|
| `text` | 普通文本 | 默认 |
| `tel` | 电话 | 数字键盘 |
| `email` | 邮箱 | 带 @ 的键盘 |
| `password` | 密码 | 默认，字符隐藏 |
| `number` | 数字 | 数字键盘 |
| `search` | 搜索 | 回车显示“搜索” |
| `date` / `time` | 日期/时间 | 系统选择器 |
| `file` | 文件 | 相册/相机 |
| `checkbox` | 多选 | |
| `radio` | 单选 | |
| `range` | 滑块 | |
| `color` | 颜色 | |

### 5.3 其他表单控件

```html
<!-- 多行文本 -->
<textarea name="remark" rows="4" maxlength="200"></textarea>

<!-- 下拉选择 -->
<select name="city">
  <option value="">请选择</option>
  <option value="sh">上海</option>
  <option value="bj">北京</option>
</select>

<!-- 复选框组 -->
<label><input type="checkbox" name="hobby" value="read" /> 阅读</label>
<label><input type="checkbox" name="hobby" value="run" /> 跑步</label>

<!-- 单选框组：name 相同才互斥 -->
<label><input type="radio" name="gender" value="male" /> 男</label>
<label><input type="radio" name="gender" value="female" /> 女</label>
```

### 5.4 表单校验

原生校验属性：

| 属性 | 作用 |
|---|---|
| `required` | 必填 |
| `minlength` / `maxlength` | 长度 |
| `min` / `max` / `step` | 数字范围/步长 |
| `pattern` | 正则 |
| `type="email"` / `url` | 格式 |
| `novalidate` | 关闭浏览器默认校验（自定义校验时用） |

```html
<input type="text" name="code" pattern="\d{6}" title="请输入 6 位数字" required />
```

JS 自定义校验：

```js
const form = document.querySelector('form');

form.addEventListener('submit', (event) => {
  event.preventDefault(); // 阻止默认提交（页面刷新）

  const phone = form.phone.value.trim();
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    alert('手机号格式不正确');
    form.phone.focus();
    return; // 校验不通过，直接结束
  }

  // 校验通过，发请求
  submitLogin({ phone, password: form.password.value });
});
```

### 5.5 表单提交的两种方式

1. **传统提交**：`action` + `method`，浏览器跳转页面。现在少用。
2. **JS 提交**：监听 `submit`，`preventDefault()`，用 `fetch` 发请求。主流。

### 5.6 移动端表单坑

- iOS 输入框聚焦时页面会被顶起，要用 `scrollIntoView` 或监听 `resize`。
- `input` 的 `font-size` 小于 16px 时，iOS 会自动放大页面。解决：`font-size: 16px` 或加 `maximum-scale=1`（不推荐后者）。
- 数字键盘用 `type="tel"` + `inputmode="numeric"`，不要用 `type="number"`（会出现上下箭头、允许 e）。
- 关闭自动纠正：`autocorrect="off" autocapitalize="off" spellcheck="false"`。
- 密码管理器需要 `autocomplete` 正确。

---

## 6. 全局属性与 data-*

所有元素都能用的属性：

| 属性 | 作用 |
|---|---|
| `id` | 唯一标识，页面内不能重复 |
| `class` | 类名，可多个，空格分隔 |
| `style` | 行内样式 |
| `title` | 悬停提示 |
| `hidden` | 隐藏元素 |
| `tabindex` | Tab 键聚焦顺序，`0` 可聚焦，`-1` 不能 Tab 但可 JS 聚焦 |
| `lang` | 语言 |
| `dir` | 文字方向 `ltr/rtl` |
| `contenteditable` | 可编辑 |
| `draggable` | 可拖拽 |
| `data-*` | 自定义数据 |

```html
<!-- data-* 用来在 HTML 上挂业务数据，JS 通过 dataset 读取 -->
<button class="buy" data-id="1001" data-price="199">加入购物车</button>

<script>
  document.querySelector('.buy').addEventListener('click', (e) => {
    const { id, price } = e.currentTarget.dataset; // 自动转成驼峰
    console.log(id, price); // "1001" "199"（都是字符串）
  });
</script>
```

注意：`data-goods-id` 在 JS 里是 `dataset.goodsId`。

---

## 7. 无障碍（a11y）基础 ⭐

| 做法 | 原因 |
|---|---|
| 图片写 `alt` | 读屏软件朗读；加载失败显示 |
| 按钮用 `<button>` | 键盘可操作 |
| 表单用 `<label for>` | 点击文字可聚焦 |
| 不用颜色作为唯一信息 | 色盲用户 |
| `aria-label` 给图标按钮 | 没有文字时补充说明 |
| 弹窗聚焦管理 | 键盘用户不迷失 |
| 对比度 ≥ 4.5:1 | 可读性 |

```html
<button aria-label="关闭弹窗">×</button>
<img src="avatar.png" alt="用户头像" />
```

---

## 8. 浏览器如何把 HTML 变成页面 ⭐⭐⭐

这是面试高频，也是性能优化的基础。

### 8.1 关键渲染路径

```text
1. 网络：下载 HTML 字节
2. 解析：字节 → 字符 → Token → 节点
3. 构建 DOM 树
4. 下载并解析 CSS，构建 CSSOM 树
5. DOM + CSSOM → Render Tree（渲染树，只包含可见节点）
6. Layout（布局/回流）：计算每个节点的位置和大小
7. Paint（绘制）：生成绘制指令
8. Composite（合成）：GPU 把图层合成到屏幕
```

### 8.2 什么是 DOM

浏览器把 HTML 解析成一棵**由对象组成的树**：

```html
<body>
  <div id="app">
    <h1>标题</h1>
  </div>
</body>
```

对应的 DOM 结构：

```text
document
└── html
    └── body
        └── div#app
            └── h1
                └── "标题"（文本节点）
```

JS 操作的 `document.querySelector`、`element.appendChild`，操作的都是这棵树。

### 8.3 CSS 会阻塞什么

- CSS 下载/解析会**阻塞渲染**：没有 CSSOM，浏览器不敢画，否则会闪一下无样式内容（FOUC）。
- CSS 也会**阻塞后面 JS 的执行**：因为 JS 可能读取样式（`getComputedStyle`），浏览器必须等 CSSOM 就绪。

### 8.4 JS 会阻塞什么

- 普通 `<script>` 会**阻塞 HTML 解析**：浏览器必须停下来下载并执行脚本，然后继续解析。
- 所以通常把 `<script>` 放 `</body>` 前，或者用 `defer` / `async`。

### 8.5 `defer` vs `async` ⭐⭐⭐

```html
<script src="a.js" defer></script>
<script src="b.js" async></script>
```

| 方式 | 下载 | 执行时机 | 顺序 | 是否阻塞解析 |
|---|---|---|---|---|
| 普通 | 立即 | 下载完立即执行 | 按出现顺序 | 是 |
| `async` | 并行 | 下载完立即执行（可能打断解析） | **不保证** | 下载时不阻塞，执行时阻塞 |
| `defer` | 并行 | HTML 解析完后、`DOMContentLoaded` 前 | **保证顺序** | 否 |
| `type="module"` | 并行 | 默认 defer 行为 | 保证顺序 | 否 |

**怎么选：**

- 有依赖关系、需要操作 DOM：`defer`。
- 独立脚本（统计、广告）：`async`。
- 现代项目：打包工具会处理，通常放 body 末尾或 `defer`。

### 8.6 三个重要事件

```js
// DOM 结构解析完成（不等待图片、样式、子框架）
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 就绪');
});

// 所有资源（图片、样式、iframe）加载完成
window.addEventListener('load', () => {
  console.log('页面完全加载');
});

// 页面即将卸载
window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
  e.returnValue = ''; // 某些浏览器需要
});
```

### 8.7 重排与重绘 ⭐⭐⭐

| 概念 | 触发 | 代价 |
|---|---|---|
| 重排 Reflow | 尺寸、位置、字体、增删节点、窗口大小 | 高，可能影响整棵树 |
| 重绘 Repaint | 颜色、背景、visibility | 中 |
| 合成 Composite | transform、opacity | 低，GPU 处理 |

会触发重排的操作：

```js
// 读布局信息也会强制重排（强制同步布局）
element.offsetWidth;
element.offsetHeight;
element.getBoundingClientRect();
element.scrollTop;
window.getComputedStyle(element).width;
```

优化写法：

```js
// 差：读一次写一次，强制浏览器反复布局
for (let i = 0; i < 100; i++) {
  el.style.width = el.offsetWidth + 1 + 'px';
}

// 好：先读后写，批量修改
const width = el.offsetWidth;
for (let i = 0; i < 100; i++) {
  el.style.width = width + i + 'px';
}

// 更好：用 class 批量改样式
el.classList.add('active');

// 动画优先用 transform / opacity
el.style.transform = 'translateX(100px)';
```

### 8.8 现代加载优化

```html
<!-- 预连接：提前 DNS/TCP/TLS -->
<link rel="preconnect" href="https://cdn.example.com" />

<!-- 预加载关键资源 -->
<link rel="preload" href="./font.woff2" as="font" type="font/woff2" crossorigin />

<!-- 预取下一页可能用到的资源 -->
<link rel="prefetch" href="./next-page.js" />

<!-- 首屏图片优先 -->
<img src="./hero.jpg" fetchpriority="high" alt="首屏图" />
```

---

## 9. 完整示例：移动端个人资料页

保存为 `profile.html`，直接浏览器打开。每行注释都解释了“为什么”。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <!-- 移动端视口：宽度等于设备宽度，禁止初始缩放，延伸到安全区 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="description" content="张三的个人主页" />
  <title>张三 · 个人主页</title>

  <style>
    /* CSS 变量：统一管理颜色，改一处全局生效 */
    :root {
      --brand: #07c160;
      --text: #1f1f1f;
      --sub: #8a8a8a;
      --bg: #f5f6f7;
      --card: #ffffff;
      --radius: 12px;
    }

    /* 通配符重置：去掉默认外边距，盒模型改为 border-box */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      /* 适配 iPhone 底部安全区，避免内容被小白条挡住 */
      padding-bottom: calc(24px + env(safe-area-inset-bottom));
    }

    /* 页头：渐变背景 + 居中 */
    .hero {
      padding: 48px 24px 32px;
      text-align: center;
      color: #fff;
      background: linear-gradient(135deg, #07c160, #0aa8a7);
      border-radius: 0 0 24px 24px;
    }

    .hero__avatar {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.8);
      object-fit: cover; /* 图片不变形地裁切填满 */
    }

    .hero__name {
      margin-top: 12px;
      font-size: 24px;
      font-weight: 600;
    }

    .hero__job {
      margin-top: 4px;
      font-size: 14px;
      opacity: 0.9;
    }

    /* 主体内容：最大宽度限制，桌面端也不会拉得太宽 */
    .main {
      max-width: 720px;
      margin: 0 auto;
      padding: 16px;
    }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    }

    .card__title {
      font-size: 18px;
      margin-bottom: 12px;
      /* 左侧竖条装饰 */
      border-left: 4px solid var(--brand);
      padding-left: 10px;
    }

    .skill-list {
      display: flex;
      flex-wrap: wrap; /* 放不下自动换行 */
      gap: 8px;
      list-style: none;
    }

    .skill-list li {
      padding: 6px 12px;
      font-size: 14px;
      color: var(--brand);
      background: rgba(7, 193, 96, 0.1);
      border-radius: 999px;
    }

    /* 联系表单 */
    .field {
      margin-bottom: 16px;
    }

    .field label {
      display: block;
      font-size: 14px;
      margin-bottom: 6px;
      color: var(--sub);
    }

    .field input,
    .field textarea {
      width: 100%;
      padding: 12px;
      font-size: 16px; /* 小于 16px iOS 会自动放大页面 */
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.2s;
    }

    .field input:focus,
    .field textarea:focus {
      border-color: var(--brand);
    }

    .submit {
      width: 100%;
      padding: 14px;
      font-size: 16px;
      color: #fff;
      background: var(--brand);
      border: none;
      border-radius: 999px;
      cursor: pointer;
    }

    .submit:active {
      transform: scale(0.98);
    }

    /* 小屏适配：屏幕宽度小于 360px 时缩小标题 */
    @media (max-width: 360px) {
      .hero__name {
        font-size: 20px;
      }
    }
  </style>
</head>

<body>
  <!-- header 表示页头，语义清晰 -->
  <header class="hero">
    <img class="hero__avatar" src="./avatar.jpg" alt="张三的头像" width="88" height="88" />
    <h1 class="hero__name">张三</h1>
    <p class="hero__job">移动前端工程师 · 上海</p>
  </header>

  <!-- main 表示页面主体，一个页面只写一个 -->
  <main class="main">
    <!-- section 表示一个主题区块 -->
    <section class="card">
      <h2 class="card__title">关于我</h2>
      <p>
        3 年移动端开发经验，主要负责 React Native 与小程序业务开发，
        关注性能优化与组件化建设。
      </p>
    </section>

    <section class="card">
      <h2 class="card__title">技能</h2>
      <ul class="skill-list">
        <li>JavaScript</li>
        <li>React</li>
        <li>React Native</li>
        <li>微信小程序</li>
        <li>Webpack</li>
      </ul>
    </section>

    <section class="card">
      <h2 class="card__title">联系我</h2>

      <!-- novalidate：关闭浏览器默认提示，后面用 JS 自定义校验 -->
      <form id="contact-form" novalidate>
        <div class="field">
          <label for="name">称呼</label>
          <input id="name" name="name" type="text" placeholder="怎么称呼你" autocomplete="name" required />
        </div>

        <div class="field">
          <label for="phone">手机号</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputmode="numeric"
            placeholder="请输入手机号"
            maxlength="11"
            autocomplete="tel"
            required
          />
        </div>

        <div class="field">
          <label for="message">留言</label>
          <textarea id="message" name="message" rows="4" placeholder="想说的话" maxlength="200"></textarea>
        </div>

        <button class="submit" type="submit">发送</button>
      </form>
    </section>
  </main>

  <script>
    // 获取表单元素
    const form = document.getElementById('contact-form');

    // 监听提交事件
    form.addEventListener('submit', (event) => {
      // 阻止浏览器默认的页面跳转
      event.preventDefault();

      // FormData 能直接收集带 name 的控件
      const data = Object.fromEntries(new FormData(form).entries());

      // 去掉首尾空格
      const name = data.name.trim();
      const phone = data.phone.trim();

      // 自定义校验
      if (!name) {
        alert('请输入称呼');
        form.name.focus();
        return;
      }

      if (!/^1[3-9]\d{9}$/.test(phone)) {
        alert('请输入正确的手机号');
        form.phone.focus();
        return;
      }

      // 这里模拟提交；真实项目用 fetch
      console.log('提交的数据：', { name, phone, message: data.message });
      alert('提交成功（请看控制台）');
      form.reset(); // 清空表单
    });
  </script>
</body>
</html>
```

---

## 10. 面试高频题

### Q1：HTML5 有哪些新特性？ ⭐⭐⭐

**答：**

- 语义化标签：`header/nav/main/article/section/aside/footer`。
- 表单增强：`type="email/tel/date"`、`required`、`pattern`、`placeholder`。
- 多媒体：`<video>`、`<audio>`、`<canvas>`、`<svg>`。
- 存储：`localStorage`、`sessionStorage`、`IndexedDB`。
- 通信：`WebSocket`、`Server-Sent Events`。
- 新 API：`history.pushState`、`geolocation`、`File API`、`Drag and Drop`。
- 其他：`<template>`、`<dialog>`、`data-*`、`defer/async`。

### Q2：`defer` 和 `async` 的区别？ ⭐⭐⭐

**答：** 两者都并行下载、不阻塞 HTML 解析。区别在执行时机：`async` 下载完立刻执行，顺序不保证，可能打断解析；`defer` 等 HTML 解析完、`DOMContentLoaded` 之前按顺序执行。有依赖用 `defer`，独立脚本用 `async`。

### Q3：`DOMContentLoaded` 和 `load` 的区别？ ⭐⭐

**答：** `DOMContentLoaded` 在 DOM 解析完成时触发，不等图片、样式、iframe；`load` 等所有资源加载完才触发。所以操作 DOM 用前者，统计资源加载用后者。

### Q4：`src` 和 `href` 的区别？ ⭐

**答：** `src` 是“引入资源并替换当前元素”，浏览器会下载并执行/显示，例如 `img/script/iframe`；`href` 是“建立引用关系”，例如 `a/link`，不会替换当前内容。

### Q5：什么是语义化？有什么好处？ ⭐⭐⭐

**答：** 用含义正确的标签描述内容，而不是全用 div。好处：SEO 更好、读屏软件可理解、代码可维护、移动端默认行为更正确。

### Q6：`alt` 和 `title` 的区别？ ⭐

**答：** `alt` 是图片的替代文本，图片加载失败或读屏时使用，是必需的；`title` 是悬停提示，可选，不能替代 `alt`。

### Q7：`label` 的作用？ ⭐⭐

**答：** 把文字和表单控件关联。`for` 等于控件的 `id`，点击文字也能聚焦/勾选控件，提升可用性和无障碍。

### Q8：`data-*` 有什么用？ ⭐⭐

**答：** 在 HTML 元素上存自定义数据，JS 通过 `element.dataset` 读取（`data-goods-id` → `dataset.goodsId`），常用于事件委托时识别操作对象。

### Q9：块级元素和行内元素的区别？ ⭐⭐

**答：** 块级（`div/p/h1`）独占一行，宽高、margin、padding 都生效；行内（`span/a/strong`）不独占一行，宽高不生效，垂直 margin 不生效。`inline-block` 可以设置宽高但不独占一行。现在更推荐用 `display: flex/grid` 控制布局。

### Q10：从输入 URL 到页面展示发生了什么？ ⭐⭐⭐

**答：**

1. URL 解析、DNS 查询得到 IP。
2. 建立 TCP 连接（HTTPS 还要 TLS 握手）。
3. 发送 HTTP 请求，服务器返回 HTML。
4. 浏览器解析 HTML 构建 DOM，解析 CSS 构建 CSSOM。
5. 遇到 JS 会下载并执行（可能阻塞解析）。
6. DOM + CSSOM 生成渲染树，布局，绘制，合成。
7. 加载图片等资源，触发 `load`。
8. 期间可能发生重排、重绘。

（详细版见 07 文档的网络章节。）

---

## 11. 练习

### 练习 1：语义化改造
找一段全用 `<div>` 写的页面，改成 `header/nav/main/section/footer`，并说明每处为什么这样改。

### 练习 2：登录表单
写一个登录表单，要求：
- 手机号 11 位校验。
- 密码至少 6 位。
- 提交时阻止默认行为。
- 校验失败聚焦到对应输入框。
- 提交按钮点击后禁用 3 秒，防止重复提交。

### 练习 3：移动端个人页
不看示例，自己写一个移动端个人主页：
- 顶部头像 + 名字。
- 技能标签自动换行。
- 底部固定按钮。
- 适配 iPhone 安全区。
- 不能出现横向滚动条。

### 练习 4：解释渲染
用自己的话画出“HTML → 页面”的流程，并标出 CSS 和 JS 分别在哪一步阻塞。

---

## 12. 自查清单

- [ ] 能默写 HTML5 文档模板。
- [ ] 知道 viewport 每个参数的含义。
- [ ] 能说出 10 个语义化标签及用途。
- [ ] 能写一个带校验的表单。
- [ ] 能解释 `defer` / `async`。
- [ ] 能解释 `DOMContentLoaded` / `load`。
- [ ] 能说出重排和重绘的区别，以及如何减少。
- [ ] 能说出从 URL 到渲染的主要步骤。
