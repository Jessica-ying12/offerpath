# 15 · Hybrid 与 JSBridge

> 目标：理解 Hybrid App 的架构，掌握 WebView、JSBridge 双向通信、离线包、性能优化和安全防护；能回答“混合开发”相关面试题。
>
> 标记：⭐⭐⭐ 必须会｜⭐⭐ 要理解｜⭐ 了解即可

---

## 1. Hybrid 是什么

Hybrid（混合开发）= 原生 App 外壳 + WebView 承载 H5 页面。

```text
原生 App
├── 原生页面（首页、相机、支付）
├── WebView 容器
│   └── H5 页面（活动页、商城、帮助中心）
└── JSBridge（H5 ↔ 原生）
```

优点：

- H5 发版快，不用等应用商店审核。
- 前端团队可以复用 Web 技术。
- 一套 H5 可以同时在 App、浏览器、微信里用。
- 原生能力通过 JSBridge 暴露。

缺点：

- WebView 性能/体验不如原生。
- 首屏依赖网络/资源加载。
- JSBridge 通信有成本。
- 多端兼容/安全复杂。

### 1.1 Hybrid vs RN vs Flutter vs 原生

| 维度 | Hybrid | RN | Flutter | 原生 |
|---|---|---|---|---|
| UI 渲染 | WebView/DOM | 原生组件 | 自绘引擎 | 原生组件 |
| 性能 | 较低 | 接近原生 | 接近原生 | 最好 |
| 发版 | H5 可即时 | JS 可 OTA | 需发版 | 需发版 |
| 开发效率 | 高（Web） | 高（React） | 中（Dart） | 低（双端） |
| 原生能力 | 靠 Bridge | 靠 Bridge/JSI | 靠 Channel | 直接 |
| 适合 | 活动/商城/内容页 | 业务 App | 高一致性 App | 深度平台能力 |

---

## 2. WebView 基础

### 2.1 Android WebView

```kotlin
val webView = findViewById<WebView>(R.id.webView)

webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
    // 生产环境关闭调试
    if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true)
}

webView.webViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(
        view: WebView?,
        request: WebResourceRequest?
    ): Boolean {
        val url = request?.url.toString()
        // 拦截自定义 scheme，交给原生处理
        if (url.startsWith("app://")) {
            handleAppScheme(url)
            return true
        }
        return false
    }
}

webView.loadUrl("https://example.com")
```

### 2.2 iOS WKWebView

```swift
let config = WKWebViewConfiguration()
let controller = WKUserContentController()
controller.add(self, name: "bridge")
config.userContentController = controller

let webView = WKWebView(frame: .zero, configuration: config)
webView.navigationDelegate = self
webView.load(URLRequest(url: URL(string: "https://example.com")!))
```

`WKScriptMessageHandler` 接收 H5 消息：

```swift
extension ViewController: WKScriptMessageHandler {
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "bridge",
              let body = message.body as? [String: Any] else { return }
        handleBridge(body)
    }
}
```

---

## 3. JSBridge 的三种实现方式

### 3.1 URL Scheme 拦截

H5 通过修改 `location.href` 或创建 iframe 发起自定义协议：

```js
location.href = 'app://scan?callbackId=cb_1';
```

原生拦截：

- Android：`shouldOverrideUrlLoading`。
- iOS：`decidePolicyFor navigationAction`。

优点：兼容性好；缺点：有长度限制、可能触发页面跳转/刷新、参数要编码。

### 3.2 注入对象

Android 用 `addJavascriptInterface` 注入对象：

```kotlin
webView.addJavascriptInterface(AndroidBridge(), "AndroidBridge")
```

```js
window.AndroidBridge.postMessage(JSON.stringify(payload));
```

iOS 用 `WKScriptMessageHandler`：

```js
window.webkit.messageHandlers.bridge.postMessage(payload);
```

优点：调用直接、支持对象；缺点：两端写法不同，Android 注入对象有安全风险。

### 3.3 `prompt` 拦截（老方案）

H5 调用 `prompt(json)`，原生在 `onJsPrompt` / `WKUIDelegate` 里拦截。

