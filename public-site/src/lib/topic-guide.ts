import type { Roadmap } from "../data/roadmaps";

export type TopicExample = {
  title: string;
  language: string;
  body: string;
  note: string;
};

export type TopicGuide = {
  domain: string;
  intro: string;
  goals: string[];
  notes: string[];
  example: TopicExample;
  practice: string[];
  checks: string[];
};

type Domain = "frontend" | "mobile" | "backend" | "data" | "devops" | "ai" | "design" | "product";

const DOMAIN_LABELS: Record<Domain, string> = {
  frontend: "前端与 Web",
  mobile: "移动端与跨端",
  backend: "后端与服务端",
  data: "数据与数据库",
  devops: "交付与运维",
  ai: "AI 与机器学习",
  design: "设计与体验",
  product: "产品与管理",
};

function domainOf(roadmap: Roadmap): Domain {
  const text = `${roadmap.id} ${roadmap.name} ${roadmap.nameZh ?? ""} ${roadmap.catalogCategories.join(" ")}`.toLowerCase();
  if (/react-native|flutter|android|ios|kotlin|swift|mobile/.test(text)) return "mobile";
  if (/devops|devsecops|docker|kubernetes|aws|terraform|linux|cloudflare|network|cyber-security|shell/.test(text)) return "devops";
  if (/sql|postgres|mongodb|redis|elasticsearch|power-bi|data-|analyst|algorithms|computer-science/.test(text)) return "data";
  if (/ai-|machine-learning|mlops|prompt|inference|claude|agents|data-scientist/.test(text)) return "ai";
  if (/design|ux|technical-writer/.test(text)) return "design";
  if (/product-manager|engineering-manager|devrel|management/.test(text)) return "product";
  if (/frontend|react|vue|angular|javascript|typescript|html|css|nextjs|wordpress/.test(text)) return "frontend";
  return "backend";
}

const EXAMPLES: Array<{ keys: string[]; example: TopicExample }> = [
  {
    keys: ["react native"],
    example: {
      title: "React Native 列表与状态",
      language: "tsx",
      body: `function TaskList({ items }: { items: string[] }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item}
      renderItem={({ item }) => <Text>{item}</Text>}
      ListEmptyComponent={<Text>暂无任务</Text>}
    />
  );
}`,
      note: "先跑通数据 → 列表 → 空状态，再补分页和性能。",
    },
  },
  {
    keys: ["react"],
    example: {
      title: "一个可验证状态的 React 组件",
      language: "tsx",
      body: `function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((value) => value + 1)}>
      count: {count}
    </button>
  );
}`,
      note: "练习时加一条规则：count 不能小于 0，并补一个测试。",
    },
  },
  {
    keys: ["typescript"],
    example: {
      title: "用联合类型约束请求状态",
      language: "ts",
      body: `type ApiState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

function render(state: ApiState<string[]>) {
  if (state.status === "success") return state.data.join(", ");
  if (state.status === "error") return state.message;
  return "loading...";
}`,
      note: "重点不是背语法，而是让非法状态无法被表示。",
    },
  },
  {
    keys: ["javascript", "es6"],
    example: {
      title: "数据处理链",
      language: "js",
      body: `const tasks = [
  { title: "读文档", done: true },
  { title: "写练习", done: false },
];

const pending = tasks.filter((task) => !task.done).map((task) => task.title);`,
      note: "加一个排序和异常输入，观察原数组是否被修改。",
    },
  },
  {
    keys: ["html"],
    example: {
      title: "可访问的表单结构",
      language: "html",
      body: `<form>
  <label for="email">邮箱</label>
  <input id="email" name="email" type="email" required />
  <button type="submit">提交</button>
</form>`,
      note: "用键盘 Tab 操作一遍，检查 label、焦点和错误提示。",
    },
  },
  {
    keys: ["css"],
    example: {
      title: "响应式卡片",
      language: "css",
      body: `.card {
  display: flex;
  gap: 12px;
  padding: 16px;
}

@media (max-width: 600px) {
  .card { flex-direction: column; }
}`,
      note: "把窗口缩到 390px，检查是否有横向溢出。",
    },
  },
  {
    keys: ["sql"],
    example: {
      title: "一次可解释的 JOIN 查询",
      language: "sql",
      body: `SELECT u.id, u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
ORDER BY order_count DESC;`,
      note: "先写执行顺序和索引假设，再运行 EXPLAIN。",
    },
  },
  {
    keys: ["http"],
    example: {
      title: "一次请求的验收清单",
      language: "http",
      body: `POST /api/tasks HTTP/1.1
Content-Type: application/json

{"title":"写练习"}

// 期望：201 + Location: /api/tasks/123
// 失败：400（参数错误）/ 401（未登录）/ 409（重复）`,
      note: "把状态码、错误体和幂等行为写清楚。",
    },
  },
  {
    keys: ["docker"],
    example: {
      title: "构建并运行一个应用镜像",
      language: "dockerfile",
      body: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]

# docker build -t demo .
# docker run --rm -p 3000:3000 demo`,
      note: "检查镜像层、构建缓存和运行用户。",
    },
  },
  {
    keys: ["kubernetes"],
    example: {
      title: "最小 Deployment 与 Service",
      language: "yaml",
      body: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo
spec:
  replicas: 2
  selector:
    matchLabels: { app: demo }
  template:
    metadata:
      labels: { app: demo }
    spec:
      containers:
        - name: demo
          image: demo:1.0
          ports: [{ containerPort: 3000 }]`,
      note: "再加 Service、健康检查和资源限制。",
    },
  },
  {
    keys: ["git"],
    example: {
      title: "一次安全的分支协作",
      language: "bash",
      body: `git switch -c feat/task-list
git add src/tasks.ts
git commit -m "feat: add task list"
git fetch origin
git rebase origin/main
git push -u origin feat/task-list`,
      note: "说明为什么先 rebase、什么时候不该 rebase 公共分支。",
    },
  },
  {
    keys: ["node"],
    example: {
      title: "最小 HTTP 服务",
      language: "js",
      body: `import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404).end();
});

