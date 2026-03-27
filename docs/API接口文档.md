# API接口文档

## 1. 接口概述

### 1.1 基本信息

- **Base URL**：`https://api.example.com`
- **协议**：HTTPS
- **数据格式**：JSON
- **字符编码**：UTF-8

### 1.2 通用响应格式

**成功响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 业务数据
  }
}
```

**错误响应**：
```json
{
  "code": 400,
  "message": "参数错误",
  "error": "topic字段不能为空"
}
```

### 1.3 状态码说明

| 状态码 | 说明 | 处理建议 |
|--------|------|---------|
| 200 | 成功 | - |
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未登录 | 跳转登录页 |
| 403 | 无权限 | 提示用户开通会员 |
| 404 | 资源不存在 | 提示用户 |
| 429 | 请求过于频繁 | 限流提示 |
| 500 | 服务器错误 | 稍后重试 |

### 1.4 请求头

**必需请求头**：
```
Content-Type: application/json
Authorization: Bearer {token}
```

**可选请求头**：
```
X-Request-ID: 唯一请求ID（用于追踪）
X-Client-Version: 客户端版本号
```

## 2. 认证授权

### 2.1 微信登录

**接口**：`POST /api/auth/login`

**描述**：通过微信code换取用户token

**请求参数**：
```json
{
  "code": "wx_login_code"
}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 123,
      "openid": "oxxxxxxxxxxxxxx",
      "nickname": "用户昵称",
      "avatar": "https://xxx.com/avatar.jpg",
      "memberType": "free",
      "dailyLimit": 3,
      "remainingCount": 3,
      "totalGenerated": 0,
      "createdAt": "2026-03-27T10:00:00Z"
    }
  }
}
```

**错误示例**：
```json
{
  "code": 400,
  "message": "code无效或已过期"
}
```

### 2.2 刷新Token

**接口**：`POST /api/auth/refresh`

**描述**：刷新用户token

**请求头**：
```
Authorization: Bearer {old_token}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "new_token_string"
  }
}
```

### 2.3 获取用户信息

**接口**：`GET /api/auth/userinfo`

**描述**：获取当前登录用户信息

**请求头**：
```
Authorization: Bearer {token}
```

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 123,
    "nickname": "用户昵称",
    "avatar": "https://xxx.com/avatar.jpg",
    "memberType": "monthly",
    "dailyLimit": 30,
    "remainingCount": 25,
    "totalGenerated": 156,
    "memberExpireAt": "2026-04-27T10:00:00Z"
  }
}
```

## 3. 文案生成

### 3.1 生成文案

**接口**：`POST /api/content/generate`

**描述**：根据用户输入生成小红书文案

**请求参数**：
```json
{
  "topic": "春季穿搭",
  "description": "分享几套适合春天的穿搭，温柔又时尚",
  "style": "种草推荐",
  "length": "medium"
}
```

**参数说明**：

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| topic | string | 是 | 主题/关键词 | "春季穿搭" |
| description | string | 否 | 内容描述 | "分享几套..." |
| style | string | 是 | 文案风格 | "种草推荐" |
| length | string | 是 | 文案长度 | "medium" |

**style可选值**：
- `种草推荐`
- `干货分享`
- `好物测评`
- `生活日常`
- `情感共鸣`
- `搞笑幽默`

