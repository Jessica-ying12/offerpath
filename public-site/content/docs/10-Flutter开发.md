# 10 · Flutter 开发

> 目标：理解 Flutter 的运行机制，掌握 Dart 基础、Widget 布局、状态管理、导航、网络、平台通道、性能优化和打包发布；能独立做一个列表 + 详情 + 搜索的 App。
>
> 说明：Flutter 不在你这份 JD 的硬性要求里，但移动端岗位常把它作为加分项，而且“跨端框架”的很多思想（声明式 UI、组件化、状态管理、原生通信）和 React Native 是相通的。
>
> 标记：⭐⭐⭐ 必须会｜⭐⭐ 要理解｜⭐ 了解即可

---

## 1. Flutter 是什么

Flutter 是 Google 的跨平台 UI 工具包：

- 语言：**Dart**。
- 一套代码：Android、iOS、Web、Windows、macOS、Linux。
- 渲染：自己带渲染引擎（Skia / 新版 Impeller），不依赖 WebView，也不依赖原生 UI 组件。
- 发布：Android/iOS 用 **AOT** 编译成机器码；开发时用 JIT + Hot Reload。

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('你好 Flutter')),
        body: const Center(child: Text('Hello Flutter')),
      ),
    );
  }
}
```

### 1.1 和 React Native / H5 / 原生的区别

| 维度 | Flutter | React Native | H5 | 原生 |
|---|---|---|---|---|
| 语言 | Dart | JS/TS + JSX | HTML/CSS/JS | Kotlin/Swift |
| UI 渲染 | 自绘引擎（Skia/Impeller） | 原生组件 | 浏览器 DOM | 原生组件 |
| 性能 | 接近原生 | 接近原生（受桥/JSI 影响） | 受 WebView 限制 | 最好 |
| 一致性 | 各端像素级一致 | 依赖原生组件差异 | 浏览器差异 | 平台各自实现 |
| 热更新 | 官方不支持代码热更新（可做资源/灰度） | 可 OTA | 即时 | 不支持 |
| 包体积 | 较大（引擎） | 较小 | 无 | 最小 |
| 学习曲线 | Dart + Widget | React + 原生概念 | Web 技术 | 平台原生 |
| 生态 | 快速增长 | 很大 | 最大 | 官方 |
| 适合 | 高一致性、动画复杂、跨端 | 前端团队快速做 App | 页面/活动/轻应用 | 深度平台能力 |

**一句话：**

- 前端团队转 App：RN 更顺。
- 要求各端 UI 高度一致、动画复杂：Flutter 更合适。
- 需要深度调用系统能力/极致性能：原生。

---

## 2. 环境准备

### 2.1 安装

1. 下载 Flutter SDK：https://flutter.dev/
2. 解压到一个**不含中文和空格**的目录。
3. 把 `flutter/bin` 加入 PATH。
4. 安装 Android Studio（含 Android SDK / 模拟器）。
5. iOS 需要 macOS + Xcode。
6. VS Code 安装 Flutter、Dart 插件。

验证：

```bash
flutter --version
flutter doctor
flutter doctor --android-licenses
```

`flutter doctor` 全绿最好；有红叉按提示逐个解决。

### 2.2 第一个项目

```bash
flutter create my_app
cd my_app
flutter devices
flutter run
```

目录：

```text
my_app/
├── lib/                # Dart 代码
│   └── main.dart       # 入口
├── android/            # Android 原生工程
├── ios/                # iOS 原生工程
├── assets/             # 图片/字体等资源
├── test/               # 测试
├── pubspec.yaml        # 依赖和资源配置
└── analysis_options.yaml
```

常用命令：

```bash
flutter pub get          # 安装依赖
flutter pub add http     # 添加依赖
flutter run              # 运行
flutter run --profile    # 性能测试模式
flutter build apk --release
flutter clean            # 清理构建
flutter test             # 跑测试
```

---

## 3. Dart 速成（给 JS 开发者）

### 3.1 入口与变量

```dart
void main() {
  // var：类型推断
  var name = 'Tom';

  // final：只能赋值一次（运行时确定）
  final now = DateTime.now();

  // const：编译期常量
  const pi = 3.14;

  // 明确类型
  String city = '上海';
  int age = 18;
  double price = 9.9;
  bool isVip = true;

  print('$name, $age, $city, $pi, $price, $isVip, $now');
}
```

Dart 是**强类型 + 空安全**语言。

### 3.2 空安全（null safety） ⭐⭐⭐

```dart
String? nickname = null;      // 可空，显式初始化为 null
print(nickname?.length);      // null，不会报错
nickname = 'Tom';
print(nickname!.length);      // 3，! 表示“我确定不为空”

final displayName = nickname ?? '访客'; // 空值合并

// late：延迟初始化
late final String token;
token = 'abc';             // 使用前必须赋值，否则 LateInitializationError
```

**和 JS 的区别：**

- `null` 不能随便赋给非空类型。
- 可空类型必须用 `?.`、`!`、`??` 处理。
- 好处：大量空指针错误在编译期就被拦住。

### 3.3 函数与命名参数

```dart
// 位置参数
int add(int a, int b) => a + b;

// 命名参数：调用时写参数名，可读性更好
void greet({required String name, int age = 18}) {
  print('$name, $age');
}

greet(name: 'Tom');       // age 用默认值
greet(name: 'Tom', age: 20);

// 可选位置参数
void log(String message, [String? tag]) {
  print('[${tag ?? 'info'}] $message');
}

// 函数作为参数
void runTask(void Function() task) => task();
```

### 3.4 集合

```dart
final list = [1, 2, 3];
final set = {1, 2, 2, 3};              // {1, 2, 3}
final map = {'name': 'Tom', 'age': 18};

list.add(4);
list.map((n) => n * 2).toList();       // [2, 4, 6, 8]
list.where((n) => n.isEven).toList();  // [2, 4]
list.reduce((a, b) => a + b);          // 10

// 展开
final list2 = [0, ...list];

// 集合 if / for
final isVip = true;
final tags = [
  'user',
  if (isVip) 'vip',
  for (final n in [1, 2]) 'tag$n',
];
```

### 3.5 类、构造函数、继承、mixin ⭐⭐

```dart
class User {
  final String name;
  int age;

