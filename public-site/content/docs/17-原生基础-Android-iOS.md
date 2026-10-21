# 17 · 原生基础（Android / iOS）

> 目标：前端做 RN/Flutter/Hybrid 时，能看懂原生工程、定位原生问题、和原生同学有效沟通；面试能回答 Android/iOS 基础题。
>
> 标记：⭐⭐⭐ 必须会｜⭐⭐ 要理解｜⭐ 了解即可

---

## 1. 为什么前端要懂原生

- RN/Flutter/Hybrid 都跑在原生壳里，启动、权限、崩溃、发版都绕不开原生。
- 面试 JD 常写“有原生 App 开发经验优先”。
- 出问题时，能判断是 JS 层、桥层还是原生层。
- 能自己接 SDK/写 NativeModule/Platform Channel。

---

## 2. Android 基础

### 2.1 四大组件

| 组件 | 作用 |
|---|---|
| Activity | 一个屏幕/页面 |
| Service | 后台任务/长期运行 |
| BroadcastReceiver | 接收广播 |
| ContentProvider | 跨应用数据共享 |

前端最常接触：Activity（承载 RN/Flutter/WebView 页面）、Service（推送/后台）、BroadcastReceiver（网络/电量变化）。

### 2.2 Activity 生命周期

```text
onCreate → onStart → onResume → onPause → onStop → onDestroy
                ↑________onRestart________|
```

| 回调 | 时机 | 常见操作 |
|---|---|---|
| onCreate | 创建 | setContentView、初始化 |
| onStart | 可见 | 注册监听 |
| onResume | 可交互 | 启动动画/定位 |
| onPause | 失去焦点 | 暂停动画/保存状态 |
| onStop | 不可见 | 释放资源 |
| onDestroy | 销毁 | 清理 |
| onRestart | 从停止恢复 | 重新加载 |

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }

    override fun onResume() {
        super.onResume()
        // 页面可见，恢复
    }

    override fun onPause() {
        super.onPause()
        // 页面失去焦点，暂停
    }
}
```

### 2.3 Intent

```kotlin
// 显式：跳转到指定 Activity
val intent = Intent(this, DetailActivity::class.java)
intent.putExtra("id", 1)
startActivity(intent)

// 隐式：打开浏览器/相机
val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com"))
startActivity(intent)
```

### 2.4 Manifest 与权限

```xml
<manifest ...>
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application ...>
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

运行时权限（Android 6+）：

```kotlin
val launcher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { granted ->
    if (granted) openCamera() else showPermissionTip()
}

launcher.launch(Manifest.permission.CAMERA)
```

Android 13+ 媒体权限拆分为 `READ_MEDIA_IMAGES/VIDEO/AUDIO`。

### 2.5 Gradle 与构建

- `build.gradle` / `build.gradle.kts`：依赖、签名、flavor、构建类型。
- `debug` / `release`：不同签名/混淆/接口。
- `productFlavors`：多渠道/环境。
- `minSdk/targetSdk/compileSdk`：最低/目标/编译版本。

```kotlin
android {
    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    signingConfigs {
        create("release") {
            storeFile = file("release.keystore")
            storePassword = System.getenv("STORE_PASSWORD")
            keyAlias = "release"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

构建：

```bash
./gradlew assembleDebug     # debug apk
./gradlew assembleRelease   # release apk
./gradlew bundleRelease     # aab（上架 Google Play）
```

### 2.6 APK vs AAB

| 格式 | 用途 |
|---|---|
| APK | 直接安装/国内应用市场 |
| AAB | Google Play 上架，由商店生成 APK |

### 2.7 Proguard / R8

- 压缩/混淆代码，减小包体积。
- 反射/JSBridge/RN 原生模块可能需要 keep 规则，否则运行时找不到类。
- 保留 mapping 文件，用于还原崩溃栈。

### 2.8 主线程、Looper、Handler

- Android UI 只能在主线程更新。
- 主线程有 Looper，循环处理消息。
- 子线程用 Handler 切回主线程。
- 主线程阻塞超过 5 秒会 ANR。

```kotlin
Handler(Looper.getMainLooper()).post {
    // 主线程更新 UI
}
```

### 2.9 logcat 与 ANR

```bash
adb logcat
adb logcat -s MyApp
```

ANR：

- 主线程阻塞（IO/锁/计算）。
- 看 `/data/anr/traces.txt` 或开发者选项中的 ANR 日志。
- 常见原因：主线程网络/数据库、死锁、Binder 调用慢。

---

## 3. iOS 基础

### 3.1 App 生命周期

现代 iOS：

- `AppDelegate` 处理启动/后台/推送等。
- `SceneDelegate` 处理多窗口 UI 生命周期（iOS 13+）。

```swift
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        return true
    }
}
```

### 3.2 UIViewController 生命周期

```text
init → viewDidLoad → viewWillAppear → viewDidAppear
     → viewWillDisappear → viewDidDisappear → deinit