**length可选值**：
- `short`：50-100字
- `medium`：100-200字
- `long`：200-400字

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 12345,
    "titles": [
      "🌸春天这样穿，回头率200%！",
      "姐妹们！这几套春季穿搭绝了！",
      "春日氛围感穿搭｜温柔又高级"
    ],
    "content": "最近天气越来越暖和了🌞\n终于可以脱掉厚重的冬装啦！\n\n今天给大家分享几套我最近超爱的春季穿搭💕\n每一套都温柔又时尚，而且超级好搭配！\n\n📌第一套：温柔奶茶色系\n米色针织开衫+白色T恤+卡其色阔腿裤\n整体色调超级温柔，气质满满！\n\n📌第二套：清新蓝白配\n浅蓝色衬衫+白色直筒裤+小白鞋\n简约又清爽，上班约会都合适！\n\n📌第三套：甜美粉色系\n粉色卫衣+牛仔裤+帆布鞋\n减龄又可爱，谁穿谁好看！\n\n姐妹们赶紧学起来吧～\n春天就要美美哒出门！💃",
    "tags": [
      "#春季穿搭",
      "#OOTD",
      "#穿搭灵感",
      "#时尚博主",
      "#温柔风穿搭"
    ],
    "score": 85,
    "remainingCount": 2,
    "generationTime": 3200
  }
}
```

**错误示例**：
```json
{
  "code": 403,
  "message": "今日生成次数已用完",
  "error": "请开通会员或明日再试"
}
```

```json
{
  "code": 400,
  "message": "内容包含敏感词",
  "error": "请修改后重试"
}
```

### 3.2 获取生成历史

**接口**：`GET /api/content/history`

**描述**：获取用户的文案生成历史

**请求参数**：

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 20 |
| style | string | 否 | 筛选风格 | - |

**请求示例**：
```
GET /api/content/history?page=1&pageSize=20
```

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 12345,
        "topic": "春季穿搭",
        "style": "种草推荐",
        "length": "medium",
        "titles": ["标题1", "标题2", "标题3"],
        "content": "文案内容...",
        "tags": ["#标签1", "#标签2"],
        "score": 85,
        "isCollected": false,
        "createdAt": "2026-03-27T10:30:00Z"
      }
    ]
  }
}
```

### 3.3 获取文案详情

**接口**：`GET /api/content/:id`

**描述**：获取指定文案的详细信息

**路径参数**：
- `id`：文案ID

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 12345,
    "topic": "春季穿搭",
    "description": "分享几套适合春天的穿搭",
    "style": "种草推荐",
    "length": "medium",
    "titles": ["标题1", "标题2", "标题3"],
    "content": "文案内容...",
    "tags": ["#标签1", "#标签2"],
    "score": 85,
    "isCollected": true,
    "createdAt": "2026-03-27T10:30:00Z"
  }
}
```

### 3.4 收藏文案

**接口**：`POST /api/content/:id/collect`

**描述**：收藏指定文案

**路径参数**：
- `id`：文案ID

**响应数据**：
```json
{
  "code": 200,
  "message": "收藏成功"
}
```

### 3.5 取消收藏

**接口**：`DELETE /api/content/:id/collect`

**描述**：取消收藏指定文案

**响应数据**：
```json
{
  "code": 200,
  "message": "已取消收藏"
}
```

### 3.6 获取收藏列表

**接口**：`GET /api/content/collections`

**描述**：获取用户收藏的文案列表

**请求参数**：

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 20 |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 23,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 12345,
        "topic": "春季穿搭",
        "style": "种草推荐",
        "content": "文案内容...",
        "collectedAt": "2026-03-27T11:00:00Z"
      }
    ]
  }
}
```

## 4. 会员系统

### 4.1 获取会员信息

**接口**：`GET /api/member/info`

**描述**：获取当前用户的会员信息

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "memberType": "monthly",
    "dailyLimit": 30,
    "remainingCount": 25,
    "expireAt": "2026-04-27T10:00:00Z",
    "autoRenew": false,
    "status": 1
  }
}
```

### 4.2 获取会员套餐

**接口**：`GET /api/member/packages`

**描述**：获取可购买的会员套餐列表

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "type": "monthly",
      "name": "月度会员",
      "price": 19.9,
      "originalPrice": 19.9,
      "dailyLimit": 30,
      "features": [
        "每日30次生成",
        "高级风格解锁",
        "优先客服支持"
      ],
      "recommended": false
    },
    {
      "type": "quarterly",
      "name": "季度会员",
      "price": 49.9,
      "originalPrice": 59.7,
      "dailyLimit": 50,
      "features": [
        "每日50次生成",
        "所有功能解锁",
        "批量生成",
        "优先客服支持"
      ],
      "recommended": true
    },
    {
      "type": "yearly",
      "name": "年度会员",
      "price": 159.9,
      "originalPrice": 238.8,
      "dailyLimit": 100,
      "features": [
        "每日100次生成",
        "所有功能解锁",
        "批量生成",
        "专属客服支持",
        "优先体验新功能"
      ],
      "recommended": false
    }
  ]
}
```