  // 命名参数 + 初始化
  User({required this.name, this.age = 18});

  // 命名构造
  User.guest() : name = 'guest', age = 0;

  // 工厂构造：可以做校验/缓存/解析
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      name: json['name'] as String,
      age: json['age'] as int? ?? 0,
    );
  }

  void say() => print('$name, $age');
}

class VipUser extends User {
  VipUser({required super.name, super.age = 18});
}

// mixin：复用一组方法
mixin Logger {
  void log(String message) => print('[log] $message');
}

class OrderService with Logger {
  void create() {
    log('创建订单');
  }
}

// 扩展方法：给已有类型加方法，不用改源码
extension StringX on String {
  String get capitalized =>
      isEmpty ? this : this[0].toUpperCase() + substring(1);
}

print('tom'.capitalized); // Tom
```

### 3.6 泛型

```dart
class Box<T> {
  final T value;
  Box(this.value);
}

final box = Box<int>(1);
final names = <String>[];
```

### 3.7 异步：Future / Stream / async-await ⭐⭐⭐

```dart
import 'dart:async';

Future<String> fetchName() async {
  await Future.delayed(const Duration(seconds: 1));
  return 'Tom';
}

Future<void> run() async {
  try {
    final name = await fetchName();
    print(name);
  } catch (err) {
    print('失败：$err');
  } finally {
    print('结束');
  }
}

// Stream：连续多个值
Stream<int> countStream(int max) async* {
  for (var i = 1; i <= max; i++) {
    await Future.delayed(const Duration(milliseconds: 500));
    yield i;
  }
}

Future<void> listen() async {
  await for (final n in countStream(3)) {
    print(n); // 1 2 3
  }
}
```

Dart 的异步模型和 JS 类似：单线程 + 事件循环 + 微任务。区别是 Dart 有 `Future` 和 `Stream`，并且可以用 **Isolate** 做真正的并行计算。

### 3.8 Isolate

Dart 的普通异步代码仍然跑在同一个线程（事件循环），CPU 密集任务会卡 UI。Isolate 有独立内存，通过消息通信。

```dart
import 'dart:isolate';

int heavyTask() {
  var sum = 0;
  for (var i = 0; i < 100000000; i++) {
    sum += i;
  }
  return sum;
}

Future<int> runHeavy() async {
  // 在后台 isolate 执行，不阻塞 UI
  return Isolate.run(heavyTask);
}
```

### 3.9 Dart 3 新语法（了解）

```dart
// Record：多个返回值
(String, int) getUser() => ('Tom', 18);
final (name, age) = getUser();

// Pattern matching
switch (user) {
  case User(age: >= 18):
    print('成年');
  default:
    print('未成年');
}

// sealed class + switch 穷尽检查
sealed class Result {}
class Success extends Result {}
class Failure extends Result {}
```

### 3.10 Dart vs JS 对照表

| JS | Dart |
|---|---|
| `let/const` | `var/final/const` |
| `null/undefined` | 只有 `null`，空安全 |
| `function` | 函数、命名参数、位置参数 |
| `{}` 对象 | `Map<String, dynamic>` 或类 |
| `[]` 数组 | `List` |
| `Promise` | `Future` |
| `async/await` | `async/await` |
| 事件循环 | 事件循环 + Isolate |
| `class` | `class` + mixin + extension |
| 可选链 `?.` | `?.`，还有 `!`、`??` |

---

## 4. Flutter 核心：三棵树 ⭐⭐⭐

Flutter 里有三棵树：

```text
Widget 树（配置，immutable）
    ↓ build
Element 树（生命周期、状态挂载）
    ↓ create/render
RenderObject 树（布局、绘制）
    ↓
Layer / 屏幕
```

### 4.1 Widget

- Widget 是**不可变的配置**，描述 UI 长什么样。
- 每次 `setState` 都会重新 build，生成新的 Widget。
- Widget 很轻，重建成本低；真正的布局/绘制在 RenderObject。

### 4.2 Element

- Element 是 Widget 在树上的实例。
- 它保存 State、BuildContext，负责比较新旧 Widget。
- `Widget.canUpdate` 判断能否复用：类型相同 + key 相同。

### 4.3 RenderObject

- 负责 layout（约束、尺寸、位置）和 paint（绘制）。
- `RenderBox` 是最常见的二维盒模型。

**一句话：Widget 是图纸，Element 是工地，RenderObject 是真正盖出来的墙。**

### 4.4 BuildContext

`BuildContext` 是 Element 的接口，用来：

- 查找祖先 Widget（`Theme.of`、`MediaQuery.of`、`Provider.of`）。
- 获取尺寸/路由。
- 在 `initState` 里不能直接用 `context` 依赖（还没挂载），要在 `didChangeDependencies` 或 `build` 里用。

---

## 5. StatelessWidget 与 StatefulWidget ⭐⭐⭐

### 5.1 StatelessWidget

没有内部状态，props 不变就渲染同样结果。

```dart
class TitleText extends StatelessWidget {
  final String text;
  const TitleText(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Text(text, style: Theme.of(context).textTheme.titleLarge);
  }
}
```

### 5.2 StatefulWidget

有可变状态，状态变化时调用 `setState` 触发重建。

```dart
class Counter extends StatefulWidget {
  const Counter({super.key});

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;

  void increment() {
    setState(() {
      count++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('$count'),
        ElevatedButton(onPressed: increment, child: const Text('+1')),
      ],
    );
  }
}
```

### 5.3 State 生命周期 ⭐⭐⭐

```text
createState()
  → initState()            只执行一次，适合初始化 controller、请求
  → didChangeDependencies() 依赖变化时执行（Theme/MediaQuery/InheritedWidget）
  → build()                每次重建
  → didUpdateWidget()     父组件更新、传入新 props
  → setState() → build()
  → deactivate()
  → dispose()              释放 controller、监听、定时器
```

**注意：**

- `initState` 里不能 `await` 后直接 `setState`，要判断 `mounted`。
- `dispose` 里必须释放 `TextEditingController`、`ScrollController`、`AnimationController`、流订阅。
- `setState` 之后不要忘记 `super.dispose()`。

```dart
@override
void initState() {
  super.initState();
  _load();
}

