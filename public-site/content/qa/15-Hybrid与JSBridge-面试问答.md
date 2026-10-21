# 15 · Hybrid 与 JSBridge 面试问答分册

> 对应知识文档：[15-Hybrid与JSBridge.md](../15-Hybrid与JSBridge.md)
>
> 用法：先自己答，再看“直接回答”；追问遮住答案练。

---

## Q1. Hybrid 是什么？有什么优缺点？

**直接回答：**

> Hybrid 是原生 App 外壳 + WebView 承载 H5 页面，通过 JSBridge 调原生能力。优点是发版快、复用 Web 技术、跨端；缺点是性能/体验不如原生、首屏依赖资源、桥通信和安全复杂。

**追问 1：哪些页面适合 Hybrid？**

> 活动页、商城、内容/帮助中心、运营页；交互复杂/性能敏感的核心页面用原生或 RN。

**追问 2：Hybrid 和 RN 的区别？**

> Hybrid 渲染 DOM，性能和体验受 WebView 限制；RN 渲染原生组件，性能和交互更接近原生，但需要原生依赖/发版。

**陷阱/加分：**

- Hybrid 不是“套壳”这么简单，核心是桥和离线包。
- 可以 Native + RN + H5 混合。

---

## Q2. JSBridge 有哪几种实现方式？

**直接回答：**

> 三种：URL Scheme 拦截、注入对象（Android addJavascriptInterface / iOS WKScriptMessageHandler）、prompt 拦截。前两种最常用，prompt 是老方案。

**追问 1：URL Scheme 有什么缺点？**

> 长度限制、可能触发页面跳转/刷新、参数要编码、回调管理麻烦。

**追问 2：注入对象有什么风险？**

> Android 注入的对象能被页面 JS 调用，加载不可信页面时可能被恶意调用原生能力。

**陷阱/加分：**

- iOS 没有 addJavascriptInterface，用 WKScriptMessageHandler。
- 新项目优先注入对象/自定义 scheme + 白名单。

---

## Q3. H5 调原生的完整流程？

**直接回答：**

> H5 生成 callbackId，把 method/params/callbackId 序列化后发给原生；原生解析并执行，再通过 evaluateJavascript 调 `window.__bridgeCallback(callbackId, response)`；H5 用 Map 保存回调，收到后 resolve/reject，并清理定时器。

**追问 1：怎么处理超时？**

> 每个调用起一个 setTimeout，超时 reject 并从 Map 删除；原生返回时清理定时器。

**追问 2：怎么兼容 Android/iOS？**

> 先判断 `window.webkit.messageHandlers.bridge`，再判断 `window.AndroidBridge`，最后 fallback 到 URL scheme。

**陷阱/加分：**

- callbackId 要唯一。
- 参数要 JSON 序列化，大对象要精简。

---

## Q4. 原生怎么调 H5？

**直接回答：**

> 原生用 `evaluateJavascript`/`evaluateJavaScript` 执行 H5 全局函数，或 dispatch CustomEvent；参数序列化成 JSON，注意在主线程执行。

**追问 1：H5 没加载完怎么办？**

> 原生要等页面加载完成/收到 H5 ready 信号再调用，或把消息排队，等 ready 后 flush。

**追问 2：能传大对象吗？**

> 不建议，桥传输有序列化成本；传 ID/URL，H5 自己请求。

**陷阱/加分：**

- 原生调 H5 也要做错误处理/超时。
- H5 侧函数要挂到 window 上（或通过 bridge 注册）。

---

## Q5. JSBridge 怎么保证安全？

**直接回答：**

> 加载域名白名单、HTTPS、方法白名单、来源校验、参数校验、敏感操作签名/一次性 token；Android 注入对象只对可信页面开启，生产关闭 WebView 调试。

**追问 1：怎么校验来源？**

> 原生侧检查当前页面 URL/origin 是否在白名单；H5 侧不要加载不可信 iframe/第三方脚本。

**追问 2：为什么不能暴露任意反射调用？**

> 攻击者可以调用删除数据/读取通讯录等敏感能力；只暴露必要方法，并做权限校验。

**陷阱/加分：**

- 不要忽略 SSL 错误。
- 不要把 token 放在 URL 里。

---

## Q6. 离线包怎么做？

**直接回答：**

> App 请求 manifest，对比版本，下载 zip；校验 MD5/签名后解压到临时目录，原子切换版本，失败回滚；WebView 通过本地资源协议加载，并上报版本/失败。

**追问 1：为什么不用 file:// 直接加载？**

> 安全/跨域/权限问题多；Android 用 WebViewAssetLoader，iOS 用 WKURLSchemeHandler 更安全。

**追问 2：离线包怎么更新/回滚？**

> 版本号 + 灰度 + 完整性校验；保留上一版本，失败自动回滚。

**陷阱/加分：**

- 离线包要和接口/原生版本兼容。
- 要有降级到在线 H5 的方案。

---

## Q7. Hybrid 首屏怎么优化？

**直接回答：**

> 离线包、预创建 WebView、资源预加载、骨架屏、SSR/预渲染、图片压缩/懒加载、缓存、减少桥调用。

**追问 1：WebView 预创建怎么做？**

> App 启动时提前初始化一个 WebView 池，进入页面直接复用；注意内存和生命周期。

**追问 2：首屏白屏怎么兜底？**

> 本地兜底页、加载超时提示、重试、离线包降级、错误上报。

**陷阱/加分：**

- 首屏不只是资源，还有桥初始化/登录态。
- 优化要量化：首屏时间、白屏率、加载失败率。

