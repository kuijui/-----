# AI小红书文案生成器 - 后端服务

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

必须配置的环境变量：
- `DB_PASSWORD`: MySQL数据库密码
- `WECHAT_APPID`: 微信小程序AppID
- `WECHAT_SECRET`: 微信小程序Secret
- `OPENAI_API_KEY`: OpenAI API密钥（或配置通义千问）
- `JWT_SECRET`: JWT密钥（建议使用随机字符串）

### 3. 初始化数据库

```bash
# 登录MySQL
mysql -u root -p

# 执行初始化脚本
source src/database/init.sql
```

### 4. 启动Redis

```bash
# Windows (需要先安装Redis)
redis-server

# Linux/Mac
redis-server
```

### 5. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## 项目结构

```
server/
├── src/
│   ├── app.js                 # 应用入口
│   ├── config/                # 配置文件
│   │   ├── database.js        # MySQL配置
│   │   └── redis.js           # Redis配置
│   ├── controllers/           # 控制器
│   │   ├── auth.controller.js
│   │   └── content.controller.js
│   ├── services/              # 业务逻辑
│   │   ├── ai.service.js      # AI服务
│   │   ├── wechat.service.js  # 微信服务
│   │   ├── user.service.js    # 用户服务
│   │   └── content.service.js # 文案服务
│   ├── middlewares/           # 中间件
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── ratelimit.middleware.js
│   ├── routes/                # 路由
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   └── content.routes.js
│   ├── utils/                 # 工具函数
│   │   ├── logger.js
│   │   ├── response.js
│   │   └── jwt.js
│   └── database/              # 数据库脚本
│       └── init.sql
├── package.json
├── .env.example
└── README.md
```

## API接口

### 认证相关

- `POST /api/auth/login` - 微信登录
- `GET /api/auth/userinfo` - 获取用户信息
- `PUT /api/auth/userinfo` - 更新用户信息

### 文案相关

- `POST /api/content/generate` - 生成文案
- `GET /api/content/history` - 获取历史记录
- `GET /api/content/:id` - 获取文案详情
- `POST /api/content/:id/collect` - 收藏文案
- `DELETE /api/content/:id/collect` - 取消收藏
- `GET /api/content/collections/list` - 获取收藏列表

### 健康检查

- `GET /api/health` - 服务健康检查

## AI模型配置

### 使用OpenAI

在 `.env` 中配置：
```
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 使用通义千问（备选）

在 `.env` 中配置：
```
QWEN_API_KEY=your-qwen-api-key
QWEN_MODEL=qwen-turbo
```

系统会优先使用OpenAI，如果失败会自动切换到通义千问。

## 开发说明

### 日志

日志文件位于 `logs/` 目录：
- `error.log` - 错误日志
- `combined.log` - 所有日志

### 限流

- 通用接口：100次/分钟
- 生成接口：10次/分钟

### 数据库连接池

- 最大连接数：10
- 自动重连：是

## 部署

### 使用PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start src/app.js --name ai-copywriter

# 查看状态
pm2 status

# 查看日志
pm2 logs ai-copywriter

# 重启服务
pm2 restart ai-copywriter
```

## 常见问题

### 1. MySQL连接失败

检查：
- MySQL服务是否启动
- 数据库配置是否正确
- 数据库是否已创建

### 2. Redis连接失败

检查：
- Redis服务是否启动
- Redis配置是否正确

### 3. AI生成失败

检查：
- API密钥是否正确
- 网络是否可以访问AI服务
- API额度是否充足

## 技术栈

- **框架**: Express.js
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.0
- **AI**: OpenAI GPT-3.5-turbo / 通义千问
- **认证**: JWT
- **日志**: Winston
- **限流**: express-rate-limit

## License

MIT