Future<void> _load() async {
  final data = await fetchData();
  if (!mounted) return; // 页面可能已经销毁
  setState(() => _data = data);
}

@override
void dispose() {
  _controller.dispose();
  super.dispose();
}
```

### 5.4 Key ⭐⭐

- `ValueKey`：按值比较，列表项常用。
- `ObjectKey`：按对象身份比较。
- `UniqueKey`：每次都不同，强制重建（慎用）。
- `GlobalKey`：跨树访问 State/Context，慎用（性能/可维护性）。

```dart
ListView(
  children: items
      .map((item) => TodoTile(key: ValueKey(item.id), item: item))
      .toList(),
);
```

列表排序/增删时，key 能帮 Flutter 正确复用 Element 和 State。

---

## 6. 布局：约束、Row/Column、Flex ⭐⭐⭐

### 6.1 核心规则

```text
Constraints go down.（父给子约束）
Sizes go up.（子把尺寸报给父）
Parent sets position.（父决定子放哪）
```

父给子的约束是 `BoxConstraints(minWidth, maxWidth, minHeight, maxHeight)`。

- 子不能超过父给的最大值。
- 子可以比最小值大。
- 如果子想要无限大，而父给的是有限值，就会被限制。

### 6.2 Row / Column

```dart
Column(
  mainAxisAlignment: MainAxisAlignment.center,   // 主轴
  crossAxisAlignment: CrossAxisAlignment.start,  // 交叉轴
  mainAxisSize: MainAxisSize.min,                // 主轴占多大
  children: [
    const Text('A'),
    const SizedBox(height: 8),
    const Text('B'),
  ],
);
```

- `Row` 主轴是水平，`Column` 主轴是垂直。
- `mainAxisAlignment` 控制主轴排列。
- `crossAxisAlignment` 控制交叉轴对齐。
- `mainAxisSize.min` 让 Column 尽量小；`max` 撑满。

### 6.3 Expanded / Flexible

```dart
Row(
  children: [
    const Icon(Icons.person),
    const SizedBox(width: 8),
    Expanded(
      child: Text(
        '很长的标题很长的标题很长的标题',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    ),
    const SizedBox(width: 8),
    const Icon(Icons.chevron_right),
  ],
);
```

| Widget | 作用 |
|---|---|
| `Expanded` | `flex: 1` + 强制填满剩余空间 |
| `Flexible` | 允许子项在剩余空间内伸缩，但不强制填满 |
| `Spacer` | 占一个 `Expanded` 的空白 |
| `SizedBox` | 固定宽高/间距 |

**常见错误：** `Row`/`Column` 里放一个很长的 `Text`，不加 `Expanded`，会 `RenderFlex overflowed`。

### 6.4 Stack

```dart
Stack(
  children: [
    Image.network(cover, fit: BoxFit.cover),
    Positioned(
      right: 8,
      bottom: 8,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        color: Colors.black54,
        child: const Text('¥199', style: TextStyle(color: Colors.white)),
      ),
    ),
  ],
);
```

### 6.5 滚动

```dart
// 少量内容
SingleChildScrollView(
  child: Column(children: [...]),
);

// 长列表：懒加载
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ListTile(title: Text(items[index].title)),
);

// 固定行高：性能更好
ListView.builder(
  itemExtent: 72,
  itemCount: items.length,
  itemBuilder: (context, index) => ListTile(title: Text(items[index].title)),
);

// 网格
GridView.builder(
  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    mainAxisSpacing: 12,
    crossAxisSpacing: 12,
    childAspectRatio: 0.75,
  ),
  itemCount: items.length,
  itemBuilder: (context, index) => ProductCard(item: items[index]),
);
```

**ListView 不要嵌套在 Column 里而不给高度**，会报 `Vertical viewport was given unbounded height`。解决：用 `Expanded` 包住 ListView，或给 `shrinkWrap: true`（性能差，慎用）。

### 6.6 适配

```dart
// 屏幕尺寸
final size = MediaQuery.of(context).size;
final width = size.width;

// 安全区
SafeArea(child: ...);

// 根据父容器宽度布局
LayoutBuilder(
  builder: (context, constraints) {
    final columns = constraints.maxWidth > 600 ? 4 : 2;
    return GridView.builder(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: columns),
      ...
    );
  },
);
```

- 用 `Expanded`/`Flexible`/百分比，不要写死宽度。
- 字体缩放用 `MediaQuery.textScalerOf(context)` 或 `textScaleFactor`（注意无障碍）。
- 图片用 `BoxFit.cover/contain`。

---

## 7. 常用 Widget 速查 ⭐⭐

### 7.1 结构

| Widget | 作用 |
|---|---|
| `MaterialApp` | Material 应用根，主题/路由/本地化 |
| `Scaffold` | 页面骨架：AppBar、body、FAB、drawer、bottomNavigationBar |
| `AppBar` | 顶部导航栏 |
| `BottomNavigationBar` / `NavigationBar` | 底部导航 |
| `Drawer` | 侧边栏 |
| `SafeArea` | 避开刘海/底部安全区 |
| `Container` | 组合 padding/margin/color/border/尺寸 |
| `Center` | 居中 |
| `Padding` | 内边距 |
| `SizedBox` | 固定尺寸/间距 |
| `Divider` | 分割线 |

### 7.2 展示

| Widget | 作用 |
|---|---|
| `Text` | 文本，支持样式、行数、溢出 |
| `Image.network` / `Image.asset` | 网络/本地图片 |
| `Icon` | 图标 |
| `Card` | 卡片 |
| `ListTile` | 列表项（leading/title/subtitle/trailing） |
| `CircleAvatar` | 圆形头像 |
| `ClipRRect` | 圆角裁剪 |
| `Opacity` / `AnimatedOpacity` | 透明度 |
| `Chip` | 标签 |

### 7.3 输入

| Widget | 作用 |
|---|---|
| `TextField` | 输入框 |
| `TextFormField` + `Form` | 带校验的表单 |
| `ElevatedButton` / `FilledButton` | 主按钮 |
| `OutlinedButton` / `TextButton` | 次按钮 |
| `IconButton` | 图标按钮 |
| `Checkbox` / `Switch` / `Radio` | 选择 |
| `Slider` | 滑块 |
| `DropdownButton` | 下拉 |

### 7.4 异步

```dart
FutureBuilder<List<Post>>(
  future: _future,
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const Center(child: CircularProgressIndicator());
    }
    if (snapshot.hasError) {
      return Center(child: Text('加载失败：${snapshot.error}'));
    }
    final posts = snapshot.data ?? [];
    if (posts.isEmpty) return const Center(child: Text('暂无数据'));
    return ListView.builder(...);
  },
);
```

`StreamBuilder` 用法类似，适合实时数据（WebSocket、数据库监听）。

### 7.5 弹窗

```dart
showDialog(
  context: context,
  builder: (context) => AlertDialog(
    title: const Text('提示'),
    content: const Text('确定删除吗？'),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('取消')),
      FilledButton(onPressed: () { Navigator.pop(context); delete(); }, child: const Text('确定')),
    ],
  ),
);

