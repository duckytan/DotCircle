# 点点圈 - 云函数模块 (cloudfunctions)

> **模块说明**: 微信云开发后端云函数，处理所有业务逻辑和数据操作
> 
> **路径**: `cloudfunctions/`
> 
> **Last Updated**: 2026-02-02

---

## 📍 模块定位

云函数模块是整个点点圈平台的后端服务层，负责：
- 业务逻辑处理和数据操作
- 数据库读写和事务管理
- 定时任务执行(清理、榜单更新、契约检查等)
- 权限验证和安全控制

---

## 📁 目录结构

```
cloudfunctions/
├── CLAUDE.md                       # 本文件
├── login/                         # 用户登录
│   ├── index.js
│   └── config.json
├── user/                          # 用户相关操作
│   ├── index.js
│   └── config.json
├── packages/                      # 礼包CRUD
│   ├── index.js
│   └── config.json
├── help/                          # 帮助操作
│   ├── index.js
│   └── config.json
├── credit/                        # 信用分操作
│   ├── index.js
│   └── config.json
├── report/                        # 举报处理
│   ├── index.js
│   └── config.json
├── leaderboard/                   # 排行榜
│   ├── index.js
│   └── config.json
├── groups/                        # 群组操作
│   ├── index.js
│   └── config.json
├── admin/                         # 管理后台
│   ├── index.js
│   └── config.json
├── cleanup/                       # 定时清理 [TIMER]
│   ├── index.js
│   └── config.json
├── updateLeaderboard/            # 定时更新榜单 [TIMER]
│   ├── index.js
│   └── config.json
├── contractCheck/                # 契约检查 [TIMER]
│   ├── index.js
│   └── config.json
└── reportProcessor/              # 举报处理 [TIMER]
    ├── index.js
    └── config.json
```

---

## 🔗 依赖关系

### 内部依赖

| 云函数 | 依赖 | 说明 |
|--------|------|------|
| `help` | `credit` | 帮助后更新信用分 |
| `packages` | `user` | 发布前检查用户状态 |
| `report` | `credit` | 举报处理后调整信用分 |
| `cleanup` | - | 独立运行 |
| `updateLeaderboard` | - | 独立运行 |
| `contractCheck` | `credit` | 违约扣分 |
| `reportProcessor` | `credit`, `packages` | 自动处理举报 |

### 外部依赖

| 服务 | 用途 |
|------|------|
| 云数据库(MongoDB) | 数据存储和查询 |
| 云存储 | 图片文件存储 |
| 定时触发器 | 自动化任务 |

---

## 🚪 入口点

### 标准云函数结构

每个云函数遵循以下结构：

```javascript
// cloudfunctions/[function-name]/index.js
const cloud = require('wx-server-sdk')

// 初始化云开发
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 主处理函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    // 1. 参数验证
    validateParams(event)
    
    // 2. 权限检查
    await checkPermission(OPENID, event.action)
    
    // 3. 业务处理
    const result = await handleBusiness(event, OPENID)
    
    // 4. 返回响应
    return {
      success: true,
      code: 200,
      data: result
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      success: false,
      code: error.code || 500,
      message: error.message
    }
  }
}
```

---

## 🎯 核心云函数详解

### 1. login - 用户登录

**功能**: 微信登录/注册，初始化用户信息

**入口**: `cloudfunctions/login/index.js`

```javascript
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  
  // 1. 查询用户是否存在
  const user = await db.collection('users').where({
    _openid: OPENID
  }).get()
  
  if (user.data.length > 0) {
    // 更新登录时间
    await db.collection('users').doc(user.data[0]._id).update({
      data: {
        'totalStats.lastActive': db.serverDate()
      }
    })
    
    return {
      success: true,
      isNewUser: false,
      user: user.data[0]
    }
  }
  
  // 2. 新用户注册
  const newUser = {
    _openid: OPENID,
    nickName: event.userInfo?.nickName || '微信用户',
    avatarUrl: event.userInfo?.avatarUrl || '',
    creditScore: 60,
    creditLevel: 'NORMAL',
    dailyStats: {
      date: getToday(),
      helped: 0,
      published: 0,
      quota: 2
    },
    createdAt: db.serverDate()
  }
  
  await db.collection('users').add({ data: newUser })
  
  return {
    success: true,
    isNewUser: true,
    user: newUser
  }
}
```