server.listen(3000);`,
      note: "补一个错误分支和请求日志，再测试 404。",
    },
  },
  {
    keys: ["spring"],
    example: {
      title: "最小 REST 接口",
      language: "java",
      body: `@RestController
@RequestMapping("/api/tasks")
class TaskController {
  @GetMapping
  List<String> list() {
    return List.of("读文档", "写练习");
  }
}`,
      note: "补参数校验、统一错误响应和一个集成测试。",
    },
  },
  {
    keys: ["java"],
    example: {
      title: "用不可变对象表达结果",
      language: "java",
      body: `record Task(String title, boolean done) {
  Task complete() {
    return new Task(title, true);
  }
}`,
      note: "比较 record、普通 class 和 Lombok 的边界。",
    },
  },
  {
    keys: ["python"],
    example: {
      title: "最小可测试函数",
      language: "python",
      body: `from dataclasses import dataclass

@dataclass
class Task:
    title: str
    done: bool = False

def pending(tasks: list[Task]) -> list[str]:
    return [task.title for task in tasks if not task.done]`,
      note: "补类型标注、异常输入和 pytest 用例。",
    },
  },
  {
    keys: ["golang", "go "],
    example: {
      title: "最小 HTTP Handler",
      language: "go",
      body: `func health(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _, _ = w.Write([]byte(\`{"ok":true}\`))
}

http.HandleFunc("/health", health)
http.ListenAndServe(":3000", nil)`,
      note: "补超时、错误处理和并发请求测试。",
    },
  },
  {
    keys: ["aws"],
    example: {
      title: "对象存储的最小操作",
      language: "bash",
      body: `aws s3 cp ./report.json s3://my-bucket/reports/report.json
aws s3 ls s3://my-bucket/reports/

# 验收：权限最小化、加密、生命周期规则`,
      note: "说明 IAM 权限和公开访问的边界。",
    },
  },
  {
    keys: ["redis"],
    example: {
      title: "Cache-Aside 流程",
      language: "text",
      body: `读请求：
1. 查 Redis
2. 命中 → 返回
3. 未命中 → 查数据库 → 写缓存（带 TTL）→ 返回

写请求：
1. 更新数据库
2. 删除缓存`,
      note: "说明缓存穿透、雪崩和一致性的取舍。",
    },
  },
  {
    keys: ["system design"],
    example: {
      title: "系统设计答题骨架",
      language: "text",
      body: `1. 需求与边界：用户量、读写比、延迟目标
2. API：输入/输出、错误、幂等
3. 数据：模型、索引、分片
4. 缓存与异步：TTL、队列、重试
5. 可用性：限流、降级、监控
6. 取舍：为什么不用另一个方案`,
      note: "每步都给出量化假设，不要直接画组件。",
    },
  },
  {
    keys: ["testing", "jest", "vitest", "unit test", "e2e"],
    example: {
      title: "一个能暴露回归的测试",
      language: "ts",
      body: `test("负数计数不会生成任务", () => {
  expect(buildTasks(-1)).toEqual([]);
});

test("完成任务后从待办移除", () => {
  const result = completeTask(tasks, "task-1");
  expect(result.pending).toHaveLength(0);
});`,
      note: "补边界、失败路径和一个真实业务规则。",
    },
  },
  {
    keys: ["graphql"],
    example: {
      title: "查询只取需要的字段",
      language: "graphql",
      body: `query TaskList {
  tasks(first: 20) {
    id
    title
    done
  }
}`,
      note: "对比 REST 的请求次数和过度获取问题。",
    },
  },
  {
    keys: ["next.js", "nextjs"],
    example: {
      title: "一个 App Router 页面",
      language: "tsx",
      body: `export default async function Page() {
  const tasks = await getTasks();
  return <TaskList items={tasks} />;
}`,
      note: "检查缓存策略、错误边界和加载状态。",
    },
  },
];

