# 点点圈 - 小程序模块 (miniprogram)

> **模块说明**: 微信小程序前端代码，包含所有页面、组件和工具函数
> 
> **路径**: `miniprogram/`
> 
> **Last Updated**: 2026-02-02

---

## 📍 模块定位

小程序模块是整个点点圈平台的用户界面层，负责：
- 用户交互和页面展示
- 调用云函数进行数据操作
- 本地数据缓存和状态管理
- 微信API集成(登录、分享、支付等)

---

## 📁 目录结构

```
miniprogram/
├── app.js                      # 小程序入口逻辑
├── app.json                    # 全局配置
├── app.wxss                    # 全局样式
├── CLAUDE.md                   # 本文件
├── components/                 # 可复用组件
│   ├── package-card/          # 礼包卡片组件
│   ├── credit-badge/          # 信用徽章组件
│   ├── loading/               # 加载组件
│   └── empty-state/           # 空状态组件
├── pages/                      # 页面目录
│   ├── index/                 # 首页 - 礼包列表
│   ├── publish/               # 发布页 - 发布礼包
│   ├── package/
│   │   └── detail/           # 礼包详情页
│   ├── my/                    # 我的页面
│   │   ├── index.js          # 个人中心
│   │   └── packages/         # 我的分享管理
│   ├── credit/
│   │   └── history/          # 信用记录
│   ├── leaderboard/          # 排行榜
│   ├── report/               # 举报页面
│   ├── groups/               # 群组页面
│   └── rules/                # 规则说明
├── utils/                      # 工具函数
│   ├── api.js                # API封装
│   ├── auth.js               # 认证相关
│   ├── format.js             # 格式化工具
│   ├── credit.js             # 信用分计算
│   └── storage.js            # 本地存储
└── styles/                     # 公共样式
    ├── variables.wxss        # CSS变量
    └── mixins.wxss           # 样式混入
```

---

## 🔗 依赖关系

### 内部依赖

| 模块 | 被依赖方 | 说明 |
|------|----------|------|
| `utils/api.js` | 所有页面 | 统一API调用封装 |
| `utils/auth.js` | 所有页面 | 登录状态管理 |
| `utils/storage.js` | 所有页面 | 本地缓存操作 |
| `components/package-card` | 首页、我的分享 | 礼包列表展示 |
| `components/credit-badge` | 所有页面 | 信用等级标识 |

### 外部依赖

| 服务 | 用途 | 调用方式 |
|------|------|----------|
| 微信云函数 | 数据操作 | `wx.cloud.callFunction()` |
| 微信登录 | 用户认证 | `wx.login()` |
| 云存储 | 图片上传 | `wx.cloud.uploadFile()` |

---

## 🚪 入口点

### 主入口

- **文件**: `app.js`
- **配置**: `app.json`
- **样式**: `app.wxss`

```javascript
// app.js 核心逻辑
App({
  globalData: {
    userInfo: null,
    creditScore: 60,
    todayTask: { helped: 0, needHelp: 2 }
  },
  
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'your-env-id',
      traceUser: true
    })
    
    // 检查登录状态
    this.checkLoginStatus()
  }
})
```

### 页面清单

```json
// app.json 页面配置
{
  "pages": [
    "pages/index/index",
    "pages/publish/index",
    "pages/package/detail/index",
    "pages/my/index/index",
    "pages/my/packages/index",
    "pages/credit/history/index",
    "pages/leaderboard/index",
    "pages/report/index",
    "pages/groups/index",
    "pages/rules/index"
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/leaderboard/index", "text": "榜单" },
      { "pagePath": "pages/my/index/index", "text": "我的" }
    ]
  }
}
```

---

## 🧩 关键组件

### PackageCard 礼包卡片

**路径**: `components/package-card/package-card`

**Props:**
| 属性 | 类型 | 说明 |
|------|------|------|
| package | Object | 礼包数据 |
| showActions | Boolean | 是否显示操作按钮 |

**使用示例:**
```html
<package-card 
  package="{{item}}" 
  showActions="{{true}}"
  bind:help="handleHelp"
/>
```

### CreditBadge 信用徽章

**路径**: `components/credit-badge/credit-badge`

**Props:**
| 属性 | 类型 | 说明 |
|------|------|------|
| level | String | 等级代码(EXCELLENT/GOOD等) |
| score | Number | 信用分数 |

---

## 🛠️ 工具函数

### API封装 (utils/api.js)