### 2. packages - 礼包管理

**功能**: 礼包的CRUD操作

**接口列表**:
| Action | 说明 |
|--------|------|
| `getPackages` | 获取礼包列表 |
| `getPackageDetail` | 获取详情 |
| `publishPackage` | 发布礼包 |
| `getMyPackages` | 我的分享列表 |
| `updatePackage` | 更正领取数/编辑 |
| `cancelPackage` | 取消分享 |

**发布前置检查**:
```javascript
async function checkPublishPermission(openid) {
  const user = await db.collection('users').where({
    _openid: openid
  }).get()
  
  const userData = user.data[0]
  
  // 1. 检查互助任务
  if (userData.dailyStats.helped < 2) {
    throw new Error('需先完成今日互助任务(领取2个礼包)')
  }
  
  // 2. 检查发布额度
  if (userData.dailyStats.published >= userData.dailyStats.quota) {
    throw new Error('今日发布额度已用完')
  }
  
  // 3. 检查信用分
  if (userData.creditScore < 20) {
    throw new Error('信用分过低，无法发布')
  }
  
  return true
}
```

### 3. help - 帮助/领取

**功能**: 用户帮助(领取)礼包

**核心逻辑**:
```javascript
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { packageId } = event
  
  // 1. 检查礼包状态
  const pkg = await db.collection('packages').doc(packageId).get()
  
  if (pkg.data.status !== 'active') {
    throw new Error('礼包不可领取')
  }
  
  // 2. 检查是否已帮助过
  const existing = await db.collection('helpRecords').where({
    packageId,
    helperOpenid: OPENID
  }).get()
  
  if (existing.data.length > 0) {
    throw new Error('已领取过该礼包')
  }
  
  // 3. 创建帮助记录
  await db.collection('helpRecords').add({
    data: {
      packageId,
      creatorOpenid: pkg.data.creatorOpenid,
      helperOpenid: OPENID,
      helpedAt: db.serverDate(),
      contract: {
        enabled: pkg.data.contract?.enabled || false,
        fulfilled: false
      }
    }
  })
  
  // 4. 更新礼包帮助数
  await db.collection('packages').doc(packageId).update({
    data: {
      helpCount: db.command.inc(1),
      helpers: db.command.push({
        openid: OPENID,
        helpedAt: db.serverDate()
      })
    }
  })
  
  // 5. 更新用户今日互助数
  await db.collection('users').where({
    _openid: OPENID
  }).update({
    data: {
      'dailyStats.helped': db.command.inc(1)
    }
  })
  
  // 6. 增加信用分
  await addCredit(OPENID, 1, 'DAILY_HELP', packageId)
  
  return { success: true }
}
```

### 4. credit - 信用分管理

**功能**: 信用分计算和记录

**核心函数**:
```javascript
// 增加信用分
async function addCredit(openid, amount, reason, relatedId) {
  const user = await db.collection('users').where({
    _openid: openid
  }).get()
  
  const beforeScore = user.data[0].creditScore
  const afterScore = Math.min(100, beforeScore + amount)
  
  // 更新用户信用分
  await db.collection('users').doc(user.data[0]._id).update({
    data: {
      creditScore: afterScore,
      creditLevel: calculateLevel(afterScore)
    }
  })
  
  // 记录变动
  await db.collection('creditHistory').add({
    data: {
      _openid: openid,
      type: 'ADD',
      amount,
      reason,
      reasonCode: reason,
      balanceBefore: beforeScore,
      balanceAfter: afterScore,
      relatedId,
      operator: 'system',
      timestamp: db.serverDate()
    }
  })
}

// 计算等级
function calculateLevel(score) {
  if (score >= 90) return 'EXCELLENT'
  if (score >= 75) return 'GOOD'
  if (score >= 60) return 'NORMAL'
  if (score >= 40) return 'WARNING'
  if (score >= 20) return 'RESTRICTED'
  return 'BANNED'
}
```

