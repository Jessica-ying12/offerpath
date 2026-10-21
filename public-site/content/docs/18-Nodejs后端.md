# 18 · Node.js 后端

> 目标：能写一个可用的 Node/Express API：路由、中间件、鉴权、校验、数据库、错误处理、测试和部署；能回答 Node 后端面试题。
>
> 标记：⭐⭐⭐ 必须会｜⭐⭐ 要理解｜⭐ 了解即可

---

## 1. Node.js 是什么

- JS 运行时，基于 V8 + libuv。
- 单线程事件循环 + 非阻塞 I/O。
- 适合 I/O 密集（API、BFF、实时），不适合 CPU 密集（要 Worker/子进程/拆分服务）。

```js
const http = require('node:http');

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}).listen(3000);
```

### 1.1 模块系统

```js
// CommonJS
const fs = require('node:fs');
module.exports = { foo };

// ESM（package.json "type": "module"）
import fs from 'node:fs';
export function foo() {}
```

### 1.2 事件循环

```text
timers → pending callbacks → idle/prepare → poll → check → close callbacks
```

- `setTimeout`/`setInterval`：timers。
- I/O：poll。
- `setImmediate`：check。
- `process.nextTick` 优先于 Promise 微任务。
- CPU 密集任务会阻塞整个进程的事件循环。

---

## 2. Express 基础

```bash
npm i express
```

```js
const express = require('express');
const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { fields } = req.query;
  res.json({ id, fields });
});

app.post('/api/users', (req, res) => {
  const { name } = req.body;
  res.status(201).json({ id: 1, name });
});

app.listen(3000, () => {
  console.log('http://localhost:3000');
});
```

### 2.1 中间件

```js
function logger(req, res, next) {
  console.log(req.method, req.url);
  next();
}

app.use(logger);
```

中间件顺序很重要：`express.json()` → 日志 → 鉴权 → 路由 → 404 → 错误处理。

### 2.2 错误处理

```js
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? '服务器错误' : err.message,
  });
});
```

异步路由错误要 `next(err)` 或使用 async 包装器：

```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/api/user', asyncHandler(async (req, res) => {
  const user = await getUser();
  res.json(user);
}));
```

---

## 3. REST API 设计

| 方法 | 语义 | 示例 |
|---|---|---|
| GET | 查询 | `GET /api/goods?page=1` |
| POST | 创建 | `POST /api/goods` |
| PUT | 全量更新 | `PUT /api/goods/1` |
| PATCH | 部分更新 | `PATCH /api/goods/1` |
| DELETE | 删除 | `DELETE /api/goods/1` |

状态码：

- 200 成功、201 创建、204 无内容。
- 400 参数错误、401 未认证、403 无权限、404 不存在、409 冲突、429 限流。
- 500 服务器错误、502 网关错误、503 不可用、504 超时。

统一响应：

```json
{ "code": 0, "data": {}, "message": "ok" }
```

---

## 4. 参数校验

用 zod：

```js
const { z } = require('zod');

const CreateUserSchema = z.object({
  name: z.string().min(1).max(50),
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  age: z.number().int().min(0).max(120).optional(),
});

app.post('/api/users', (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: '参数错误',
      errors: result.error.flatten(),
    });
  }

  const data = result.data;
  // ...
});
```

---

## 5. 鉴权：JWT

```bash
npm i jsonwebtoken bcryptjs
```

登录：

```js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;

  const user = await db.user.findUnique({ where: { phone } });
  if (!user) return res.status(401).json({ message: '账号或密码错误' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: '账号或密码错误' });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token });
});
```

鉴权中间件：

```js
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) return res.status(401).json({ message: '未登录' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: '登录已过期' });
  }
}

app.get('/api/me', auth, (req, res) => {
  res.json({ userId: req.user.userId });
});
```

### 5.1 JWT vs Session

| 维度 | JWT | Session |
|---|---|---|
| 存储 | 客户端 | 服务端 |
| 扩展 | 无状态，易扩展 | 需要共享 session |
| 失效 | 难主动失效（黑名单/短过期） | 服务端可立即失效 |
| 安全 | 防篡改不防泄露 | Cookie + CSRF 防护 |

**建议：**

- 短过期 access token + refresh token。
- 敏感操作二次验证。
- 不要放密码/密钥到 payload。
- Web 端优先 HttpOnly Cookie + CSRF 防护。

---

## 6. 数据库

### 6.1 ORM：Prisma

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  where: { name: { contains: 'Tom' } },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: 0,
});

const user = await prisma.user.create({
  data: { name: 'Tom', phone: '13800138000' },
});
```

### 6.2 事务

```js
await prisma.$transaction(async (tx) => {
  const from = await tx.account.update({
    where: { id: 1 },
    data: { balance: { decrement: 100 } },
  });

  await tx.account.update({
    where: { id: 2 },
    data: { balance: { increment: 100 } },
  });
});
```

### 6.3 索引与 SQL

```sql
CREATE INDEX idx_orders_user_time ON orders(user_id, created_at);

SELECT user_id, COUNT(*) AS cnt
FROM orders
WHERE created_at >= '2026-01-01'
GROUP BY user_id
HAVING cnt > 10
ORDER BY cnt DESC
LIMIT 20;
```

- 索引加速读、降低写。
- 联合索引遵循最左前缀。
- 避免 `SELECT *`、函数索引列、前导模糊。
- 事务注意隔离级别/死锁。

---

## 7. 安全

```bash
npm i helmet cors express-rate-limit
```

```js
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