ScaffoldMessenger.of(context).showSnackBar(
  const SnackBar(content: Text('已加入购物车')),
);
```

---

## 8. 状态管理 ⭐⭐⭐

### 8.1 先分清状态类型

| 类型 | 例子 | 方案 |
|---|---|---|
| 局部 UI 状态 | 输入框内容、展开/收起 | `setState` |
| 页面状态 | 列表、loading、error | `setState` / `FutureBuilder` |
| 跨组件共享 | 登录用户、主题、购物车 | `Provider` / `Riverpod` / `Bloc` |
| 全局持久化 | token、设置 | 状态管理 + 本地存储 |

**不要为了用而用。** 一个页面能 `setState` 解决，就不要上 Redux/Bloc。

### 8.2 setState

```dart
setState(() {
  count++;
});
```

`setState` 会把当前 State 标记为 dirty，下一帧重新 build。

### 8.3 InheritedWidget

Flutter 原生的跨层传值方式，`Provider` 底层就是它。

```dart
class UserScope extends InheritedWidget {
  final String username;

  const UserScope({required this.username, required super.child, super.key});

  static UserScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<UserScope>();
    assert(scope != null, 'UserScope not found');
    return scope!;
  }

  @override
  bool updateShouldNotify(UserScope oldWidget) => username != oldWidget.username;
}
```

### 8.4 Provider

```yaml
# pubspec.yaml
dependencies:
  provider: ^6.1.2
```

```dart
class CounterModel extends ChangeNotifier {
  int count = 0;

  void increment() {
    count++;
    notifyListeners(); // 通知监听者重建
  }
}

// 根节点注入
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => CounterModel(),
      child: const MyApp(),
    ),
  );
}

// 读取
Consumer<CounterModel>(
  builder: (context, model, child) {
    return Text('${model.count}');
  },
);

// 或者
final model = context.watch<CounterModel>();
model.increment();
```

### 8.5 Riverpod / Bloc / GetX

| 方案 | 特点 | 适合 |
|---|---|---|
| Provider | 官方推荐的基础方案，简单 | 中小项目 |
| Riverpod | 编译期安全、不依赖 context、可测试 | 中大型项目 |
| Bloc | 事件驱动、状态可追溯、样板代码多 | 大型/团队协作 |
| GetX | 轻量、路由/依赖/状态一体 | 小项目/快速开发 |

**面试怎么说：**

> 小范围状态用 setState；跨页面共享用 Provider/Riverpod；复杂业务和团队协作可以用 Bloc。选型看团队熟悉度和项目规模，不要为了架构而架构。

---

## 9. 导航 ⭐⭐

### 9.1 Navigator 1.0

```dart
// 跳转
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => const DetailPage(id: 1)),
);

// 返回
Navigator.pop(context);

// 带返回值
final result = await Navigator.push<String>(
  context,
  MaterialPageRoute(builder: (context) => const EditPage()),
);

// 替换当前页
Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomePage()));

// 回到根
Navigator.popUntil(context, (route) => route.isFirst);
```

### 9.2 命名路由

```dart
MaterialApp(
  routes: {
    '/': (context) => const HomePage(),
    '/detail': (context) => const DetailPage(),
  },
);

Navigator.pushNamed(context, '/detail', arguments: {'id': 1});
```

### 9.3 go_router（推荐复杂项目）

```dart
final router = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (context, state) => const HomePage()),
    GoRoute(
      path: '/detail/:id',
      builder: (context, state) => DetailPage(id: state.pathParameters['id']!),
    ),
  ],
);

MaterialApp.router(routerConfig: router);
```

适合深链接、Web URL、嵌套路由、权限守卫。

---

## 10. 网络与本地存储 ⭐⭐

### 10.1 http

```yaml
dependencies:
  http: ^1.2.0
```

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<List<Post>> fetchPosts() async {
  final response = await http.get(
    Uri.parse('https://jsonplaceholder.typicode.com/posts'),
    headers: {'Accept': 'application/json'},
  );

  if (response.statusCode != 200) {
    throw Exception('HTTP ${response.statusCode}');
  }

  final data = jsonDecode(response.body) as List<dynamic>;
  return data
      .map((item) => Post.fromJson(item as Map<String, dynamic>))
      .toList();
}
```

### 10.2 dio（更常用）

```dart
final dio = Dio(
  BaseOptions(
    baseUrl: 'https://api.example.com',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ),
);

dio.interceptors.add(
  InterceptorsWrapper(
    onRequest: (options, handler) {
      options.headers['Authorization'] = 'Bearer $token';
      handler.next(options);
    },
    onError: (error, handler) {
      if (error.response?.statusCode == 401) {
        // 跳登录
      }
      handler.next(error);
    },
  ),
);

final response = await dio.get('/goods', queryParameters: {'page': 1});
```

### 10.3 存储

| 方案 | 适合 |
|---|---|
| `shared_preferences` | 简单键值（token、设置） |
| `sqflite` | 结构化数据、复杂查询 |
| `hive` / `isar` | 高性能 NoSQL/对象存储 |
| `flutter_secure_storage` | 敏感信息（Keychain/Keystore） |