## 5. 支付系统

### 5.1 创建订单

**接口**：`POST /api/payment/create-order`

**描述**：创建支付订单

**请求参数**：
```json
{
  "productType": "monthly_member",
  "amount": 19.9
}
```

**参数说明**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productType | string | 是 | 产品类型 |
| amount | number | 是 | 金额 |

**productType可选值**：
- `monthly_member`：月度会员
- `quarterly_member`：季度会员
- `yearly_member`：年度会员
- `single_use`：单次购买

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "ORDER20260327AB123456",
    "amount": 19.9,
    "paymentParams": {
      "timeStamp": "1711518000",
      "nonceStr": "abc123def456",
      "package": "prepay_id=wx27101234567890",
      "signType": "RSA",
      "paySign": "signature_string"
    }
  }
}
```

### 5.2 查询订单状态

**接口**：`GET /api/payment/order/:orderId`

**描述**：查询订单支付状态

**路径参数**：
- `orderId`：订单号

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "ORDER20260327AB123456",
    "status": 1,
    "statusText": "已支付",
    "productType": "monthly_member",
    "amount": 19.9,
    "paidAt": "2026-03-27T10:35:00Z"
  }
}
```

**status状态值**：
- `0`：待支付
- `1`：已支付
- `2`：已取消
- `3`：已退款

### 5.3 获取订单列表

**接口**：`GET /api/payment/orders`

**描述**：获取用户的订单列表

**请求参数**：

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 20 |
| status | number | 否 | 订单状态 | - |

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "orderId": "ORDER20260327AB123456",
        "productName": "月度会员",
        "amount": 19.9,
        "status": 1,
        "statusText": "已支付",
        "createdAt": "2026-03-27T10:30:00Z",
        "paidAt": "2026-03-27T10:35:00Z"
      }
    ]
  }
}
```

## 6. 统计分析

### 6.1 获取使用统计

**接口**：`GET /api/stats/usage`

**描述**：获取用户的使用统计数据

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "todayUsed": 3,
    "todayRemaining": 0,
    "totalGenerated": 156,
    "totalCollected": 23,
    "mostUsedStyle": "种草推荐",
    "styleStats": [
      {
        "style": "种草推荐",
        "count": 68
      },
      {
        "style": "干货分享",
        "count": 45
      }
    ]
  }
}
```

### 6.2 记录用户行为

**接口**：`POST /api/stats/log`

**描述**：记录用户行为日志

**请求参数**：
```json
{
  "action": "copy",
  "contentId": 12345,
  "params": {
    "from": "result_page"
  }
}
```

**action可选值**：
- `generate`：生成文案
- `copy`：复制文案
- `collect`：收藏文案
- `share`：分享文案

**响应数据**：
```json
{
  "code": 200,
  "message": "success"
}
```

## 7. 其他接口

### 7.1 获取热门主题

**接口**：`GET /api/common/hot-topics`

**描述**：获取当前热门主题列表

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "topic": "春季穿搭",
      "count": 1234,
      "trend": "up"
    },
    {
      "topic": "护肤好物",
      "count": 987,
      "trend": "up"
    },
    {
      "topic": "美食探店",
      "count": 756,
      "trend": "stable"
    }
  ]
}
```

### 7.2 获取系统配置

**接口**：`GET /api/common/config`

**描述**：获取系统配置信息

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dailyFreeCount": 3,
    "inviteRewardCount": 5,
    "shareRewardCount": 2,
    "styles": [
      "种草推荐",
      "干货分享",
      "好物测评",
      "生活日常",
      "情感共鸣",
      "搞笑幽默"
    ],
    "lengths": [
      { "value": "short", "label": "短文案", "desc": "50-100字" },
      { "value": "medium", "label": "中文案", "desc": "100-200字" },
      { "value": "long", "label": "长文案", "desc": "200-400字" }
    ]
  }
}
```

