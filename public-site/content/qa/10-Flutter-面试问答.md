# 10 · Flutter 面试问答分册

> 对应知识文档：[10-Flutter开发.md](../10-Flutter开发.md)
>
> 用法：先自己答，再看“直接回答”；追问遮住答案练。

---

## Q1. Flutter 和 React Native 的区别？怎么选？

**直接回答：**

> Flutter 用 Dart，自己带渲染引擎，UI 是自绘的，各端一致、动画性能好，但包体积大、要学 Dart；RN 用 JS/React，渲染原生组件，前端团队上手快、生态大，但受桥/JSI 和原生组件差异影响。看团队和业务选，不是谁绝对更好。

**追问 1：什么场景更适合 Flutter？**

> 要求各端 UI 高度一致、动画复杂、团队愿意学 Dart、想减少平台差异；比如品牌 App、工具类、跨端桌面/移动。

**追问 2：什么场景更适合 RN？**

> 前端团队已有 React 积累、需要大量原生生态/OTA、页面以业务表单/列表为主。

**陷阱/加分：**

- 不要只说“Flutter 性能好”，RN 也接近原生。
- 能说出包体积、生态、学习成本、热更新差异。

---

## Q2. Flutter 为什么性能好？

**直接回答：**

> 发布时 AOT 编译成机器码；自绘引擎直接绘制，不经过 WebView；布局/绘制在 C++ 层；Widget 重建轻量；可以用 Isolate 做并行计算；Impeller 预编译 shader 减少首帧卡顿。但不是所有场景都比原生快，复杂平台能力仍要原生通道。

**追问 1：Flutter 是编译成原生控件吗？**

> 不是。Flutter 用 Skia/Impeller 自绘，最终绘制到画布/纹理，不是映射成 iOS/Android 原生控件。

**追问 2：为什么 Flutter 包体积大？**

> 自带渲染引擎和 Dart 运行时；基础体积比 RN/H5 大，但可以通过 split-per-abi、混淆、资源优化减小。

**陷阱/加分：**

- AOT 是 release 模式，debug 是 JIT + Hot Reload。
- 性能问题先用 profile 模式 + DevTools 定位。

---

## Q3. Widget、Element、RenderObject 的关系？

**直接回答：**

> Widget 是不可变的配置；Element 是 Widget 在树上的实例，保存 State 和 BuildContext，负责新旧 Widget 的比较；RenderObject 负责布局和绘制。Widget 树 build 出 Element 树，Element 创建/更新 RenderObject 树。

**追问 1：为什么 Widget 不可变？**

> 每次 setState 都生成新的 Widget，React/Flutter 通过比较新旧配置决定更新；不可变让状态变化可预测、便于复用。

**追问 2：Element 为什么能保存 State？**

> Element 是树上稳定的实例，StatefulElement 持有 State；Widget 重建时，只要类型/key 匹配，Element 就复用，State 保留。

**陷阱/加分：**

- Widget 很轻，重建成本低；真正的布局/绘制在 RenderObject。
- Key 影响 Element 能否复用。

---

## Q4. StatelessWidget 和 StatefulWidget 的区别？

**直接回答：**

> StatelessWidget 没有可变状态，props 不变就渲染同样结果；StatefulWidget 有 State，可以调用 setState 触发重建。选择标准：需不需要在组件生命周期内维护可变状态。

**追问 1：StatefulWidget 的 State 为什么单独抽出来？**

> Widget 是不可变的配置，State 是可变对象，生命周期更长；这样 Widget 可以频繁重建，State 保留。

**追问 2：所有状态都要放 State 吗？**

> 不需要。局部 UI 状态用 setState，跨组件用 Provider/Riverpod/Bloc，持久化用存储。

**陷阱/加分：**

- StatefulWidget 本身仍不可变，可变的是 State。
- 不要把全局状态都塞进单个 State。

---

## Q5. StatefulWidget 的生命周期？

**直接回答：**

> createState → initState（一次，初始化）→ didChangeDependencies（依赖变化）→ build（每次重建）→ didUpdateWidget（父组件更新）→ deactivate → dispose（释放资源）。异步回调后要判断 mounted。

**追问 1：initState 里能做什么？不能做什么？**

> 能初始化 controller、发起请求、订阅；不能依赖 BuildContext（还没挂载）、不能直接 setState。

**追问 2：dispose 里要清理什么？**

> TextEditingController、ScrollController、AnimationController、流订阅、定时器、监听器。

**陷阱/加分：**

- `setState() called after dispose()` 常见于异步回调。
- `didChangeDependencies` 可能执行多次。

---

## Q6. BuildContext 是什么？

**直接回答：**

> BuildContext 是 Element 的接口，用来在 Widget 树里查找祖先、读取 Theme/MediaQuery/Provider、获取路由等。不能在 initState 里依赖它，因为那时还没挂载完成。