```dart
final prefs = await SharedPreferences.getInstance();
await prefs.setString('token', token);
final token = prefs.getString('token');
```

---

## 11. 平台通道（Platform Channel） ⭐⭐

Flutter 不能直接调用所有原生能力，需要用 Platform Channel 和原生代码通信。

三种通道：

| 通道 | 方向 | 场景 |
|---|---|---|
| `MethodChannel` | Dart ↔ 原生，请求/响应 | 调方法（获取电量、打开相机） |
| `EventChannel` | 原生 → Dart，持续事件 | 传感器、定位、状态监听 |
| `BasicMessageChannel` | 双向消息 | 字符串/二进制消息 |

### 11.1 Dart 端

```dart
static const _channel = MethodChannel('com.example.app/battery');

Future<int> getBatteryLevel() async {
  try {
    final level = await _channel.invokeMethod<int>('getBatteryLevel');
    return level ?? 0;
  } on PlatformException catch (err) {
    throw Exception('获取电量失败：${err.message}');
  }
}
```

### 11.2 Android（Kotlin）

```kotlin
class MainActivity : FlutterActivity() {
    private val channelName = "com.example.app/battery"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            channelName
        ).setMethodCallHandler { call, result ->
            if (call.method == "getBatteryLevel") {
                val level = 80 // 真实项目用 BatteryManager
                result.success(level)
            } else {
                result.notImplemented()
            }
        }
    }
}
```

### 11.3 iOS（Swift）

```swift
let controller = window?.rootViewController as! FlutterViewController
let channel = FlutterMethodChannel(
  name: "com.example.app/battery",
  binaryMessenger: controller.binaryMessenger
)

channel.setMethodCallHandler { call, result in
  if call.method == "getBatteryLevel" {
    result(80)
  } else {
    result(FlutterMethodNotImplemented)
  }
}
```

### 11.4 Pigeon

手写通道容易出错，`pigeon` 可以根据 Dart 接口生成 Kotlin/Swift/Objective-C 的类型安全代码，推荐在正式项目中使用。

---

## 12. 性能优化 ⭐⭐⭐

### 12.1 先理解帧预算

- 60fps：每帧 16.67ms。
- 120fps：每帧 8.33ms。
- 超过预算就掉帧。

### 12.2 优化清单

| 问题 | 优化 |
|---|---|
| 重建太多 | 拆小 Widget、`const`、`RepaintBoundary`、`ValueListenableBuilder` |
| 长列表卡 | `ListView.builder`、`itemExtent`、`prototypeItem`、分页 |
| 图片大 | 压缩、指定尺寸、`cacheWidth/cacheHeight`、`precacheImage` |
| 动画卡 | `AnimatedBuilder`、`FadeTransition`、避免 `Opacity`、用 `TweenAnimationBuilder` |
| 主线程计算 | `Isolate.run` / `compute` |
| 布局复杂 | 减少嵌套、避免 `IntrinsicWidth/Height`、用 `LayoutBuilder` |
| 过度绘制 | 减少 Stack 重叠、`RepaintBoundary`、`clipBehavior` |
| 启动慢 | 延迟初始化、减少首屏 Widget、拆分初始化任务 |
| 包体积大 | 拆 ABI、混淆、移除未用资源、延迟组件 |

### 12.3 const

```dart
// 好：编译期常量，不会重建
const Text('标题');

// 差：每次 build 创建新对象
Text('标题');
```

### 12.4 局部刷新

```dart
// 整个页面 setState 会重建很多 Widget
// 用 ValueListenableBuilder 只重建局部
ValueListenableBuilder<int>(
  valueListenable: count,
  builder: (context, value, child) {
    return Text('$value');
  },
);
```

### 12.5 RepaintBoundary

```dart
RepaintBoundary(
  child: ComplexChart(data: data),
);
```

把频繁重绘的部分隔离，避免影响其他区域。

### 12.6 工具

- `flutter run --profile`：性能测试用 profile，不要用 debug。
- Flutter DevTools：Performance、Widget Inspector、Memory。
- Performance Overlay：看 UI/Raster 线程耗时。
- `flutter build --analyze-size`：分析包体积。

### 12.7 Impeller / Skia

- Skia：老渲染后端。
- Impeller：新渲染引擎，预编译 shader，减少首帧卡顿；新版 Flutter 在 iOS/Android 上默认使用（低端机可能回退）。
- 面试知道“Impeller 解决 shader 编译卡顿”即可。

---

## 13. 打包与发布 ⭐

### 13.1 Android

```bash
flutter build apk --release
flutter build appbundle --release
flutter build apk --split-per-abi
```

签名：

1. 生成 keystore。
2. 配置 `android/key.properties`。
3. 在 `android/app/build.gradle.kts` 里配置 signingConfigs。
4. `flutter build appbundle --release` 上传 Google Play/国内应用市场。

### 13.2 iOS

```bash
flutter build ipa --release
```

需要 macOS + Xcode + 证书 + Provisioning Profile。用 Xcode Archive 或 `flutter build ipa` 后上传 TestFlight/App Store。

### 13.3 混淆与符号

```bash
flutter build apk --release --obfuscate --split-debug-info=build/symbols
```

- `--obfuscate`：混淆 Dart 符号，减小体积、增加逆向难度。
- `--split-debug-info`：把调试符号单独输出，崩溃分析时需要。

### 13.4 多渠道/环境

- Flutter flavors：`flutter run --flavor dev`。
- 不同 `main_dev.dart` / `main_prod.dart`。
- 配置不同 API 地址、包名、图标。

### 13.5 热更新

Flutter 官方**不支持**像 RN 那样直接热更新 Dart 代码。常见做法：

- 发版更新。
- 资源/配置下发。
- 原生动态化方案（成本高）。
- 不要用热更新绕过审核。

---

## 14. 项目结构与测试

```text
lib/
├── main.dart
├── app.dart
├── models/
│   └── product.dart
├── pages/
│   ├── home_page.dart
│   └── detail_page.dart
├── widgets/
│   └── product_card.dart
├── services/
│   └── api.dart
├── providers/
│   └── cart_provider.dart
└── utils/
```