app.use(helmet());
app.use(cors({ origin: ['https://example.com'], credentials: true }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));
```

清单：

- 参数化查询/ORM，防 SQL 注入。
- 输入校验，防 XSS/命令注入。
- 密码 bcrypt/argon2 + 盐。
- HTTPS。
- 鉴权/权限校验。
- 限流/防暴力破解。
- 不泄露堆栈/数据库错误。
- 密钥放环境变量/密钥管理。
- 依赖审计 `npm audit`。

---

## 8. 文件上传

```bash
npm i multer
```

```js
const multer = require('multer');
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});
```

生产建议：

- 存对象存储（OSS/S3），不要存本地磁盘。
- 校验 MIME/后缀/大小。
- 图片压缩/水印。
- 上传鉴权/限流。
- 防路径穿越。

---

## 9. 日志、配置与部署

### 9.1 环境变量

```bash
PORT=3000
DATABASE_URL=postgres://...
JWT_SECRET=...
```

```js
require('dotenv').config();
const port = process.env.PORT || 3000;
```

**永远不要把 `.env` 提交到 Git。**

### 9.2 日志

```js
console.log({
  level: 'info',
  message: 'user login',
  userId: 1,
  requestId: req.id,
});
```

生产用 pino/winston，结构化日志，脱敏。

### 9.3 部署

- PM2：进程守护/多实例。
- Docker：环境一致。
- Nginx：反向代理/HTTPS/静态资源。
- 云平台：Railway/Render/云函数/容器服务。

```bash
pm2 start app.js -i max
pm2 logs
pm2 restart app
```

### 9.4 测试

```bash
npm i -D jest supertest
```

```js
const request = require('supertest');
const app = require('./app');

test('GET /api/health', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});
```

---

## 10. 面试高频

### Q1：Node 为什么适合高并发？ ⭐⭐⭐

**答：** 单线程 + 事件循环 + 非阻塞 I/O，少量线程处理大量连接；I/O 等待时不阻塞，靠回调/Promise 继续处理。CPU 密集任务会阻塞，需要 Worker/子进程/拆分服务。

### Q2：CommonJS 和 ESM 的区别？ ⭐⭐

**答：** CJS 运行时同步加载，require/module.exports，导出值拷贝；ESM 编译时静态分析，import/export，异步加载，实时绑定，支持 tree shaking 和顶层 await。

### Q3：Express 中间件是什么？ ⭐⭐⭐

**答：** 函数 `(req, res, next)`，按注册顺序执行；可以修改 req/res、结束响应或调用 next；错误处理中间件有四个参数 `(err, req, res, next)`。

### Q4：REST API 怎么设计？ ⭐⭐

**答：** 用资源名 + HTTP 方法，GET 查询、POST 创建、PUT/PATCH 更新、DELETE 删除；用状态码表达结果；统一响应结构；分页/过滤/排序用 query。

### Q5：JWT 怎么工作？ ⭐⭐⭐

**答：** 服务端用密钥签名 header.payload.signature，客户端携带 token；服务端验签并解析用户信息。payload 只是 Base64，不是加密；要设置过期，敏感信息不放 payload。

### Q6：JWT 和 Session 怎么选？ ⭐⭐

**答：** JWT 无状态、易扩展，但难主动失效；Session 服务端可立即失效，但要共享存储。Web 端常用 HttpOnly Cookie + Session/短 JWT + refresh token。

### Q7：密码怎么存？ ⭐⭐

**答：** 用 bcrypt/argon2/scrypt + 随机盐，不要明文/MD5/SHA1；HTTPS 传输；登录限流/验证码。

### Q8：怎么防 SQL 注入？ ⭐⭐

**答：** 参数化查询/预编译、ORM、输入校验、最小权限；不要拼接 SQL 字符串。

### Q9：事务是什么？ ⭐⭐

**答：** 一组操作要么全成功要么全失败；ACID；注意隔离级别、死锁、长事务。

### Q10：Node 怎么处理 CPU 密集任务？ ⭐⭐

**答：** Worker Threads、child_process、拆分微服务、队列异步处理；不要阻塞主事件循环。

### Q11：Express 错误怎么统一处理？ ⭐⭐

**答：** 路由里 `next(err)`，最后注册四参数错误中间件；异步用 asyncHandler 包装；区分业务错误/系统错误，生产不泄露堆栈。

### Q12：怎么防刷/限流？ ⭐⭐

**答：** express-rate-limit/Redis 计数、按 IP/用户/接口限流、验证码、黑名单；分布式用 Redis。

### Q13：文件上传要注意什么？ ⭐⭐

**答：** 大小/MIME/后缀校验、鉴权、防路径穿越、存对象存储、图片压缩、限流、病毒扫描（按需）。

### Q14：Node 怎么部署？ ⭐⭐

**答：** PM2/Docker + Nginx 反向代理 + HTTPS；环境变量管理密钥；日志/监控/健康检查；多实例/负载均衡。

---

## 11. 自查清单

- [ ] 能解释 Node 事件循环/非阻塞 I/O。
- [ ] 会写 Express 路由/中间件/错误处理。
- [ ] 会设计 REST API 和状态码。
- [ ] 会用 zod 做参数校验。
- [ ] 会 JWT 登录/鉴权中间件。
- [ ] 知道 JWT/Session 的取舍。
- [ ] 会用 ORM/事务/索引。
- [ ] 知道 SQL 注入/XSS/限流/密码存储。
- [ ] 会文件上传和部署。
- [ ] 会用 supertest 写接口测试。