**追问 1：为什么异步回调里用 context 要小心？**

> 页面可能已经销毁，context 失效；要先判断 `mounted`，或把需要的值提前取出来。

**追问 2：`Theme.of(context)` 做了什么？**

> 沿 Element 树向上查找最近的 Theme，依赖它并注册更新；主题变化时组件会重建。

**陷阱/加分：**

- context 不是全局单例，每个 Widget 有自己的 context。
- 跨页面/全局用 Provider/路由，不要滥用 context。

---

## Q7. Key 有什么用？ValueKey 和 GlobalKey 的区别？

**直接回答：**

> Key 帮 Flutter 在重建时识别同一个 Widget/Element，列表增删排序时保证状态正确复用。ValueKey 按值比较，适合列表项；GlobalKey 全局唯一，可以跨树访问 State/Context，但性能/可维护性差，慎用。

**追问 1：列表排序时为什么要 key？**

> 没有 key 时 Flutter 按位置复用 Element，排序后 State 可能错位；有稳定 key 才能跟着数据走。

**追问 2：什么时候用 UniqueKey？**

> 强制每次重建一个新 Element/State，比如切换表单、重置动画；不要滥用。

**陷阱/加分：**

- key 在兄弟节点之间唯一即可，不需要全局唯一（GlobalKey 除外）。
- 用 index 做 key 和 React 的问题类似。

---

## Q8. setState 做了什么？

**直接回答：**

> 把当前 State 标记为 dirty，安排下一帧重建，调用 build 生成新的 Widget 树，然后 Element 做 diff，更新 RenderObject。setState 不能放在 build 里，异步回调后要注意 mounted。

**追问 1：setState 是同步还是异步？**

> 标记是同步的，重建是异步的（下一帧）；setState 后立刻读 State 字段还是旧值/新值取决于你有没有先改字段。

**追问 2：为什么 setState 里只改一个字段也会重建整个 Widget？**

> 它标记的是当前 State 对应的 Element，build 会重新执行；可以用局部 Widget/ValueListenableBuilder 缩小重建范围。

**陷阱/加分：**

- 在 build 里 setState 会无限循环。
- setState 前要判断 mounted（异步场景）。

---

## Q9. Flutter 的布局约束规则是什么？

**直接回答：**

> Constraints go down, sizes up, parent sets position。父组件给子组件最大/最小约束，子组件在约束内决定自己的尺寸，父组件决定位置。超出约束会 overflow。

**追问 1：为什么 Row/Column 会 overflow？**

> 子项总宽度/高度超过父级约束；用 Expanded/Flexible 让子项收缩，或改成滚动。

**追问 2：为什么 ListView 放在 Column 里会报 unbounded height？**

> Column 给子项的高度约束是无限的，ListView 需要有限高度；用 Expanded 包住，或给固定高度。

**陷阱/加分：**

- `IntrinsicWidth/Height` 会多次测量，性能差。
- `mainAxisSize.min` 可以让 Row/Column 尽量小。

---

## Q10. Expanded 和 Flexible 的区别？

**直接回答：**

> Expanded 是 `flex: 1` 且强制填满剩余空间；Flexible 允许在剩余空间内伸缩，但不强制填满。Row/Column 里要让文本省略，通常用 Expanded + `overflow: ellipsis`。

**追问 1：`flex` 参数怎么用？**

> `Expanded(flex: 2)` 占两份剩余空间；默认 1。

**追问 2：为什么 Expanded 里的 Text 还要 `overflow`？**

> Expanded 只给约束，文本仍可能超出；要加 `maxLines`/`overflow` 或 `FittedBox`。

**陷阱/加分：**

- Expanded/Flexible 只能直接放在 Row/Column/Flex 里。
- 嵌套 Row/Column 时注意约束传递。

---

## Q11. ListView.builder 和 ListView 的区别？

**直接回答：**

> ListView 会一次性构建所有子项；ListView.builder 按需构建可视区域附近的项，长列表性能好。固定行高可以加 itemExtent，进一步减少测量。

**追问 1：ListView 为什么不能直接放很多子项？**

> 所有子项都会创建/布局，内存和启动时间随数量增长。

**追问 2：怎么优化列表项？**

> 用 const、拆小 Widget、RepaintBoundary、缓存图片、避免每次 build 创建新对象；复杂列表用 SliverList/CustomScrollView。

**陷阱/加分：**

- `shrinkWrap: true` 会失去部分懒加载优势，慎用。
- 列表项有状态时用稳定 key。

---

## Q12. Flutter 状态管理怎么选？

**直接回答：**

> 局部状态用 setState；跨组件用 InheritedWidget/Provider；中大型项目用 Riverpod/Bloc；简单快速可以用 GetX。选型看项目规模、团队熟悉度和可测试性，不要过度设计。