测试：

```dart
// test/widget_test.dart
testWidgets('点击按钮后计数增加', (tester) async {
  await tester.pumpWidget(const MyApp());

  expect(find.text('0'), findsOneWidget);

  await tester.tap(find.byIcon(Icons.add));
  await tester.pump();

  expect(find.text('1'), findsOneWidget);
});
```

```bash
flutter test
```

---

## 15. 完整示例一：待办清单

> 覆盖：StatefulWidget、setState、TextField、ListView.builder、Dismissible、CheckboxListTile、SegmentedButton、dispose。

```dart
import 'package:flutter/material.dart';

void main() => runApp(const TodoApp());

class TodoApp extends StatelessWidget {
  const TodoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '待办清单',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: Colors.green,
        useMaterial3: true,
      ),
      home: const TodoPage(),
    );
  }
}

// 数据模型
class TodoItem {
  final String id;
  final String title;
  bool done;

  TodoItem({
    required this.id,
    required this.title,
    this.done = false,
  });
}

class TodoPage extends StatefulWidget {
  const TodoPage({super.key});

  @override
  State<TodoPage> createState() => _TodoPageState();
}

class _TodoPageState extends State<TodoPage> {
  final List<TodoItem> _todos = [];
  final TextEditingController _controller = TextEditingController();
  String _filter = 'all';

  @override
  void dispose() {
    // 释放控制器，避免内存泄漏
    _controller.dispose();
    super.dispose();
  }

  void _addTodo() {
    final title = _controller.text.trim();
    if (title.isEmpty) return;

    setState(() {
      _todos.insert(
        0,
        TodoItem(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          title: title,
        ),
      );
    });

    _controller.clear();
  }

  List<TodoItem> get _visibleTodos {
    switch (_filter) {
      case 'active':
        return _todos.where((item) => !item.done).toList();
      case 'done':
        return _todos.where((item) => item.done).toList();
      default:
        return _todos;
    }
  }

  @override
  Widget build(BuildContext context) {
    final visible = _visibleTodos;

    return Scaffold(
      appBar: AppBar(title: const Text('待办清单')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: '输入待办，回车添加',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _addTodo(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _addTodo,
                  child: const Text('添加'),
                ),
              ],
            ),
          ),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'all', label: Text('全部')),
              ButtonSegment(value: 'active', label: Text('未完成')),
              ButtonSegment(value: 'done', label: Text('已完成')),
            ],
            selected: {_filter},
            onSelectionChanged: (value) {
              setState(() => _filter = value.first);
            },
          ),
          const SizedBox(height: 8),
          Expanded(
            child: visible.isEmpty
                ? const Center(child: Text('暂无待办'))
                : ListView.builder(
                    itemCount: visible.length,
                    itemBuilder: (context, index) {
                      final todo = visible[index];

                      return Dismissible(
                        key: ValueKey(todo.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          color: Colors.red,
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        onDismissed: (_) {
                          setState(() => _todos.remove(todo));
                        },
                        child: CheckboxListTile(
                          value: todo.done,
                          title: Text(
                            todo.title,
                            style: TextStyle(
                              decoration: todo.done
                                  ? TextDecoration.lineThrough
                                  : null,
                              color: todo.done ? Colors.grey : null,
                            ),
                          ),
                          onChanged: (value) {
                            setState(() => todo.done = value ?? false);
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
```

### 这个例子练到了什么

- `StatefulWidget` + `setState`。
- `TextEditingController` 的创建与 `dispose`。
- `Row` + `Expanded` 让输入框自适应。
- `ListView.builder` 懒加载。
- `Dismissible` 滑动删除。
- `CheckboxListTile` 切换完成。
- `SegmentedButton` 筛选。
- `ValueKey` 保证列表项正确复用。

---

## 16. 完整示例二：网络列表

> 覆盖：http、JSON 解析、FutureBuilder、loading/error/empty、下拉刷新、重试。

```dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() => runApp(const PostApp());

class Post {
  final int id;
  final String title;
  final String body;

  Post({required this.id, required this.title, required this.body});

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] as int,
      title: json['title'] as String,
      body: json['body'] as String,
    );
  }
}

Future<List<Post>> fetchPosts() async {
  final response = await http.get(
    Uri.parse('https://jsonplaceholder.typicode.com/posts'),
  );

  if (response.statusCode != 200) {
    throw Exception('HTTP ${response.statusCode}');
  }

  final data = jsonDecode(response.body) as List<dynamic>;
  return data
      .map((item) => Post.fromJson(item as Map<String, dynamic>))
      .toList();
}

class PostApp extends StatelessWidget {
  const PostApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '文章列表',
      theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
      home: const PostListPage(),
    );
  }
}

class PostListPage extends StatefulWidget {
  const PostListPage({super.key});

  @override
  State<PostListPage> createState() => _PostListPageState();
}

class _PostListPageState extends State<PostListPage> {
  late Future<List<Post>> _future;

  @override
  void initState() {
    super.initState();
    // 只创建一次，避免每次 build 都重新请求
    _future = fetchPosts();
  }

  Future<void> _refresh() async {
    final future = fetchPosts();
    setState(() => _future = future);
    await future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('文章列表')),
      body: FutureBuilder<List<Post>>(
        future: _future,
        builder: (context, snapshot) {
          // 加载中
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          // 失败
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('加载失败：${snapshot.error}'),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _refresh,
                    child: const Text('重试'),
                  ),
                ],
              ),
            );
          }

          final posts = snapshot.data ?? [];

          // 空
          if (posts.isEmpty) {
            return const Center(child: Text('暂无数据'));
          }

          // 成功
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView.separated(
              itemCount: posts.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final post = posts[index];
                return ListTile(
                  title: Text(
                    post.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    post.body,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  leading: CircleAvatar(child: Text('${post.id}')),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
```

### 关键点

- `_future` 放在 State 里，`initState` 创建一次。
- `FutureBuilder` 根据 `connectionState`/`hasError`/`data` 显示三态。
- `RefreshIndicator` 需要可滚动子组件。
- `ListView.separated` 自带分割线。
- 网络请求失败时给重试按钮。