const TOPIC_NOTES: Array<{ keys: string[]; notes: string[] }> = [
  { keys: ["javascript"], notes: ["JavaScript 是单线程事件循环语言：同步代码先执行完，再处理微任务和宏任务。", "函数是一等对象；闭包来自词法作用域，不是“函数里面返回函数”这一种写法。", "对象属性通过原型链查找；class 只是原型机制的语法糖。"] },
  { keys: ["typescript"], notes: ["TypeScript 是结构类型系统：类型兼容看形状，不只看名字。", "泛型把类型当参数传入；收窄（narrowing）让联合类型在分支里变具体。", "类型只在编译期存在，运行时代码仍然要处理非法输入。"] },
  { keys: ["react native"], notes: ["React Native 用原生组件渲染，不是 WebView；样式是 JS 对象而不是 CSS。", "FlatList 负责虚拟化长列表；列表项、key、空状态和分页要一起设计。", "原生能力通过模块/新架构通信，注意线程、序列化和版本兼容。"] },
  { keys: ["react"], notes: ["组件是 UI 的函数；props 向下、事件向上，状态应放在最近公共父级。", "useEffect 处理副作用，依赖数组决定何时重新执行；不要用它推导可计算状态。", "列表 key 必须稳定；用数组下标会在插入/排序时制造状态错位。"] },
  { keys: ["html"], notes: ["HTML 描述结构和语义；标题层级、label、alt 和表单关联是可访问性的基础。", "浏览器把 HTML 解析成 DOM，再结合 CSSOM 计算布局并绘制。", "语义标签优先于一堆 div；但不要为了语义牺牲实际交互。"] },
  { keys: ["css"], notes: ["层叠、继承和优先级共同决定最终样式；!important 是最后手段。", "盒模型区分 content-box 与 border-box；Flex 处理一维布局，Grid 处理二维布局。", "移动端适配要同时考虑视口、1px、安全区和横竖屏。"] },
  { keys: ["sql"], notes: ["关系模型由表、行、列和约束组成；主键唯一标识一行，外键表达关联。", "JOIN 先明确连接条件，再考虑过滤和聚合；LEFT JOIN 与 WHERE 的位置会改变结果。", "索引加速读取但增加写入成本；用执行计划验证，而不是凭感觉加索引。", "事务的 ACID 与隔离级别决定并发下的可见性和异常。"] },
  { keys: ["http"], notes: ["HTTP 是无状态请求/响应协议；方法语义、状态码和缓存头是接口契约的一部分。", "GET 应可缓存且无副作用；POST 常用于创建；幂等设计决定重试是否安全。", "HTTPS 在传输层提供加密与身份校验；CORS 是浏览器同源策略的一部分。"] },
  { keys: ["docker"], notes: ["镜像是由层组成的只读模板；容器是镜像的运行实例，写入层在容器删除后丢失。", "Dockerfile 的指令顺序影响缓存；把变化少的依赖安装放在前面。", "数据持久化用 volume；容器网络、端口映射和环境变量要显式配置。"] },
  { keys: ["kubernetes"], notes: ["Pod 是最小调度单元；Deployment 管理副本与滚动更新，Service 提供稳定访问入口。", "Kubernetes 是声明式系统：你描述期望状态，控制器持续把实际状态拉回期望值。", "健康检查、资源限制和命名空间是生产可用性的基础。"] },
  { keys: ["git"], notes: ["Git 保存的是快照，不是文件差异；提交通过父指针串成历史。", "分支只是指向提交的可移动指针；合并会保留分叉，变基会重写提交。", "不要重写已经共享的历史；回滚前先确认影响范围和备份。"] },
  { keys: ["java"], notes: ["JVM 负责字节码执行、内存管理和垃圾回收；栈存局部变量，堆存对象。", "面向对象的核心是封装、继承和多态；组合通常比深层继承更易维护。", "集合、泛型和并发是 Java 面试与工程实践的高频区；先理解接口和复杂度。"] },
  { keys: ["spring"], notes: ["Spring 的核心是 IoC 容器和依赖注入；Bean 的生命周期与作用域要分清。", "Spring Boot 用 starter 和自动配置减少样板；约定优于配置，但要知道覆盖点。", "Controller-Service-Repository 分层不是形式，而是隔离输入、业务和持久化。"] },
  { keys: ["node"], notes: ["Node.js 是事件循环 + 非阻塞 I/O；CPU 密集任务会阻塞整个进程。", "CommonJS 与 ESM 的加载时机和作用域不同；不要混用时忽略默认导出差异。", "错误优先回调、Promise 和 async/await 要有统一错误处理策略。"] },
  { keys: ["python"], notes: ["Python 是动态类型语言；可读性和显式优于隐式是它的设计哲学。", "列表/字典/集合的复杂度不同；生成器适合流式处理大数据。", "虚拟环境隔离依赖；类型标注和测试帮助大型项目维护。"] },
  { keys: ["golang", "go "], notes: ["Go 用 goroutine 和 channel 表达并发；不要通过共享内存通信，而要通过通信共享内存。", "接口是隐式实现；小接口更容易组合。", "错误是值，显式返回并处理；context 用于取消、超时和请求范围。"] },
  { keys: ["aws"], notes: ["AWS 按区域和可用区组织资源；跨 AZ 高可用是常见设计。", "IAM 负责身份和权限，遵循最小权限；不要用根账号日常操作。", "计算、存储、网络和数据库要分别估算成本、延迟和故障域。"] },
  { keys: ["redis"], notes: ["Redis 主要把数据放在内存中，适合缓存、计数、会话和简单队列。", "TTL 与淘汰策略决定内存边界；缓存要处理穿透、击穿和雪崩。", "持久化（RDB/AOF）不等于备份；要明确恢复点目标。"] },
  { keys: ["system design"], notes: ["先问需求和约束：用户量、读写比、延迟、一致性、预算。", "缓存、异步、分片和副本都是取舍；CAP 不能简单理解成“三选二”。", "每个组件都要说明失败模式、降级和观测方式。"] },
  { keys: ["testing", "jest", "vitest"], notes: ["测试金字塔：大量单元测试、适量集成测试、少量端到端测试。", "测试行为而不是实现细节；一个测试只验证一个清晰的业务规则。", "失败用例、边界和回归测试比“覆盖率数字”更重要。"] },
  { keys: ["security", "xss", "csrf"], notes: ["XSS 源于不可信内容进入页面；输出编码、CSP 和输入校验要一起做。", "CSRF 利用浏览器自动携带凭证；SameSite Cookie 和 CSRF Token 是常见防护。", "认证、授权和审计是三个不同问题，不要混为一谈。"] },
  { keys: ["linux"], notes: ["Linux 一切皆文件；权限、用户/组和进程是排查问题的三把钥匙。", "常用排错顺序：日志 → 进程 → 端口 → 磁盘 → 网络 → 权限。", "Shell 管道把复杂任务拆成小步骤；先读手册，再写脚本。"] },
  { keys: ["machine learning", "ai "], notes: ["先定义任务、数据和评价指标，再选模型；没有基线的指标没有意义。", "训练集/验证集/测试集要隔离；数据泄漏会让离线指标虚高。", "上线要考虑延迟、成本、漂移和人工兜底。"] },
];