### 5. report - 举报处理

**功能**: 提交和处理举报

```javascript
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { targetType, targetId, reasonCode, reasonText } = event
  
  // 1. 创建举报记录
  const report = await db.collection('reports').add({
    data: {
      reporterOpenid: OPENID,
      targetType,
      targetId,
      reasonCode,
      reasonText,
      status: 'PENDING',
      createdAt: db.serverDate()
    }
  })
  
  // 2. 更新被举报目标的举报计数
  if (targetType === 'PACKAGE') {
    await db.collection('packages').doc(targetId).update({
      data: {
        reportCount: db.command.inc(1)
      }
    })
  }
  
  return { success: true, reportId: report._id }
}
```

### 6. leaderboard - 排行榜

**功能**: 查询排行榜数据

```javascript
exports.main = async (event) => {
  const { type, period } = event
  
  // 查询预计算的榜单数据
  const leaderboard = await db.collection('leaderboards').where({
    type,
    period
  }).get()
  
  return {
    success: true,
    data: leaderboard.data[0]
  }
}
```

---

## ⏰ 定时云函数

### cleanup - 数据清理

**触发**: 每天凌晨4点

```json
// config.json
{
  "triggers": [{
    "name": "cleanup",
    "type": "timer",
    "config": "0 0 4 * * * *"
  }]
}
```

**功能**:
- 清理7天前的过期礼包
- 清理30天前的帮助记录
- 清理90天前的日志

### updateLeaderboard - 更新榜单

**触发**: 每小时

**功能**:
- 计算4类榜单数据
- 更新排行榜集合

### contractCheck - 契约检查

**触发**: 每小时

**功能**:
- 检查即将到期的契约(18小时、23小时)
- 处理已违约的契约(24小时后)
- 发送提醒通知

---

## 📊 数据库操作示例

### 事务处理

```javascript
// 原子操作：帮助礼包 + 更新计数
const transaction = await db.startTransaction()

try {
  // 1. 创建帮助记录
  await transaction.collection('helpRecords').add({
    data: { /* ... */ }
  })
  
  // 2. 更新礼包帮助数
  await transaction.collection('packages').doc(packageId).update({
    data: {
      helpCount: db.command.inc(1)
    }
  })
  
  // 3. 更新用户统计
  await transaction.collection('users').doc(userId).update({
    data: {
      'dailyStats.helped': db.command.inc(1)
    }
  })
  
  await transaction.commit()
} catch (error) {
  await transaction.rollback()
  throw error
}
```

### 聚合查询

```javascript
// 统计今日互助数
const { list } = await db.collection('helpRecords')
  .aggregate()
  .match({
    helperOpenid: OPENID,
    helpedAt: db.command.gte(todayStart)
  })
  .count('total')
  .end()
```

---

## ✅ 测试策略

### 云函数测试

使用 `wx-server-sdk` 进行本地测试:

```javascript
// test/login.test.js
const cloud = require('wx-server-sdk')
const { main } = require('../login/index')

// Mock WXContext
cloud.getWXContext = () => ({ OPENID: 'test_openid' })

// 测试登录
async function testLogin() {
  const result = await main({
    userInfo: { nickName: '测试用户' }
  })
  
  console.assert(result.success === true)
  console.assert(result.isNewUser === true)
}

testLogin()
```

---

## 📚 参考链接

- [云函数文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)
- [数据库文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
- [定时触发器](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions/triggers.html)

---

## 🔄 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-02-02 | v1.0.0 | 初始创建 |

---

**← [返回根目录](../CLAUDE.md)** | [小程序模块 →](../miniprogram/CLAUDE.md)