---

## 17. 完整示例三：Provider 购物车

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => CartModel(),
      child: const CartApp(),
    ),
  );
}

class CartModel extends ChangeNotifier {
  final List<String> _items = [];

  List<String> get items => List.unmodifiable(_items);

  void add(String name) {
    _items.add(name);
    notifyListeners(); // 通知 UI 重建
  }

  void remove(String name) {
    _items.remove(name);
    notifyListeners();
  }
}

class CartApp extends StatelessWidget {
  const CartApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('购物车'),
          actions: [
            Consumer<CartModel>(
              builder: (context, cart, child) {
                return Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Center(child: Text('${cart.items.length} 件')),
                );
              },
            ),
          ],
        ),
        body: Consumer<CartModel>(
          builder: (context, cart, child) {
            if (cart.items.isEmpty) {
              return const Center(child: Text('购物车是空的'));
            }

            return ListView.builder(
              itemCount: cart.items.length,
              itemBuilder: (context, index) {
                final name = cart.items[index];
                return ListTile(
                  title: Text(name),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: () => cart.remove(name),
                  ),
                );
              },
            );
          },
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {
            // 读取 model 并调用方法
            context.read<CartModel>().add('商品 ${DateTime.now().second}');
          },
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}
```

`Consumer` 只重建自己，不会重建整个页面；`context.read` 只读取不监听。

---

## 18. 常见错误

| 错误 | 原因 | 解决 |
|---|---|---|
| `RenderFlex overflowed` | Row/Column 内容超出 | 用 `Expanded`/`Flexible`/`SingleChildScrollView` |
| `Vertical viewport was given unbounded height` | ListView 在 Column 里没高度 | 用 `Expanded` 包住，或 `shrinkWrap: true` |
| `setState() called after dispose()` | 异步回调后页面已销毁 | 判断 `if (!mounted) return;` |
| `LateInitializationError` | `late` 变量未赋值 | 使用前初始化，或改成可空 |
| `Null check operator used on a null value` | 对 null 用了 `!` | 用 `?.`/`??`/判空 |
| `No Material widget found` | 没有 MaterialApp/Scaffold | 包一层 MaterialApp |
| `MissingPluginException` | 插件没装/没重启 | `flutter pub get`，完全重启 App |
| `CocoaPods not installed` | iOS 依赖工具缺失 | 安装 CocoaPods，`pod install` |
| `Gradle sync failed` | Android 配置/网络 | 看 Gradle 日志，检查 JDK/SDK |
| `A RenderFlex children have non-zero flex but incoming height constraints are unbounded` | Column 里 Expanded 没有有界高度 | 给父级约束/用 Flexible |
| `Cannot hit test a render box with no size` | 组件尺寸为 0 | 检查约束/宽高 |
| 图片不显示 | 网络权限/URL/缓存 | 检查 URL、HTTPS、Android 权限 |

---

## 19. Flutter 面试高频

### Q1：Flutter 和 React Native 的区别？ ⭐⭐⭐

**答：** Flutter 用 Dart，自己带渲染引擎，UI 是自绘的，各端一致性高、动画性能好，但包体积大、需要学 Dart；RN 用 JS/React，渲染原生组件，前端团队上手快、生态大，但受桥/JSI 和原生组件差异影响。需要深度原生能力/极致性能时，原生更合适。

### Q2：Flutter 为什么性能好？ ⭐⭐⭐

**答：** 发布时 AOT 编译成机器码；自绘引擎直接绘制，不经过 WebView；布局/绘制在 C++ 层；Widget 重建轻量；可以用 Isolate 做并行计算；Impeller 预编译 shader 减少首帧卡顿。但注意：不是所有场景都比原生快，复杂平台能力仍要原生通道。

### Q3：Widget、Element、RenderObject 的关系？ ⭐⭐⭐

**答：** Widget 是不可变的配置；Element 是 Widget 在树上的实例，保存 State 和 BuildContext，负责新旧 Widget 的比较；RenderObject 负责布局和绘制。Widget 树 build 出 Element 树，Element 创建/更新 RenderObject 树。

### Q4：StatelessWidget 和 StatefulWidget 的区别？ ⭐⭐

**答：** StatelessWidget 没有可变状态，props 不变就渲染同样结果；StatefulWidget 有 State，可以调用 setState 触发重建。选择标准：需不需要在组件生命周期内维护可变状态。

### Q5：StatefulWidget 的生命周期？ ⭐⭐⭐

**答：** createState → initState（一次，初始化）→ didChangeDependencies（依赖变化）→ build（每次重建）→ didUpdateWidget（父组件更新）→ deactivate → dispose（释放资源）。异步回调后要判断 mounted。

### Q6：BuildContext 是什么？ ⭐⭐

**答：** BuildContext 是 Element 的接口，用来在 Widget 树里查找祖先、读取 Theme/MediaQuery/Provider、获取路由等。不能在 initState 里依赖它，因为那时还没挂载完成。

### Q7：Key 有什么用？ ⭐⭐

**答：** Key 帮 Flutter 在重建时识别同一个 Widget/Element，列表增删排序时保证状态正确复用。常用 ValueKey（按值）、ObjectKey（按对象）、GlobalKey（跨树访问 State，慎用）。

### Q8：setState 做了什么？ ⭐⭐

**答：** 把当前 State 标记为 dirty，安排下一帧重建，调用 build 生成新的 Widget 树，然后 Element 做 diff，更新 RenderObject。setState 不能放在 build 里，异步回调后要注意 mounted。

### Q9：Flutter 的布局约束规则？ ⭐⭐⭐

**答：** Constraints go down, sizes go up, parent sets position。父组件给子组件最大/最小约束，子组件在约束内决定自己的尺寸，父组件决定位置。超出约束会 overflow。

### Q10：Expanded 和 Flexible 的区别？ ⭐⭐

**答：** Expanded 是 flex: 1 且强制填满剩余空间；Flexible 允许在剩余空间内伸缩，但不强制填满。Row/Column 里要让文本省略，通常用 Expanded + overflow: ellipsis。

### Q11：ListView.builder 和 ListView 的区别？ ⭐⭐⭐

**答：** ListView 会一次性构建所有子项；ListView.builder 按需构建可视区域附近的项，长列表性能好。固定行高可以加 itemExtent，进一步减少测量。

### Q12：Flutter 状态管理怎么选？ ⭐⭐⭐

**答：** 局部状态用 setState；跨组件用 InheritedWidget/Provider；中大型项目用 Riverpod/Bloc；简单快速可以用 GetX。选型看项目规模、团队熟悉度和可测试性，不要过度设计。

### Q13：Provider 的原理？ ⭐⭐

**答：** Provider 基于 InheritedWidget，把数据放在祖先节点，后代通过 context 查找并监听变化；ChangeNotifier 调用 notifyListeners 后，依赖它的 Consumer/context.watch 会重建。

### Q14：FutureBuilder 怎么用？ ⭐⭐

**答：** 把一个 Future 传给 FutureBuilder，根据 connectionState、hasError、data 渲染 loading/error/success。Future 要放在 State 里，避免每次 build 重新创建导致重复请求。

### Q15：Future 和 Stream 的区别？ ⭐⭐

**答：** Future 表示一次异步结果；Stream 表示连续多个异步事件，可以监听、暂停、取消。适合 WebSocket、传感器、数据库监听。

### Q16：Dart 的 Isolate 是什么？ ⭐⭐

**答：** Isolate 是独立的内存和事件循环，通过消息通信，适合 CPU 密集任务，避免阻塞 UI。可以用 Isolate.run 或 compute。

### Q17：Platform Channel 是什么？ ⭐⭐

**答：** Flutter 和原生通信的机制。MethodChannel 做请求/响应，EventChannel 做持续事件，BasicMessageChannel 做双向消息。正式项目可以用 Pigeon 生成类型安全代码。

### Q18：Hot Reload 和 Hot Restart 的区别？ ⭐⭐

**答：** Hot Reload 保留 State，只重新构建改动的代码，快；Hot Restart 重启整个 App，State 丢失。修改 main/全局变量/原生代码/资源时通常要 Hot Restart 或重新运行。

### Q19：Flutter 性能怎么优化？ ⭐⭐⭐

**答：** 用 const、拆小 Widget、RepaintBoundary、ValueListenableBuilder 做局部刷新；长列表用 ListView.builder + itemExtent；图片压缩/指定尺寸；动画用 AnimatedBuilder/FadeTransition；重计算用 Isolate；用 profile 模式 + DevTools 定位。

### Q20：Impeller 是什么？ ⭐

**答：** Flutter 的新渲染引擎，预编译 shader，减少首帧 shader 编译卡顿，提升渲染稳定性。新版在 iOS/Android 上默认使用，低端设备可能回退 Skia。

### Q21：Flutter 怎么打包发布？ ⭐

**答：** Android 用 `flutter build apk/appbundle --release`，配置 keystore；iOS 用 `flutter build ipa`，需要 macOS/Xcode/证书；可加 `--obfuscate --split-debug-info`；用 flavors 区分环境。

### Q22：Flutter 为什么包体积大？ ⭐

**答：** 自带渲染引擎和 Dart 运行时，基础体积比 RN/H5 大。优化：split-per-abi、混淆、移除未用资源、延迟组件、图片压缩。

### Q23：Flutter 能做热更新吗？ ⭐

**答：** 官方不支持直接热更新 Dart 代码。常见做法是发版、资源/配置下发、原生动态化方案；不要用热更新绕过应用商店审核。

### Q24：Flutter 怎么做屏幕适配？ ⭐⭐

**答：** 用 Expanded/Flexible/百分比、MediaQuery、LayoutBuilder、SafeArea；图片 BoxFit；字体缩放要考虑无障碍；平板/横屏单独布局。

### Q25：Flutter 怎么和原生混编？ ⭐

**答：** 可以把 Flutter 作为模块集成到原生 App（add-to-app），用 FlutterEngine/FlutterViewController/FlutterActivity 承载页面，通过 Platform Channel 通信；注意路由、生命周期、包体积和构建配置。

---

## 20. 学习路线与练习

### 4 周 Flutter 速成

| 周 | 内容 | 产出 |
|---|---|---|
| 第 1 周 | Dart 语法 + 环境 + 基础 Widget | 一个静态个人页 |
| 第 2 周 | 布局 + 列表 + 表单 | 待办清单 |
| 第 3 周 | 网络 + 状态管理 + 导航 | 列表 → 详情 → 搜索 |
| 第 4 周 | 平台通道 + 性能 + 打包 | 真机 APK |

### 练习

1. 用 Row/Column/Expanded 写一个商品卡片。
2. 用 ListView.builder 渲染 1000 条数据。
3. 用 TextField + Form 做登录页，带校验。
4. 用 FutureBuilder 请求接口，处理 loading/error/empty。
5. 用 Provider 实现购物车。
6. 用 Navigator 实现列表 → 详情 → 返回传值。
7. 用 MethodChannel 调一个原生方法（例如获取电量）。
8. 用 `flutter build apk --release` 打一个包，装到真机。
9. 用 DevTools 找一次掉帧，记录原因和优化。
10. 用 Flutter 重写你之前的待办清单。

---

## 21. 自查清单

- [ ] 能说出 Flutter 和 RN/H5/原生的区别。
- [ ] 会 Dart 的变量、空安全、函数、类、集合、async/await。
- [ ] 理解 Widget/Element/RenderObject。
- [ ] 会 StatelessWidget/StatefulWidget 和生命周期。
- [ ] 会 Row/Column/Stack/Expanded/Flexible/ListView/GridView。
- [ ] 能解释布局约束规则，会解决 overflow。
- [ ] 会 setState/Provider，知道什么时候用什么。
- [ ] 会 Navigator/go_router 传参和返回。
- [ ] 会用 http/dio + FutureBuilder 做三态。
- [ ] 知道 Platform Channel 三种类型。
- [ ] 能说出 8 条性能优化。
- [ ] 会打包 APK/AAB/IPA。
- [ ] 能独立做出列表 + 详情 + 搜索。
