# 06 · React Native 面试问答分册

> 对应知识文档：[05-React与ReactNative.md](../05-React与ReactNative.md) 的 RN 部分
>
> 用法：先自己答，再看“直接回答”；追问遮住答案练。

---

## Q1. RN 和 H5 的区别？

**直接回答：**

> RN 渲染的是原生组件，不是 WebView/DOM；样式用 JS 对象和 Flex，默认 column；没有 CSS 级联；路由用 react-navigation；通过 Bridge/JSI 调原生能力；发布走应用商店或 OTA。H5 用 DOM/CSS，浏览器渲染，部署简单，但性能和原生体验不如 RN。

**追问 1：RN 是 WebView 套壳吗？**

> 不是。RN 的 JS 代码通过原生组件渲染，和 WebView 完全不同的机制；Hybrid 才是原生壳 + WebView。

**追问 2：RN 能复用 React 代码吗？**

> 业务逻辑、Hooks、状态管理可以复用；UI 组件要换成 View/Text，DOM/CSS 相关代码不能直接用。

**陷阱/加分：**

- RN 没有 `div/span`，文本必须放在 `Text` 里。
- RN 的样式没有继承/级联，只有部分文本样式会继承。

---

## Q2. RN 旧架构的 Bridge 有什么问题？

**直接回答：**

> 旧架构通过 Bridge 在 JS 和原生之间异步通信，数据要序列化成 JSON，批量排队；高频调用（滚动、手势）容易拥堵，启动时还要初始化所有原生模块。它有三个线程：JS 线程、Shadow 线程算布局、UI 线程渲染。

**追问 1：为什么 Bridge 是异步的？**

> 为了不阻塞 JS 线程和 UI 线程，消息进入队列后由另一端处理；代价是不能同步拿结果。

**追问 2：Bridge 的序列化开销在哪里？**

> JS 和原生之间传的数据要转成 JSON/字符串，数据量大或调用频繁时，序列化/反序列化和队列等待都会变慢。

**陷阱/加分：**

- Bridge 不是唯一的性能问题，JS 线程上的重计算也会卡。
- 新架构不是简单“删掉 Bridge”，而是用 JSI 等机制替代。

---

## Q3. RN 新架构包含哪些部分？

**直接回答：**

> 主要有 JSI、Fabric、TurboModules、Codegen、Hermes。JSI 让 JS 直接调用 C++/原生对象，支持同步；Fabric 是 C++ 渲染器，支持同步布局和并发；TurboModules 按需加载原生模块；Codegen 生成类型安全的胶水代码；Hermes 预编译字节码提升启动。

**追问 1：JSI 和 Bridge 的区别？**

> Bridge 是异步消息队列 + JSON 序列化；JSI 是 C++ 接口，JS 可以直接持有原生对象引用并同步调用，减少序列化和排队。

**追问 2：Fabric 解决了什么？**

> 用 C++ 实现 shadow tree，布局可以同步拿到，减少白屏/闪烁，更好地支持 React 18 并发渲染。

**陷阱/加分：**

- 新架构不是所有第三方库都兼容，升级要测。
- Hermes 是 JS 引擎，不是渲染器。

---

## Q4. Hermes 是什么？为什么 RN 用它？

**直接回答：**

> Hermes 是 Meta 为 RN 优化的 JS 引擎，把 JS 预编译成字节码，启动更快、内存更小，支持 Profiler。它没有 JIT，峰值计算性能可能不如 V8，但移动端更看重启动和内存。

**追问 1：Hermes 和 JSC 的区别？**

> JSC 是 Safari 的 JS 引擎，支持 JIT；Hermes 更轻量、启动快、内存小，适合移动端。

**追问 2：Hermes 有什么限制？**

> 没有 JIT，极重计算可能慢；部分依赖 JIT 的库/特性要测；调试工具和 V8 不同。

**陷阱/加分：**