function notesFor(topic: string): string[] {
  const lower = topic.toLowerCase();
  return TOPIC_NOTES.find((item) => item.keys.some((key) => lower.includes(key)))?.notes ?? [];
}

function genericExample(domain: Domain, topic: string): TopicExample {
  if (domain === "frontend" || domain === "mobile") {
    return {
      title: `${topic} 的最小场景`,
      language: "text",
      body: `场景：在一个可交互页面或组件里使用 ${topic}
1. 输入：用户操作或接口数据是什么？
2. 处理：状态如何变化？谁是唯一数据源？
3. 输出：页面/组件最终展示什么？
4. 边界：空数据、加载、错误、重复点击
5. 验收：写出一个可以复现的测试步骤`,
      note: "把工作单填完，再写最小代码；不要先堆样式。",
    };
  }
  if (domain === "backend") {
    return {
      title: `${topic} 的最小接口/模块`,
      language: "text",
      body: `场景：为 ${topic} 设计一个最小可验证模块
- 入口：HTTP 方法/函数签名/命令
- 输入：字段、类型、校验规则
- 输出：成功结构、错误结构
- 失败路径：超时、重复请求、非法参数
- 验收：一个成功用例 + 两个失败用例`,
      note: "先把接口契约写清，再实现。",
    };
  }
  if (domain === "data") {
    return {
      title: `${topic} 的最小数据任务`,
      language: "text",
      body: `场景：用 ${topic} 完成一次可复现的数据任务
1. 数据来源与字段含义
2. 目标结果与口径
3. 查询/处理步骤
4. 数据校验：行数、空值、重复、边界
5. 性能：索引、扫描量、执行计划`,
      note: "先用小样本验证口径，再扩大到真实数据。",
    };
  }
  if (domain === "devops") {
    return {
      title: `${topic} 的最小交付闭环`,
      language: "text",
      body: `场景：把 ${topic} 放进一次可回滚的交付
1. 构建：输入、产物、版本
2. 部署：环境、配置、权限
3. 验证：健康检查、关键路径
4. 回滚：失败时如何恢复
5. 观测：日志、指标、告警`,
      note: "先写失败和回滚路径，再写成功路径。",
    };
  }
  if (domain === "ai") {
    return {
      title: `${topic} 的最小实验`,
      language: "text",
      body: `场景：为 ${topic} 设计一次可复现实验
1. 任务与输入/输出定义
2. 数据来源、切分与标注口径
3. 基线方案与评价指标
4. 失败案例分析
5. 上线前的延迟、成本和风险`,
      note: "没有基线和评价指标，就不要谈效果提升。",
    };
  }
  if (domain === "design") {
    return {
      title: `${topic} 的设计工作单`,
      language: "text",
      body: `场景：用 ${topic} 解决一个真实体验问题
1. 用户与场景
2. 当前问题与证据
3. 方案与关键交互
4. 可用性/可访问性检查
5. 成功指标与验证方式`,
      note: "先写问题证据，再画方案。",
    };
  }
  return {
    title: `${topic} 的决策工作单`,
    language: "text",
    body: `场景：用 ${topic} 做一次可解释的决策
1. 目标与约束
2. 相关方与预期
3. 方案 A/B 与取舍
4. 风险与失败预案
5. 指标、复盘时间点`,
    note: "把假设和验证方式写出来，避免只写结论。",
  };
}