---

## Q8. Hybrid 怎么调试？

**直接回答：**

> Android 用 chrome://inspect 远程调试 WebView；iOS 用 Safari 开发菜单；App 内可以接 vConsole/Eruda；网络用 Charles/Whistle 抓包；桥问题两端都打日志。

**追问 1：线上怎么排查？**

> 接错误监控/日志上报，记录 URL、桥方法、回调 ID、错误栈；必要时灰度/回滚。

**追问 2：为什么 Chrome 看不到 WebView？**

> 没开调试开关、WebView 不是 debuggable、设备未授权、版本不兼容。

**陷阱/加分：**

- 生产要关闭 WebView 调试。
- 桥日志要脱敏。

---

## Q9. WebView 白屏怎么排查？

**直接回答：**

> 分资源/JS/原生/离线包四类：看 Network 是否 404/超时、Console 是否 JS 报错、原生日志是否加载失败、离线包是否损坏；先止血（降级在线/回滚），再修根因。

**追问 1：只有部分机型白屏？**

> 看 WebView 内核版本、系统版本、机型内存、离线包兼容性；必要时灰度对比。

**追问 2：怎么预防？**

> 兜底页、超时重试、资源校验、灰度发布、监控告警。

**陷阱/加分：**

- 白屏不一定是 H5，可能是 WebView 初始化/原生崩溃。
- 要区分首屏白屏和交互中白屏。

---

## Q10. `addJavascriptInterface` 有什么风险？

**直接回答：**

> 注入的对象能被页面 JS 调用，如果加载不可信页面，可能被恶意调用原生能力；只对可信页面开启，方法做白名单/校验，或改用更安全的资源加载方案。

**追问 1：Android 版本有影响吗？**

> 老版本（API 16 及以下）风险更高；现代系统有改进，但仍不应加载不可信内容。

**追问 2：更安全的替代？**

> WebViewAssetLoader + 自定义 scheme、限制导航白名单、关闭文件访问、最小化暴露方法。

**陷阱/加分：**

- `@JavascriptInterface` 注解不是安全边界。
- 生产关闭调试/文件访问。

---

## Q11. 桥调用为什么慢？怎么优化？

**直接回答：**

> 跨语言/跨线程通信、参数序列化、回调排队；减少调用次数、批量合并、避免传大对象、异步化、缓存结果。

**追问 1：哪些场景适合批量？**

> 埋点、配置读取、列表项操作；合并成一次调用，减少往返。

**追问 2：能同步调用吗？**

> 老桥通常异步；同步会阻塞 JS/UI，不推荐。新方案（如 JSI）才支持同步。

**陷阱/加分：**

- 桥调用不要放在滚动/动画高频路径。
- 大 JSON 序列化是隐形开销。

---

## Q12. URL Scheme 和注入对象怎么选？

**直接回答：**

> 注入对象调用直接、支持复杂对象，但两端实现不同、Android 有安全风险；URL Scheme 兼容性好，但有长度限制/跳转副作用。新项目优先注入对象 + 白名单，老 WebView 可以用 Scheme 兜底。

**追问 1：为什么 Scheme 会触发页面跳转？**

> 修改 location.href 可能被 WebView 当作导航；用隐藏 iframe 或拦截后阻止默认导航。

**追问 2：回调怎么关联？**

> 请求里带 callbackId，原生回调时带上同一个 id。

**陷阱/加分：**

- Scheme 参数要 encodeURIComponent。
- 要注意 URL 长度限制。

---

## Q13. WebView 的缓存和 Cookie 怎么处理？

**直接回答：**

> HTTP 缓存按响应头；WebView 还有自己的缓存模式；Cookie 通过 CookieManager 同步/设置，注意 SameSite/Secure；登录态可以用 Cookie 或 token，但要注意安全和跨域。

**追问 1：Cookie 不同步怎么办？**

> Android 用 CookieManager.setCookie/flush；iOS 用 WKHTTPCookieStore；确保 domain/path/secure 正确。

**追问 2：缓存导致发版不生效？**

> HTML 用 no-cache，资源带 hash；离线包版本化；必要时清缓存/刷新。

**陷阱/加分：**

- WebView 缓存不等于离线包。
- 多进程/多 WebView 的 Cookie 同步要测。

---

## Q14. 让你设计一个 JSBridge，你会怎么设计？

**直接回答：**

> 协议层定义 method/params/callbackId/version；H5 侧 Promise 封装 + 超时 + 回调 Map；原生侧方法注册/白名单/参数校验/线程切换；支持事件订阅；加日志/监控/降级；安全上做域名白名单、签名、HTTPS。

**追问 1：怎么扩展新方法？**

> 原生注册表加方法，H5 只传 method 名；版本号兼容旧客户端，未知方法返回明确错误。

**追问 2：怎么做监控？**

> 记录调用方法、耗时、成功率、错误码；H5/原生两端都上报，按版本/机型聚合。

**陷阱/加分：**

- 桥要可测试、可降级。
- 不要让业务直接拼 JSON 调桥，要封装。

---

## 15. 快速自测

- [ ] 能解释 Hybrid 架构和优缺点。
- [ ] 能说出 JSBridge 三种实现和取舍。
- [ ] 能手写 H5 Promise 桥封装。
- [ ] 能说清原生侧接收/回调。
- [ ] 能说出桥安全措施。
- [ ] 能解释离线包 manifest/校验/回滚。
- [ ] 能说出首屏优化和调试方式。
- [ ] 能排查白屏/桥不通。
- [ ] 能对比 Hybrid/RN/Flutter/原生。