- Hermes 的字节码可以预编译进包，减少启动解析时间。
- 性能问题先用 Profiler 确认是不是 JS 线程。

---

## Q5. RN 的 Flex 和 Web 有什么不同？

**直接回答：**

> RN 默认 `flexDirection: column`，所有 View 默认就是 Flex；`flex: 1` 表示可伸缩填满；不支持 `display: inline`；没有 CSS 级联；单位是数字 dp；`position` 默认 relative。iOS/Android 的阴影写法也不同。

**追问 1：RN 里怎么让文本省略？**

> `Text` 加 `numberOfLines={1}` 和 `ellipsizeMode="tail"`；容器加 `flex: 1` 和 `minWidth: 0`（或 `flexShrink: 1`）。

**追问 2：RN 的 `flex: 1` 和 Web 一样吗？**

> 都表示可伸缩，但 RN 的默认主轴是 column，使用时要注意方向；RN 没有 `flex-basis` 的百分比简写那么灵活。

**陷阱/加分：**

- RN 没有 `px/rem/vw`，数字就是 dp。
- RN 的 `position: 'absolute'` 相对父容器，不是视口。

---

## Q6. RN 的核心组件有哪些？

**直接回答：**

> 容器用 `View`，文本用 `Text`，图片用 `Image`，输入用 `TextInput`，点击用 `Pressable`，长列表用 `FlatList`，分组列表用 `SectionList`，滚动容器用 `ScrollView`，加载用 `ActivityIndicator`，弹窗用 `Modal`，安全区用 `SafeAreaView`（推荐 `react-native-safe-area-context`）。

**追问 1：为什么文本必须放在 `Text` 里？**

> RN 没有 DOM 文本节点，原生文本渲染需要 `Text` 组件；直接写字符串会报错。

**追问 2：`Pressable` 和 `TouchableOpacity` 怎么选？**

> 新代码优先 `Pressable`，可以自定义按下状态、支持 hover/focus；`TouchableOpacity` 是旧组件，简单场景仍可用。

**陷阱/加分：**

- `Image` 的网络图片要指定宽高，否则可能不显示。
- `ScrollView` 不适合长列表，用 `FlatList`。

---

## Q7. FlatList 怎么优化？

**直接回答：**

> `keyExtractor` 用稳定 id；固定行高用 `getItemLayout` 跳过测量；`initialNumToRender` 控制首屏；`maxToRenderPerBatch` 和 `windowSize` 控制渲染窗口；`removeClippedSubviews` 移除屏幕外视图；列表项用 `memo`；`renderItem` 不要每次创建新函数/对象；分页加载；图片指定尺寸；`extraData` 处理外部状态。

**追问 1：`getItemLayout` 的原理？**

> 直接告诉列表每项的高度和偏移，跳过测量，滚动和跳转更快；行高不固定时不能用。

**追问 2：`removeClippedSubviews` 有什么坑？**

> 复杂 item、动画、绝对定位可能被错误裁剪；Android 上要重点测，必要时关掉。

**陷阱/加分：**

- `keyExtractor` 缺失时默认用 index，列表变化会错乱。
- `FlatList` 不要嵌套在 `ScrollView` 里，会失去虚拟化。

---

## Q8. ScrollView 和 FlatList 的区别？

**直接回答：**

> `ScrollView` 会一次性渲染所有子元素，适合少量内容；`FlatList` 基于 VirtualizedList，只渲染可视区域附近的项并复用，适合长列表。

**追问 1：为什么长列表用 ScrollView 会卡？**

> 1000 条数据会创建 1000 个原生视图，内存和启动时间都爆炸。

**追问 2：什么时候可以用 ScrollView？**

> 页面内容少、需要整体滚动、内部有多个不同区块；长列表/无限滚动用 FlatList。

**陷阱/加分：**

- FlatList 的 `ListHeaderComponent` 可以放页面头部，不要用外层 ScrollView 包。
- SectionList 适合分组数据。