export function buildTopicGuide(routeName: string, route: Roadmap, topic: string, stage: string): TopicGuide {
  const domain = domainOf(route);
  const lower = topic.toLowerCase();
  const known = EXAMPLES.find((item) => item.keys.some((key) => lower.includes(key)));
  const example = known?.example ?? genericExample(domain, topic);
  return {
    domain: DOMAIN_LABELS[domain],
    intro: `${topic} 是「${routeName}」路线「${stage}」阶段的一个主题。先用自己的话说明它解决什么问题，再用一个最小场景验证；不要只记名词。`,
    goals: [
      `能用自己的话解释 ${topic} 是什么、解决什么问题，以及什么时候不该用。`,
      `能说出 ${topic} 的 2–3 个核心概念、一个替代方案和一个常见坑。`,
      `能在一个最小场景里使用 ${topic}，说明输入、输出、边界和验收标准。`,
    ],
    notes: notesFor(topic),
    example,
    practice: [
      `按示例做一个最小版本，并写清输入、输出和验收步骤。`,
      `把 ${topic} 与一个相邻技术/方案对比，至少说出一个取舍。`,
      `准备一个项目场景，说明为什么选 ${topic}，以及失败时怎么排查。`,
    ],
    checks: [
      `一句话解释：${topic} 是什么？解决什么问题？`,
      `${topic} 的核心概念、边界和替代方案分别是什么？`,
      `给一个真实场景：输入是什么、输出是什么、你怎么验收？`,
    ],
  };
}