```javascript
// 统一API调用
const api = {
  // 用户相关
  login: (userInfo) => callFunction('login', { userInfo }),
  getUserInfo: () => callFunction('getUserInfo'),
  
  // 礼包相关
  getPackages: (params) => callFunction('getPackages', params),
  publishPackage: (data) => callFunction('publishPackage', data),
  helpPackage: (packageId) => callFunction('helpPackage', { packageId }),
  
  // 信用相关
  getCreditHistory: () => callFunction('getCreditHistory'),
  
  // 排行榜
  getLeaderboard: (type, period) => callFunction('getLeaderboard', { type, period }),
}

// 统一调用封装
function callFunction(name, data = {}) {
  return wx.cloud.callFunction({
    name,
    data
  }).then(res => res.result)
}
```

### 认证管理 (utils/auth.js)

```javascript
// 登录状态管理
const auth = {
  // 获取登录态
  async getLoginStatus() {
    const token = wx.getStorageSync('token')
    return !!token
  },
  
  // 微信登录
  async wxLogin() {
    const { code } = await wx.login()
    const res = await api.login({ code })
    wx.setStorageSync('token', res.token)
    return res.user
  },
  
  // 检查是否需要登录
  requireAuth() {
    if (!this.getLoginStatus()) {
      wx.navigateTo({ url: '/pages/login/index' })
      return false
    }
    return true
  }
}
```

---

## 📱 页面说明

### 首页 (pages/index/index)

**功能**: 展示礼包列表，支持曝光排序

**关键逻辑**:
```javascript
Page({
  data: {
    packages: [],
    currentTab: 'all', // all/link/image
    sortBy: 'exposure',
    page: 1,
    hasMore: true
  },

  async loadPackages() {
    const res = await api.getPackages({
      status: 'active',
      sortBy: this.data.sortBy,
      page: this.data.page
    })
    
    this.setData({
      packages: [...this.data.packages, ...res.data],
      hasMore: res.hasMore
    })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({ page: 1, packages: [] })
    await this.loadPackages()
    wx.stopPullDownRefresh()
  }
})
```

### 发布页 (pages/publish/index)

**功能**: 发布新礼包(链接/图片模式)

**前置检查**:
```javascript
async checkBeforePublish() {
  const user = await api.getUserInfo()
  
  // 1. 检查今日互助数
  if (user.dailyStats.helped < 2) {
    wx.showModal({
      title: '互助任务未完成',
      content: '请先领取2个礼包，才能发布自己的礼包'
    })
    return false
  }
  
  // 2. 检查发布额度
  if (user.dailyStats.published >= user.dailyStats.quota) {
    wx.showToast({ title: '今日发布额度已用完', icon: 'none' })
    return false
  }
  
  return true
}
```

### 我的分享管理 (pages/my/packages/index)

**功能**: 查看、取消、更正自己的分享

**操作列表**:
- 更正领取数: 调整已被外部领取的数量
- 取消分享: 停止礼包展示
- 查看详情: 跳转详情页

---

## 🎨 样式规范

### 颜色变量 (styles/variables.wxss)

```css
:root {
  /* 主色调 */
  --primary: #FF6B35;
  --primary-light: #FF8C61;
  --primary-dark: #E55A2B;
  
  /* 信用等级色 */
  --credit-excellent: #FFD700;
  --credit-good: #C0C0C0;
  --credit-normal: #4A90E2;
  --credit-warning: #FF9500;
  --credit-restricted: #8E8E93;
  --credit-banned: #FF3B30;
  
  /* 状态色 */
  --success: #34C759;
  --warning: #FF9500;
  --error: #FF3B30;
  
  /* 中性色 */
  --text-primary: #1C1C1E;
  --text-secondary: #8E8E93;
  --background: #F2F2F7;
  --card: #FFFFFF;
}
```

### 响应式设计

```css
/* 基础容器 */
.container {
  padding: 16rpx 32rpx;
  max-width: 750rpx;
  margin: 0 auto;
}

/* 卡片样式 */
.card {
  background: var(--card);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
}
```

---

## ✅ 测试策略

### 单元测试

- 使用 `miniprogram-simulate` 进行组件测试
- 测试文件: `*.test.js`

### 集成测试

- 微信开发者工具真机调试
- 覆盖主要用户流程:
  1. 登录 → 首页 → 领取礼包
  2. 完成任务 → 发布礼包
  3. 信用分变动 → 查看记录

---

## 📚 参考链接

- [小程序框架文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [小程序组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/)
- [小程序API文档](https://developers.weixin.qq.com/miniprogram/dev/api/)

---

## 🔄 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-02-02 | v1.0.0 | 初始创建 |

---

**← [返回根目录](../CLAUDE.md)** | [云函数模块 →](../cloudfunctions/CLAUDE.md)