---

## Q9. RN 的导航怎么做？

**直接回答：**

> 用 react-navigation：`NavigationContainer` 包住，`createNativeStackNavigator` 创建栈，`Stack.Screen` 注册页面；跳转用 `navigation.navigate('Detail', { id })`，详情页用 `route.params` 接收，返回用 `goBack()`。

**追问 1：`navigate` 和 `push` 的区别？**

> `navigate` 如果目标已在栈中可能复用/回退；`push` 总是压入新页面。具体行为看导航器版本。

**追问 2：怎么做底部 tab + 栈导航？**

> 用 `createBottomTabNavigator` 包多个 Stack，每个 tab 内部有自己的栈；登录页可以放在根 Stack 外层。

**陷阱/加分：**

- 参数尽量只传 id，详情页自己请求数据，避免大对象。
- 深链接要配置 linking。

---

## Q10. RN 动画怎么做？为什么卡？

**直接回答：**

> 简单动画用 `Animated`，加 `useNativeDriver: true` 让动画跑在 UI 线程；复杂手势/动画用 `react-native-reanimated`，worklet 跑在 UI 线程；布局变化可以用 `LayoutAnimation`。卡顿通常是因为动画跑在 JS 线程，主线程一忙就掉帧。

**追问 1：`useNativeDriver` 有什么限制？**

> 只支持 transform/opacity 等原生可驱动属性，不支持 width/height/backgroundColor 等布局/颜色属性。

**追问 2：Reanimated 为什么快？**

> 它把动画逻辑放到 UI 线程的 worklet 上执行，不依赖 JS 线程每帧通信。

**陷阱/加分：**

- 不要在动画过程中频繁 setState。
- 尊重减少动画的无障碍设置。

---

## Q11. RN 怎么调用原生能力？

**直接回答：**

> 旧架构写 NativeModule（Java/Kotlin/OC/Swift），通过 Bridge 暴露方法；新架构用 TurboModule + Codegen。业务里优先用 Expo 模块或成熟第三方库，避免自己写原生代码。

**追问 1：原生模块怎么通信？**

> 用 MethodChannel 式的 `NativeModules` 调用方法，或 EventEmitter 监听事件；新架构用 JSI/TurboModule 直接调用。

**追问 2：什么时候必须写原生？**

> 系统能力没有现成库、性能敏感、需要访问特殊硬件/SDK 时；否则优先 JS/Expo 方案。

**陷阱/加分：**

- 原生代码改动要重新编译，不能只 Reload JS。
- iOS/Android 权限要分别配置。

---

## Q12. RN 怎么做屏幕适配和安全区？

**直接回答：**

> 用 Flex 布局、百分比、`useWindowDimensions`；字体/间距按设计稿比例换算；图片用 `resizeMode`；安全区用 `react-native-safe-area-context`；平板/横屏单独适配；避免写死宽高。

**追问 1：`Dimensions` 和 `useWindowDimensions` 怎么选？**

> `useWindowDimensions` 会随屏幕旋转/分屏更新，优先用；`Dimensions.get` 是静态快照，可能不更新。

**追问 2：刘海屏/底部手势区怎么处理？**

> 用 `SafeAreaView`/`useSafeAreaInsets` 加 padding，不要用固定状态栏高度。

**陷阱/加分：**

- RN 的单位是 dp，不是物理像素。
- 不同 Android 机型的状态栏/导航栏高度不同。

---

## Q13. RN 怎么做网络请求和存储？

**直接回答：**

> 请求用 fetch 或 axios，超时用 AbortController，注意 Android 明文 HTTP 和 iOS ATS；存储用 AsyncStorage（异步、字符串）、MMKV（高频/大量）、SecureStore（敏感信息）。

**追问 1：`fetch` 怎么设置超时？**