```

| 回调 | 时机 |
|---|---|
| viewDidLoad | 视图加载完成，只一次 |
| viewWillAppear | 即将显示 |
| viewDidAppear | 已经显示 |
| viewWillDisappear | 即将消失 |
| viewDidDisappear | 已经消失 |
| didReceiveMemoryWarning | 内存警告 |

```swift
override func viewDidLoad() {
    super.viewDidLoad()
    // 初始化 UI
}

override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    // 刷新数据
}
```

### 3.3 Info.plist 与权限

```xml
<key>NSCameraUsageDescription</key>
<string>用于扫码</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>用于选择图片</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>用于展示附近门店</string>
```

缺少描述会导致审核被拒/请求权限崩溃。

### 3.4 CocoaPods / SPM

- CocoaPods：`Podfile`，`pod install`，生成 `.xcworkspace`。
- Swift Package Manager：Xcode 内置，`Package.swift`。
- RN/Flutter 项目常见 Podfile；改原生依赖后要重新 `pod install`。

### 3.5 Xcode 与签名

- 证书（Certificate）：开发/发布。
- Provisioning Profile：把证书、App ID、设备绑定起来。
- Bundle Identifier：应用唯一标识。
- Team：开发者团队。
- Archive → 上传 App Store Connect → TestFlight/审核。

### 3.6 上架流程

1. 配置 Bundle ID/证书/描述文件。
2. Xcode Archive。
3. 上传 App Store Connect。
4. TestFlight 测试。
5. 提交审核。
6. 发布/灰度。

---

## 4. 跨端与原生通信

### 4.1 RN NativeModule（旧架构）

```kotlin
class BatteryModule(reactContext: ReactContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "Battery"

    @ReactMethod
    fun getLevel(promise: Promise) {
        promise.resolve(80)
    }
}
```

```js
import { NativeModules } from 'react-native';
const level = await NativeModules.Battery.getLevel();
```

新架构用 TurboModule + Codegen，JS 通过 JSI 调用，减少桥开销。

### 4.2 Flutter Platform Channel

```dart
static const channel = MethodChannel('app/battery');
final level = await channel.invokeMethod<int>('getBatteryLevel');
```

Android/iOS 侧注册 MethodChannel handler 并返回结果。详见 10 文档。

### 4.3 Hybrid JSBridge

原生 WebView 注入对象/拦截 URL，和 H5 通信；详见 15 文档。

---

## 5. 原生崩溃与调试

### 5.1 Android

- `adb logcat`：Java/Kotlin 崩溃、原生崩溃。
- `tombstone`：Native crash（C/C++）。
- ANR traces：主线程卡死。
- Proguard mapping：还原混淆后的堆栈。
- Crash 平台：Firebase Crashlytics/友盟/Sentry。

### 5.2 iOS

- Xcode Devices/Console。
- Crash 日志 + dSYM 符号化。
- 内存警告/EXC_BAD_ACCESS/OOM。
- TestFlight 崩溃反馈。

### 5.3 跨端

- RN：JS 异常看 Metro/ErrorBoundary；原生崩溃看 logcat/Xcode；sourcemap 还原 JS 栈。
- Flutter：Dart 异常看 Flutter logs；原生崩溃看 logcat/Xcode；符号表还原。
- Hybrid：WebView 白屏看 Console/Network + 原生日志。

---

## 6. 性能基础

| 平台 | 要点 |
|---|---|
| Android | 主线程不阻塞、减少布局层级、图片压缩、内存泄漏（LeakCanary）、启动优化 |
| iOS | 主线程不阻塞、Auto Layout 性能、图片解码、内存警告、启动优化 |
| RN | JS 线程、Bridge/JSI、FlatList、图片、动画 |
| Flutter | UI/Raster 线程、const、RepaintBoundary、ListView.builder |
| Hybrid | WebView 预热、离线包、资源缓存、桥调用 |

---

## 7. 面试高频

### Q1：Activity 生命周期？ ⭐⭐⭐

**答：** onCreate → onStart → onResume → onPause → onStop → onDestroy，停止后回来会走 onRestart。onCreate 做初始化，onResume 可交互，onPause 暂停，onStop 释放资源，onDestroy 清理。

### Q2：Android 四大组件？ ⭐⭐

**答：** Activity、Service、BroadcastReceiver、ContentProvider；分别负责页面、后台任务、广播、跨应用数据。

### Q3：Android 权限怎么处理？ ⭐⭐

**答：** Manifest 声明 + 运行时请求（Android 6+）；用户拒绝要解释/引导，永久拒绝去设置；Android 13+ 媒体权限拆分。

### Q4：APK 和 AAB 的区别？ ⭐⭐

**答：** APK 可直接安装/国内市场上架；AAB 是 Google Play 的分发格式，商店根据设备生成 APK，体积更小。

### Q5：Proguard/R8 有什么用？ ⭐⭐

**答：** 压缩/混淆代码、减小包体积；反射/RN 原生模块/JSBridge 可能要 keep 规则；保留 mapping 还原崩溃栈。

### Q6：iOS ViewController 生命周期？ ⭐⭐⭐

**答：** viewDidLoad → viewWillAppear → viewDidAppear → viewWillDisappear → viewDidDisappear → deinit；viewDidLoad 只一次，viewWillAppear 每次显示前。

### Q7：AppDelegate 和 SceneDelegate 的区别？ ⭐⭐

**答：** AppDelegate 管应用级生命周期/启动/推送；SceneDelegate 管多窗口 UI 生命周期（iOS 13+）。

### Q8：iOS 签名/上架流程？ ⭐⭐

**答：** 配 Bundle ID、证书、Provisioning Profile；Xcode Archive；上传 App Store Connect；TestFlight；提交审核；发布。

### Q9：RN 怎么调原生？ ⭐⭐

**答：** 旧架构写 NativeModule，通过 Bridge 暴露方法；新架构用 TurboModule + Codegen，通过 JSI 调用；业务优先用成熟库。

### Q10：Flutter 怎么调原生？ ⭐⭐

**答：** Platform Channel：MethodChannel 请求/响应，EventChannel 持续事件，BasicMessageChannel 双向消息；正式项目用 Pigeon 生成类型安全代码。

### Q11：ANR 是什么？怎么排查？ ⭐⭐⭐

**答：** Application Not Responding，主线程阻塞超过 5 秒；看 logcat/ANR traces，定位主线程 IO/锁/计算；优化异步/减少主线程工作。

### Q12：iOS 崩溃怎么符号化？ ⭐⭐

**答：** 用 dSYM + 崩溃日志，通过 Xcode/atos/Sentry 还原；保留每次发版的 dSYM。

### Q13：为什么不能在子线程更新 UI？ ⭐⭐

**答：** Android/iOS 的 UI 框架不是线程安全的；必须在主线程更新，子线程通过 Handler/DispatchQueue.main 切回。

### Q14：原生 App 启动慢怎么优化？ ⭐⭐

**答：** 减少启动初始化、延迟非关键任务、异步 IO、图片/资源优化、启动埋点/火焰图；Android 用 Baseline Profiles/Startup 库，iOS 用 Instruments。

---

## 8. 自查清单

- [ ] 能背 Activity/ViewController 生命周期。
- [ ] 知道 Android 四大组件。
- [ ] 会处理 Android/iOS 权限。
- [ ] 知道 APK/AAB、签名、Proguard/R8。
- [ ] 知道 iOS 证书/描述文件/TestFlight。
- [ ] 能解释 RN NativeModule/Flutter Channel。
- [ ] 会用 logcat/Xcode 排查崩溃/ANR。
- [ ] 知道主线程/UI 线程限制。
- [ ] 能说出原生启动/性能优化方向。