**追问 1：Provider 和 Riverpod 的区别？**

> Provider 依赖 BuildContext、运行时查找；Riverpod 编译期安全、不依赖 context、可测试性更好，但学习成本更高。

**追问 2：Bloc 适合什么项目？**

> 大型、事件驱动、状态可追溯、团队协作规范明确的项目；样板代码多。

**陷阱/加分：**

- 不要为了架构而架构，小页面 setState 就够。
- 状态管理要和路由/依赖注入一起考虑。

---

## Q13. Provider 的原理？

**直接回答：**

> Provider 基于 InheritedWidget，把数据放在祖先节点，后代通过 context 查找并监听变化；ChangeNotifier 调用 notifyListeners 后，依赖它的 Consumer/context.watch 会重建。

**追问 1：`Consumer` 和 `context.watch` 的区别？**

> 都能监听；Consumer 只重建 builder 内部，粒度更小；watch 会让整个 build 方法依赖。

**追问 2：`context.read` 和 `context.watch` 的区别？**

> read 只读取不监听，适合事件回调；watch 监听变化，适合 build 里。

**陷阱/加分：**

- Provider 的 value 变化会让所有消费者重建，拆分/选择器很重要。
- 不要在 build 里调用 read 后期待更新。

---

## Q14. FutureBuilder 怎么用？

**直接回答：**

> 把一个 Future 传给 FutureBuilder，根据 connectionState、hasError、data 渲染 loading/error/success。Future 要放在 State 里，避免每次 build 重新创建导致重复请求。

**追问 1：为什么不能直接在 build 里 `FutureBuilder(future: fetch())`？**

> 每次 build 都会新建 Future，触发重复请求/闪烁；要在 initState 创建。

**追问 2：FutureBuilder 能取消请求吗？**

> 不能直接取消；要在 State 里用取消标志/AbortController，并在 dispose 时处理。

**陷阱/加分：**

- `snapshot.hasData` 为 false 不一定是空，可能是还没完成。
- 刷新时用 setState 替换 Future。

---

## Q15. Future 和 Stream 的区别？

**直接回答：**

> Future 表示一次异步结果；Stream 表示连续多个异步事件，可以监听、暂停、取消。适合 WebSocket、传感器、数据库监听。

**追问 1：StreamBuilder 怎么用？**

> 把 Stream 传给 StreamBuilder，根据 snapshot 渲染；适合实时数据。

**追问 2：Stream 有哪两种？**

> 单订阅流和广播流；广播流可以有多个监听者，默认 Stream 只能监听一次。

**陷阱/加分：**

- Stream 要取消订阅，避免内存泄漏。
- `async*` + `yield` 可以生成 Stream。

---

## Q16. Dart 的 Isolate 是什么？

**直接回答：**

> Isolate 是独立的内存和事件循环，通过消息通信，适合 CPU 密集任务，避免阻塞 UI。可以用 `Isolate.run` 或 `compute`。

**追问 1：Isolate 和 async 的区别？**

> async 还在同一个线程的事件循环，不会并行计算；Isolate 是真正的并行，内存隔离。

**追问 2：Isolate 能共享内存吗？**

> 不能直接共享；通过 SendPort/ReceivePort 传消息，数据会被复制/转移。

**陷阱/加分：**

- 不是所有对象都能跨 Isolate 传递。
- 小任务用 Isolate 反而有启动开销。

---

## Q17. Platform Channel 是什么？有哪些类型？

**直接回答：**

> Flutter 和原生通信的机制。MethodChannel 做请求/响应，EventChannel 做持续事件，BasicMessageChannel 做双向消息。正式项目可以用 Pigeon 生成类型安全代码。

**追问 1：MethodChannel 怎么工作？**

> Dart 调用 `invokeMethod`，原生端注册 handler 处理并返回结果；跨平台用平台通道，底层是消息编解码。

**追问 2：什么时候需要 Platform Channel？**

> 系统能力没有现成插件、需要访问特殊 SDK/硬件、性能敏感；否则优先用成熟插件/Expo 类模块。

**陷阱/加分：**

- 原生代码改动要重新编译。
- 通道调用要处理异常/超时。

---

## Q18. Hot Reload 和 Hot Restart 的区别？

**直接回答：**

> Hot Reload 保留 State，只重新构建改动的代码，快；Hot Restart 重启整个 App，State 丢失。修改 main/全局变量/原生代码/资源时通常要 Hot Restart 或重新运行。

**追问 1：为什么有时 Hot Reload 不生效？**

> 改动涉及全局/静态变量、main、原生代码、资源，或状态不可恢复；需要 Hot Restart。

**追问 2：Hot Reload 会影响性能吗？**

> 开发模式是 JIT，性能不能代表 release；性能测试要用 profile 模式。

**陷阱/加分：**