> 用 `AbortController` + `setTimeout`，超时后 `controller.abort()`；fetch 本身没有 timeout 参数。

**追问 2：token 存哪里？**

> 敏感 token 用 `expo-secure-store`/Keychain/Keystore，不要放 AsyncStorage；普通偏好设置可以 AsyncStorage。

**陷阱/加分：**

- Android 9+ 默认禁止明文 HTTP。
- iOS ATS 也会限制 HTTP。
- 大列表/频繁读写不要用 AsyncStorage。

---

## Q14. RN 怎么调试？

**直接回答：**

> Metro 终端看日志和打包错误；模拟器 `Ctrl+M`/`Cmd+D` 打开 Dev Menu；用 React Native DevTools 看组件树/Profiler；原生日志用 `npx react-native log-android` 或 Xcode 控制台；真机用 Expo Go 扫码/USB 调试。

**追问 1：红屏怎么排查？**

> 先看完整错误和调用栈，再看是 JS 异常、模块解析失败、原生崩溃还是网络问题；JS 问题先看 Metro，原生崩溃看 logcat/Xcode。

**追问 2：怎么定位 JS 线程卡顿？**

> 用 Performance Monitor 看 FPS/JS 线程，用 Profiler 录制；找出长任务、频繁 setState、大列表渲染。

**陷阱/加分：**

- `console.log` 在生产环境要移除/降级。
- 原生崩溃看 logcat/Xcode，不是 Metro。

---

## Q15. RN 性能优化有哪些？

**直接回答：**

> 长列表用 FlatList + 分页 + `getItemLayout` + memo；动画用 `useNativeDriver`/Reanimated；图片压缩、指定尺寸、缓存；减少重渲染（memo/useCallback）；减少 JS 线程长任务；Hermes；按需加载；包体积优化。

**追问 1：怎么量化？**

> FPS、首屏时间、JS 线程长任务、内存、包体积；用 Performance Monitor/Profiler/线上监控对比优化前后。

**追问 2：启动慢怎么优化？**

> 减少启动时的同步初始化、按需加载模块、Hermes、RAM bundle/内联 require、延迟非关键任务。

**陷阱/加分：**

- 不要用 ScrollView 渲染长列表。
- 不要在 render/滚动回调里做重计算。

---

## Q16. RN 怎么打包发布？支持热更新吗？

**直接回答：**

> Android 用 `./gradlew assembleRelease`/`bundleRelease` 或 Expo EAS Build 打 APK/AAB；iOS 用 Xcode Archive 或 Expo EAS Build 上传 App Store；OTA 只替换 JS bundle，可用 EAS Update 或自建方案。

**追问 1：热更新有什么限制？**

> 只能更新 JS/资源，不能改原生代码；受应用商店政策限制，不能绕过审核；需要版本兼容和回滚机制。

**追问 2：CodePush 还能用吗？**

> 微软 App Center 已停止服务，老项目要迁移；现在多用 EAS Update 或自建 OTA。

**陷阱/加分：**

- 发版要留回滚方案。
- OTA 更新要考虑 JS 与原生版本兼容。

---

## Q17. RN 白屏怎么排查？

**直接回答：**

> 先分三类：JS 异常（ErrorBoundary/Metro 日志）、bundle 没加载（Metro/资源/CDN）、原生崩溃（logcat/Xcode）。看错误日志、复现机型/版本、检查最近发版/配置，再决定回滚或热修。

**追问 1：怎么防白屏？**

> 加错误边界、启动兜底页、JS 异常上报、bundle 加载失败重试、灰度发布。

**追问 2：只有部分安卓机白屏？**

> 可能是原生库/ABI/机型兼容、权限、明文 HTTP、Hermes 字节码问题；看 logcat 和崩溃平台。

**陷阱/加分：**

- 白屏不一定是 JS 错，也可能是原生启动失败。
- 线上要有 sourcemap/符号表还原堆栈。

---