### 7.3 健康检查

**接口**：`GET /api/health`

**描述**：服务健康检查

**响应数据**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-27T10:00:00Z",
    "version": "1.0.0"
  }
}
```

## 8. 错误码详细说明

### 8.1 通用错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| 10001 | 参数缺失 | 检查必填参数 |
| 10002 | 参数格式错误 | 检查参数类型 |
| 10003 | 参数值非法 | 检查参数取值范围 |

### 8.2 认证错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| 20001 | token缺失 | 请先登录 |
| 20002 | token无效 | 重新登录 |
| 20003 | token过期 | 刷新token或重新登录 |
| 20004 | 微信code无效 | 重新获取code |

### 8.3 业务错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| 30001 | 今日次数已用完 | 开通会员或明日再试 |
| 30002 | 会员已过期 | 续费会员 |
| 30003 | 内容包含敏感词 | 修改内容后重试 |
| 30004 | 生成失败 | 稍后重试 |
| 30005 | 文案不存在 | 检查文案ID |

### 8.4 支付错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| 40001 | 订单不存在 | 检查订单号 |
| 40002 | 订单已支付 | 无需重复支付 |
| 40003 | 支付失败 | 重新发起支付 |
| 40004 | 金额不匹配 | 联系客服 |

## 9. 接口调用示例

### 9.1 完整流程示例

```javascript
// 1. 用户登录
const loginRes = await wx.request({
  url: 'https://api.example.com/api/auth/login',
  method: 'POST',
  data: {
    code: 'wx_login_code'
  }
});

const token = loginRes.data.data.token;

// 2. 生成文案
const generateRes = await wx.request({
  url: 'https://api.example.com/api/content/generate',
  method: 'POST',
  header: {
    'Authorization': `Bearer ${token}`
  },
  data: {
    topic: '春季穿搭',
    description: '分享几套适合春天的穿搭',
    style: '种草推荐',
    length: 'medium'
  }
});

const content = generateRes.data.data;

// 3. 收藏文案
await wx.request({
  url: `https://api.example.com/api/content/${content.id}/collect`,
  method: 'POST',
  header: {
    'Authorization': `Bearer ${token}`
  }
});

// 4. 购买会员
const orderRes = await wx.request({
  url: 'https://api.example.com/api/payment/create-order',
  method: 'POST',
  header: {
    'Authorization': `Bearer ${token}`
  },
  data: {
    productType: 'monthly_member',
    amount: 19.9
  }
});

// 5. 发起支付
wx.requestPayment({
  ...orderRes.data.data.paymentParams,
  success: () => {
    console.log('支付成功');
  }
});
```

### 9.2 错误处理示例

```javascript
async function generateContent(params) {
  try {
    const res = await wx.request({
      url: 'https://api.example.com/api/content/generate',
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: params
    });

    if (res.data.code === 200) {
      return res.data.data;
    } else {
      throw new Error(res.data.message);
    }
  } catch (error) {
    // 错误处理
    if (error.code === 401) {
      // 未登录，跳转登录页
      wx.navigateTo({ url: '/pages/login/login' });
    } else if (error.code === 403) {
      // 次数不足，提示开通会员
      wx.showModal({
        title: '提示',
        content: '今日生成次数已用完，是否开通会员？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/member/member' });
          }
        }
      });
    } else {
      // 其他错误
      wx.showToast({
        title: error.message || '生成失败',
        icon: 'none'
      });
    }
  }
}
```

## 10. 版本更新记录

### V1.0.0（2026-03-27）
- 初始版本
- 实现基础功能接口

---

**文档版本**：V1.0  
**创建日期**：2026-03-27  
**负责人**：后端开发  
**审核状态**：待审核