优点：兼容老 Android；缺点：hack、可读性差，新项目不建议。

---

## 4. 通信设计

### 4.1 协议格式

```ts
type BridgeRequest = {
  method: string;                 // 原生方法名
  params?: Record<string, unknown>; // 参数
  callbackId?: string;            // 回调 id
};

type BridgeResponse = {
  code: number;                   // 0 成功
  message?: string;
  data?: unknown;
};
```

### 4.2 H5 调原生（Promise 封装）

```ts
type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: number;
};

const pending = new Map<string, Pending>();
let seq = 0;

declare global {
  interface Window {
    AndroidBridge?: { postMessage: (msg: string) => void };
    webkit?: {
      messageHandlers?: {
        bridge?: { postMessage: (msg: unknown) => void };
      };
    };
    __bridgeCallback?: (id: string, response: BridgeResponse) => void;
  }
}

export function callNative<T>(
  method: string,
  params: Record<string, unknown> = {},
  timeout = 10000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const callbackId = `cb_${++seq}`;

    const timer = window.setTimeout(() => {
      pending.delete(callbackId);
      reject(new Error(`桥调用超时：${method}`));
    }, timeout);

    pending.set(callbackId, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timer,
    });

    const payload: BridgeRequest = { method, params, callbackId };

    // iOS
    if (window.webkit?.messageHandlers?.bridge) {
      window.webkit.messageHandlers.bridge.postMessage(payload);
      return;
    }

    // Android
    if (window.AndroidBridge?.postMessage) {
      window.AndroidBridge.postMessage(JSON.stringify(payload));
      return;
    }

    // fallback：URL scheme
    const encoded = encodeURIComponent(JSON.stringify(payload));
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `app://bridge?payload=${encoded}`;
    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 0);
  });
}

// 原生回调 H5
window.__bridgeCallback = (id: string, response: BridgeResponse) => {
  const item = pending.get(id);
  if (!item) return;

  window.clearTimeout(item.timer);
  pending.delete(id);

  if (response.code === 0) item.resolve(response.data);
  else item.reject(new Error(response.message || '原生调用失败'));
};
```

使用：

```ts
const result = await callNative<{ level: number }>('getBatteryLevel');
console.log(result.level);
```

### 4.3 原生调 H5

Android：

```kotlin
webView.post {
    webView.evaluateJavascript(
        "window.__bridgeCallback('$callbackId', $responseJson)",
        null
    )
}
```

iOS：

```swift
let js = "window.__bridgeCallback('\(callbackId)', \(responseJson))"
webView.evaluateJavaScript(js, completionHandler: nil)
```

也可以发事件：

```js
window.dispatchEvent(new CustomEvent('native:event', { detail: data }));
```

---

## 5. Android Kotlin 示例

```kotlin
class BridgeHandler(
    private val context: Context,
    private val webView: WebView
) {
    @JavascriptInterface
    fun postMessage(json: String) {
        val request = JSONObject(json)
        val method = request.optString("method")
        val callbackId = request.optString("callbackId")
        val params = request.optJSONObject("params") ?: JSONObject()

        when (method) {
            "getBatteryLevel" -> {
                val level = 80 // 真实项目用 BatteryManager
                callback(callbackId, 0, JSONObject().put("level", level))
            }
            "scan" -> {
                // 启动扫码 Activity，结果回来后 callback
                callback(callbackId, 0, JSONObject().put("text", "scan-result"))
            }
            else -> {
                callback(callbackId, -1, JSONObject().put("message", "unknown method"))
            }
        }
    }

    private fun callback(id: String, code: Int, data: JSONObject) {
        if (id.isEmpty()) return
        val response = JSONObject()
            .put("code", code)
            .put("data", data)

        val json = response.toString()
        webView.post {
            webView.evaluateJavascript(
                "window.__bridgeCallback('$id', $json)",
                null
            )
        }
    }
}

