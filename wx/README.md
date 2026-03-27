# AI小红书文案生成器 - 小程序前端

## 快速开始

### 1. 安装微信开发者工具

下载并安装：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 2. 导入项目

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择 `miniprogram` 目录
4. 填写AppID（测试可以使用测试号）

### 3. 配置后端地址

修改 `app.js` 中的 `baseUrl`：

```javascript
globalData: {
  baseUrl: 'http://your-server-ip:3000/api'  // 改为你的后端地址
}
```

### 4. 编译运行

点击"编译"按钮即可在开发者工具中预览

## 项目结构

```
wx/
├── pages/                  # 页面
│   ├── index/             # 首页-文案生成
│   ├── result/            # 生成结果页
│   ├── user/              # 我的页面
│   ├── member/            # 会员中心
│   ├── history/           # 生成历史
│   └── collection/        # 我的收藏
├── utils/                 # 工具函数
│   └── util.js
├── images/                # 图片资源
├── app.js                 # 小程序入口
├── app.json               # 小程序配置
├── app.wxss               # 全局样式
└── project.config.json    # 项目配置
```

## 已实现功能

### ✅ 核心功能
- [x] 用户登录（微信一键登录）
- [x] 文案生成（6种风格）
- [x] 生成结果展示
- [x] 一键复制文案
- [x] 收藏功能

### 🚧 待实现功能
- [ ] 我的页面
- [ ] 会员中心
- [ ] 生成历史
- [ ] 收藏列表
- [ ] 支付功能

## 开发说明

### 页面说明

**首页 (index)**
- 输入主题和描述
- 选择文案风格和长度
- 显示剩余次数
- 生成文案

**结果页 (result)**
- 显示爆款指数
- 3个标题选择
- 正文内容展示
- 话题标签
- 复制和收藏功能

### API调用

所有API调用统一使用 `app.request()` 方法：

```javascript
const res = await app.request({
  url: '/content/generate',
  method: 'POST',
  data: { ... }
});
```

### 样式规范

- 使用rpx单位（响应式像素）
- 主色调：#FF6B9D（粉色）
- 辅助色：#FFA06B（橙色）
- 圆角：12rpx / 16rpx / 50rpx
- 间距：20rpx / 30rpx / 40rpx

## 注意事项

1. **AppID配置**：在 `project.config.json` 中修改 `appid`
2. **域名配置**：正式上线需要在微信公众平台配置服务器域名
3. **HTTPS**：正式环境必须使用HTTPS
4. **图标资源**：需要准备tabBar图标（tab-home.png等）

## 真机调试

1. 点击工具栏"预览"按钮
2. 使用微信扫码
3. 在手机上查看效果

## 发布上线

1. 点击"上传"按钮
2. 填写版本号和备注
3. 登录微信公众平台提交审核
4. 审核通过后发布

## 常见问题

### 1. 网络请求失败

检查：
- 后端服务是否启动
- baseUrl配置是否正确
- 开发者工具是否勾选"不校验合法域名"

### 2. 登录失败

检查：
- 后端微信配置是否正确
- AppID和Secret是否匹配

### 3. 页面不显示

检查：
- 页面路径是否在app.json中注册
- 是否有语法错误

## 技术栈

- 微信小程序原生开发
- WXML + WXSS + JavaScript
- Promise + async/await

## License

MIT