- Hot Reload 不是热更新，不能用于生产。
- 调试和 release 的编译模式不同。

---

## Q19. Flutter 性能怎么优化？

**直接回答：**

> 用 const、拆小 Widget、RepaintBoundary、ValueListenableBuilder 做局部刷新；长列表用 ListView.builder + itemExtent；图片压缩/指定尺寸；动画用 AnimatedBuilder/FadeTransition；重计算用 Isolate；用 profile 模式 + DevTools 定位。

**追问 1：怎么定位掉帧？**

> Flutter DevTools 的 Performance/Frame Chart，看 UI/Raster 线程耗时；Performance Overlay 看是否超过帧预算。

**追问 2：为什么 `Opacity` 动画会卡？**

> 它可能触发保存图层/重绘；用 `FadeTransition`/`AnimatedOpacity` 或 `Color.withOpacity` 的替代方案。

**陷阱/加分：**

- debug 模式下性能差不代表 release 差。
- 不要滥用 `RepaintBoundary`，会增加图层。

---

## Q20. Impeller 是什么？

**直接回答：**

> Flutter 的新渲染引擎，预编译 shader，减少首帧 shader 编译卡顿，提升渲染稳定性。新版在 iOS/Android 上默认使用，低端设备可能回退 Skia。

**追问 1：Impeller 解决了什么？**

> Skia 的 shader 编译可能导致首帧卡顿；Impeller 预编译，减少 jank。

**追问 2：Impeller 和 Skia 的关系？**

> 都是渲染后端；Impeller 是新的，逐步替代 Skia，但不是所有平台/设备都默认启用。

**陷阱/加分：**

- 渲染引擎和 JS 引擎（Dart VM）不是一回事。
- 性能问题要分 UI 线程/Raster 线程/IO。

---

## Q21. Flutter 怎么打包发布？能热更新吗？

**直接回答：**

> Android 用 `flutter build apk/appbundle --release`，配置 keystore；iOS 用 `flutter build ipa`，需要 macOS/Xcode/证书；可加 `--obfuscate --split-debug-info`；用 flavors 区分环境。官方不支持 Dart 代码热更新，只能发版/资源下发/原生动态化。

**追问 1：怎么减小包体积？**

> split-per-abi、混淆、移除未用资源、压缩图片、延迟组件、按需加载。

**追问 2：热更新为什么不行？**

> Flutter 编译成机器码/字节码，官方不允许运行时替换 Dart 代码；社区方案有政策和兼容风险。

**陷阱/加分：**

- iOS 上架需要证书/描述文件。
- 发版要留回滚和灰度。

---

## Q22. Dart 的空安全是什么？

**直接回答：**

> Dart 是强类型 + 空安全语言。可空类型用 `?`，非空类型不能赋 null；用 `?.`、`!`、`??` 处理空值；`late` 用于延迟初始化。好处是大量空指针错误在编译期被拦住。

**追问 1：`!` 有什么风险？**

> 如果值真的是 null，会在运行时抛错；不要滥用，优先用 `?.`/`??`/判空。

**追问 2：`late` 用在什么场景？**

> 延迟初始化、依赖注入、State 里稍后赋值的字段；使用前必须赋值，否则 LateInitializationError。

**陷阱/加分：**

- 空安全不是“不会有空指针”，是编译期检查 + 运行时断言。
- 和 TS 的 strictNullChecks 类似。

---

## Q23. Flutter 为什么包体积大？怎么优化？

**直接回答：**

> 自带渲染引擎和 Dart 运行时，基础体积比 RN/H5 大。优化：split-per-abi、混淆、移除未用资源、压缩图片/字体、延迟组件、按需加载、分析包体积。

**追问 1：`--split-per-abi` 是什么？**

> 按 CPU 架构拆分 APK，用户只下载对应架构，减小单包体积；但要多传几个包。

**追问 2：怎么分析包体积？**

> `flutter build apk --analyze-size` 或 DevTools 的 App Size 工具，看资源/代码/引擎占比。

**陷阱/加分：**

- 包体积和性能要平衡，不要为了小包砍掉必要资源。
- iOS 的 App Thinning 也会帮助分发。

---

## 24. 快速自测

- [ ] 能对比 Flutter/RN/原生。
- [ ] 能解释三棵树和 Widget 不可变。
- [ ] 能说出 StatefulWidget 生命周期和 dispose。
- [ ] 能解释布局约束和 overflow。
- [ ] 能区分 Expanded/Flexible。
- [ ] 能说出状态管理选型和 Provider 原理。
- [ ] 能解释 Future/Stream/FutureBuilder。
- [ ] 能解释 Isolate 和 Platform Channel。
- [ ] 能说出性能优化和 Impeller。
- [ ] 能讲打包/包体积/热更新限制。
- [ ] 能解释 Dart 空安全。