## Q18. RN 和 Flutter 怎么选？

**直接回答：**

> 前端团队、想复用 React 能力、依赖大量原生生态，选 RN 更顺；要求各端 UI 高度一致、动画复杂、团队愿意学 Dart，选 Flutter 更合适；需要深度平台能力/极致性能，还是原生。

**追问 1：Flutter 的优势？**

> 自绘引擎、各端一致、动画性能好、AOT；代价是包体积大、Dart 学习成本、生态相对小。

**追问 2：RN 的优势？**

> JS/React 生态、前端上手快、原生组件体验、OTA 能力；代价是原生差异、桥/JSI 通信成本。

**陷阱/加分：**

- 没有绝对更好，看团队/业务/长期维护。
- 混合团队可以 RN + 原生模块，Flutter + Platform Channel。

---

## Q19. RN 的权限怎么处理？

**直接回答：**

> Android 在 `AndroidManifest.xml` 声明，iOS 在 `Info.plist` 声明，运行时还要用权限库请求；用户拒绝后要给解释和引导，不能死循环弹窗。

**追问 1：相机/相册/定位分别要什么权限？**

> Android 的 CAMERA、READ_MEDIA_IMAGES、ACCESS_FINE_LOCATION；iOS 的 NSCameraUsageDescription、NSPhotoLibraryUsageDescription、NSLocationWhenInUseUsageDescription。

**追问 2：用户永久拒绝怎么办？**

> 提示去系统设置打开，提供 `Linking.openSettings()`；关键功能要有降级方案。

**陷阱/加分：**

- 权限文案要写清楚用途，审核会看。
- 不要一启动就请求所有权限。

---

## Q20. RN 图片怎么优化？

**直接回答：**

> 使用合适尺寸的缩略图、CDN、压缩格式（WebP/AVIF）、缓存；`Image` 指定宽高，`resizeMode` 选 cover/contain；长列表用 `expo-image` 或带缓存的图片库；避免加载原图。

**追问 1：为什么网络图片不显示？**

> 常见原因：没有宽高、URL 是 HTTP（ATS/明文限制）、域名/证书问题、图片加载失败没有兜底。

**追问 2：图片缓存怎么做？**

> `expo-image`/`react-native-fast-image` 自带内存/磁盘缓存；也可以自己用文件系统 + 哈希 URL 缓存。

**陷阱/加分：**

- 大图会占内存，列表里尤其明显。
- 图片加载失败要有占位/重试。

---

## Q21. RN 的热更新为什么不能更新原生代码？

**直接回答：**

> 热更新替换的是 JS bundle 和资源，原生代码（Java/Kotlin/OC/Swift）已经编译进安装包，不能运行时替换；要改原生只能发新版本。OTA 还要遵守应用商店政策。

**追问 1：那原生bug怎么热修？**

> 尽量把逻辑放 JS 层；原生问题通过发版、服务端开关降级、动态化方案（成本高）处理。

**追问 2：OTA 怎么保证安全？**

> 签名校验、版本兼容、灰度、回滚、监控；不要用来绕过审核。

**陷阱/加分：**

- OTA 包要和当前原生版本匹配。
- 失败要能自动回滚到内置 bundle。

---

## 22. 快速自测

- [ ] 能说出 RN 和 H5/Hybrid 的区别。
- [ ] 能解释 Bridge 的问题和新架构四件套。
- [ ] 能解释 Hermes 的取舍。
- [ ] 能说出 RN Flex 和 Web 的差异。
- [ ] 能背 FlatList 优化清单。
- [ ] 能解释 ScrollView/FlatList 的区别。
- [ ] 会 react-navigation 传参/返回。
- [ ] 能解释动画为什么卡、怎么优化。
- [ ] 会 Platform Channel/原生模块的基本流程。
- [ ] 能说出 RN 发版/OTA/白屏排查。
- [ ] 能对比 RN 和 Flutter。