// 注册
webView.addJavascriptInterface(BridgeHandler(this, webView), "AndroidBridge")
```

**安全提醒：**

- `addJavascriptInterface` 只对可信页面开启。
- 不要在 WebView 里加载任意第三方页面。
- 方法内部做权限校验/参数校验。

---

## 6. iOS Swift 示例

```swift
class BridgeHandler: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "bridge",
              let body = message.body as? [String: Any],
              let method = body["method"] as? String else { return }

        let callbackId = body["callbackId"] as? String ?? ""
        let params = body["params"] as? [String: Any] ?? [:]

        switch method {
        case "getBatteryLevel":
            callback(id: callbackId, code: 0, data: ["level": 80])
        case "scan":
            callback(id: callbackId, code: 0, data: ["text": "scan-result"])
        default:
            callback(id: callbackId, code: -1, data: ["message": "unknown method"])
        }
    }

    private func callback(id: String, code: Int, data: [String: Any]) {
        guard !id.isEmpty, let webView = webView else { return }

        let response: [String: Any] = ["code": code, "data": data]
        guard let jsonData = try? JSONSerialization.data(withJSONObject: response),
              let jsonString = String(data: jsonData, encoding: .utf8) else { return }

        let js = "window.__bridgeCallback('\(id)', \(jsonString))"
        DispatchQueue.main.async {
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}
```

注册：

```swift
let handler = BridgeHandler()
handler.webView = webView
config.userContentController.add(handler, name: "bridge")
```

---

## 7. 安全

Hybrid 是安全重灾区，面试常问。

### 7.1 加载安全

- 只加载可信域名，配置白名单。
- 使用 HTTPS，禁止 mixed content。
- 生产关闭 WebView 调试（Android `setWebContentsDebuggingEnabled(false)`）。
- 关闭不必要的文件访问（`allowFileAccess = false`、`allowUniversalAccessFromFileURLs = false`）。
- 不要忽略 SSL 错误（`onReceivedSslError` 不要直接 `proceed`）。

### 7.2 桥安全

- 方法白名单，不要暴露任意反射调用。
- 校验来源 URL/origin。
- 敏感操作加签名/一次性 token。
- 参数校验，防止注入。
- 不要通过桥返回敏感 token/密码。
- Android `addJavascriptInterface` 只对可信页面开启；更安全用 `WebViewAssetLoader`/自定义 scheme。

### 7.3 H5 安全

- XSS 转义、CSP、HttpOnly Cookie。
- 不要把 token 放 URL。
- 第三方 SDK 最小化。

---

## 8. 离线包

### 8.1 为什么需要

H5 首屏依赖网络；离线包把 HTML/CSS/JS/图片提前下载到本地，WebView 直接从本地加载，提升首屏和弱网体验。

### 8.2 流程

```text
1. App 启动/进页面时请求离线包 manifest
2. 对比本地版本，下载新包（zip）
3. 校验 MD5/签名，解压到临时目录
4. 原子切换版本（失败回滚）
5. WebView 通过本地资源协议加载
6. 上报加载/失败/版本
```

manifest 示例：

```json
{
  "version": "1.2.0",
  "minAppVersion": "8.0.0",
  "files": {
    "index.html": "md5...",
    "app.js": "md5..."
  },
  "packageUrl": "https://cdn.example.com/offline/1.2.0.zip",
  "md5": "整体包 md5"
}
```

### 8.3 加载方式

- Android：`WebViewAssetLoader` 映射到 `https://appassets.androidplatform.net/assets/...`。
- iOS：`WKURLSchemeHandler` 自定义 scheme，或本地 HTTP server。
- 不要直接用 `file://` 加载远程内容，容易有安全/跨域问题。

---

## 9. 性能优化

| 问题 | 优化 |
|---|---|
| WebView 启动慢 | 预创建/预热 WebView 池，提前初始化 |
| 首屏慢 | 离线包、SSR/预渲染、骨架屏、资源预加载 |
| 白屏 | 本地兜底页、加载失败重试、超时提示 |
| 桥调用多 | 批量/合并请求，减少频繁通信 |
| 图片大 | CDN/压缩/懒加载/WebP |
| 滚动卡 | 虚拟列表、减少 DOM、避免复杂动画 |
| 缓存 | HTTP 缓存、离线包、Service Worker（视容器） |

---

## 10. 调试

- Android：Chrome 打开 `chrome://inspect`，远程调试 WebView。
- iOS：Safari → 开发 → 设备 → 页面。
- H5：vConsole/Eruda 在 App 内看日志。
- 抓包：Charles/Fiddler/Whistle。
- 原生日志：logcat/Xcode。
- 桥问题：在 H5 和原生两端都打日志，确认 payload/回调 ID。

---

## 11. 面试高频

### Q1：Hybrid 是什么？优缺点？ ⭐⭐⭐

**答：** 原生壳 + WebView 承载 H5，通过 JSBridge 调原生能力。优点是发版快、复用 Web 技术、跨端；缺点是性能/体验不如原生、首屏依赖资源、桥通信和安全复杂。

### Q2：JSBridge 有哪几种实现？ ⭐⭐⭐

**答：** URL Scheme 拦截、注入对象（Android addJavascriptInterface / iOS WKScriptMessageHandler）、prompt 拦截。前两种最常用，prompt 是老方案。

### Q3：H5 怎么调原生？ ⭐⭐⭐

**答：** H5 发一个带 method/params/callbackId 的消息，原生解析后执行，再通过 evaluateJavascript 调 `window.__bridgeCallback(callbackId, response)` 回传；H5 用 Promise + Map 管理回调。

### Q4：原生怎么调 H5？ ⭐⭐

**答：** 原生用 `evaluateJavascript`/`evaluateJavaScript` 执行 H5 全局函数，或 dispatch CustomEvent；参数要序列化成 JSON。

### Q5：JSBridge 怎么保证安全？ ⭐⭐⭐

**答：** 加载域名白名单、HTTPS、方法白名单、来源校验、参数校验、敏感操作签名/一次性 token；Android 注入对象只对可信页面开启，生产关闭 WebView 调试。

### Q6：离线包怎么做？ ⭐⭐

**答：** manifest 版本管理、下载 zip、MD5/签名校验、解压、原子切换、失败回滚；WebView 通过本地资源协议加载，并上报版本/失败。

### Q7：Hybrid 首屏怎么优化？ ⭐⭐⭐

**答：** 离线包、预创建 WebView、资源预加载、骨架屏、SSR/预渲染、图片压缩/懒加载、缓存、减少桥调用。

### Q8：Hybrid 怎么调试？ ⭐⭐

**答：** Android chrome://inspect，iOS Safari 开发菜单，App 内 vConsole，Charles 抓包，原生日志看桥调用。

### Q9：Hybrid 和 RN 怎么选？ ⭐⭐

**答：** 活动/内容/商城等重 Web 复用的页面用 Hybrid；需要更好交互/性能、长期业务 App 用 RN；两者可以混合，Native 壳 + RN 页面 + H5 页面。

### Q10：WebView 为什么会白屏？ ⭐⭐

**答：** 网络/资源加载失败、JS 报错、离线包损坏、SSL 错误、WebView 初始化失败、内存不足；要有兜底页、重试、日志。

### Q11：`addJavascriptInterface` 有什么风险？ ⭐⭐

**答：** 注入的对象能被页面 JS 调用，如果加载不可信页面，可能被恶意调用原生能力；只对可信页面开启，方法做白名单/校验，或改用更安全的资源加载方案。

### Q12：Hybrid 的桥调用为什么慢？怎么优化？ ⭐⭐

**答：** 跨语言/跨线程通信、参数序列化、回调排队；减少调用次数、批量合并、避免传大对象、异步化、缓存结果。

---

## 12. 自查清单

- [ ] 能解释 Hybrid 架构和优缺点。
- [ ] 能说出 JSBridge 三种实现。
- [ ] 能手写 H5 端 Promise 桥封装。
- [ ] 能说清 Android/iOS 原生侧怎么接收/回调。
- [ ] 能说出桥安全的白名单/签名/来源校验。
- [ ] 能解释离线包 manifest/校验/回滚。
- [ ] 能说出 Hybrid 首屏优化和调试方式。
- [ ] 能对比 Hybrid/RN/Flutter/原生。
- [ ] 能排查 WebView 白屏/桥不通。
