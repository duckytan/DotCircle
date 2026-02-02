# 点点圈 DotCircle - 开发文档

> 一个纯公益的腾讯元宝抽奖互助平台，通过信用体系建立良性互助生态。
>
> **核心理念：** 先助人，后受助。信用越好，曝光越高。

---

## 目录

1. [项目概述](#项目概述)
2. [功能规格书](#功能规格书)
3. [数据库设计](#数据库设计)
4. [API接口设计](#api接口设计)
5. [页面结构](#页面结构)
6. [开发计划](#开发计划)
7. [技术规范](#技术规范)
8. [部署配置](#部署配置)
9. [费用预算](#费用预算)
10. [风险评估](#风险评估)

---

## 项目概述

### 背景

腾讯元宝分享抽奖活动导致微信群乌烟瘴气，存在以下痛点：
1. 微信群刷屏严重
2. 抽奖礼包领取率低
3. 缺乏有效的互助机制

### 解决方案

**点点圈** 提供结构化互助平台：
- 用户必须先帮助他人，才能发布自己的礼包
- 信用体系确保良性生态
- 曝光机制激励高质量互助

### 核心机制

```
用户进入平台
    ↓
领取2个他人礼包（完成互助任务）
    ↓
获得发布资格
    ↓
发布自己的礼包
    ↓
其他用户领取，完成闭环
```

### 平台定位

- **纯公益性质**：无现金奖励，仅提供互助场所
- **信用驱动**：通过信用分控制权限和曝光
- **可配置化**：所有功能支持后台开关
- **零成本启动**：基于微信云开发免费额度

---

## 功能规格书

### 1. 用户系统

#### 1.1 注册与登录

- **登录方式**：微信一键登录
- **首次注册**：
  - 信用分：60分（一般等级）
  - 每日额度：2个礼包
  - 发布需审核：是

#### 1.2 等级体系

| 等级 | 信用分 | 名称 | 每日额度 | 曝光权重 | 标识 | 特权 |
|------|--------|------|----------|----------|------|------|
| 🏆 | 90-100 | 优秀 | 3个 | 2.0x | 金色 | 免审+置顶展示 |
| ⭐ | 75-89 | 良好 | 2个 | 1.5x | 银色 | 免审核 |
| 🔹 | 60-74 | 一般 | 2个 | 1.0x | 蓝色 | 需审核 |
| ⚠️ | 40-59 | 警告 | 1个 | 0.5x | 橙色 | 需审核 |
| 🚫 | 20-39 | 受限 | 0个 | 0x | 灰色 | 禁止发布 |
| ❌ | 0-19 | 封禁 | 0个 | 0x | 红色 | 禁止登录 |

#### 1.3 每日任务

| 任务 | 要求 | 奖励 |
|------|------|------|
| 互助任务 | 领取2个礼包 | 发布资格 |
| 每日互助 | 每次互助 | +1信用分（上限2分/天） |
| 连续登录 | 连续7天 | +5信用分 |

### 2. 礼包系统

#### 2.1 分享管理功能

用户可在"我的分享"页面管理自己发布的礼包：

**功能清单：**

| 功能 | 说明 | 触发条件 | 影响 |
|------|------|----------|------|
| 查看分享 | 查看所有发布的礼包列表 | - | - |
| 取消分享 | 删除礼包，停止领取 | 任意状态 | 已领取记录保留，未领取者无法继续 |
| 更正领取数 | 手动调整已领取人数 | 礼包被平台外领取 | 更新helpCount，避免重复领取 |
| 编辑信息 | 修改礼包描述/图片 | 审核未通过或待审核 | 重新提交审核 |

**更正领取数场景：**
```
用户A在点点圈发布礼包（10人领完有奖）
    ↓
分享到微信群，被朋友领取了3人
    ↓
回到点点圈，发现只显示0人领取
    ↓
进入分享管理 → 更正领取数 → 设置为3
    ↓
系统更新：helpCount=3，剩余7个名额
```

**更正规则：**
- 只能增加，不能减少（防止作弊）
- 最大不能超过maxHelp（默认10）
- 需要提供说明（如"分享到微信群领了3人"）
- 记录更正历史
- 信用分>60才能使用更正功能

#### 2.2 发布模式

**链接模式：**
- 输入元宝抽奖链接
- 格式验证：`https://yb.tencent.com/fes/red/claim*`
- 提取 `red_packet_id` 去重

**图片模式：**
- 上传二维码图片
- 存储到云存储
- 人工审核（暂不支持OCR）

#### 2.2 发布规则

1. **前提条件**：今日已完成≥2次互助
2. **额度限制**：根据等级每日限额
3. **审核机制**：
   - 信用分≥75：自动通过
   - 信用分<75：进入人工审核队列
4. **超时处理**：24小时未审核自动拒绝

#### 2.3 礼包状态

```
pending    → 待审核
active     → 进行中（可领取）
completed  → 已完成（10人领完）
expired    → 已过期（7天后）
rejected   → 已拒绝（审核未通过）
```

#### 2.4 数据结构

```javascript
{
  _id: ObjectId,
  creatorOpenid: String,
  type: 'LINK' | 'IMAGE',
  
  // 链接模式
  giftUrl: String,
  giftId: String,              // red_packet_id
  
  // 图片模式
  imageFileId: String,
  imageUrl: String,
  
  // 通用字段
  status: String,
  helpCount: Number,           // 当前帮助数
  maxHelp: 10,
  helpers: [{
    openid: String,
    helpedAt: Date
  }],
  
  // 审核信息
  auditInfo: {
    auditor: String,
    result: String,
    reason: String,
    auditedAt: Date
  },
  
  createdAt: Date,
  expireAt: Date
}
```

### 3. 信用分体系

#### 3.1 扣分项

| 行为 | 扣分 | 触发条件 | 备注 |
|------|------|----------|------|
| 虚假链接/图片 | -20 | 举报核实 | 礼包下架 |
| 领取无奖励 | -10 | 用户反馈核实 | - |
| 垃圾广告 | -30 | 举报核实 | 严重违规 |
| 未履行契约 | -5 | 24小时未发 | 自动检测 |
| 恶意举报 | -2 | 举报无效 | 累计3次禁举报7天 |
| 作弊行为 | -50 | 系统检测 | 人工复核 |

#### 3.2 加分项

| 行为 | 加分 | 频率限制 | 备注 |
|------|------|----------|------|
| 每日互助 | +1 | 2次/天 | 即时到账 |
| 连续7天互助 | +5 | 7天一次 |  streak奖励 |
| 有效举报 | +3 | 无上限 | 核实后发放 |
| 履行契约 | +2 | 每次 | 24小时内发布 |
| 30天自然恢复 | +5 | 30天一次 | 自动发放 |

#### 3.3 恢复机制（混合模式）

```javascript
// 时间恢复
每30天自动 +5分

// 任务恢复
连续7天互助          +3分
成功帮助他人5次      +2分
有效举报1次          +2分

// 限制
每日最多恢复：5分
```

### 4. 排行榜系统

#### 4.1 榜单类型

| 榜单 | 指标 | 周期 | 更新频率 |
|------|------|------|----------|
| 互助达人榜 | 帮助人数 | 周榜 | 每小时 |
| 信用之星榜 | 信用分数 | 实时 | 即时 |
| 活跃先锋榜 | 连续登录天数 | 日榜 | 每天 |
| 贡献榜 | 累计发布数 | 月榜 | 每天 |

#### 4.2 隐私保护

**打码规则：**
```javascript
// 长度<3：显示首字 + "**"
"张三" → "张**"

// 长度≥3：首字 + 星号 + 尾字
"李小明" → "李*明"
"HelloWorld" → "H*******d"
```

**特殊显示：**
- 当前用户：显示完整昵称 + "(你)"标记
- Top 3：金色边框高亮
- 好友（互相关注）：可选择显示完整

#### 4.3 榜单奖励

- **Top 10**：特殊徽章 + 每日额外+1发布额度
- **Top 3**：首页轮播展示24小时
- **登顶**：全站公告（可选关闭）

### 5. 举报系统

#### 5.1 举报类型

```javascript
REPORT_TYPES = {
  FAKE_LINK: '链接无效/打不开',
  FAKE_IMAGE: '图片虚假/过期',
  NO_REWARD: '领取后无奖励',
  SPAM: '垃圾广告信息',
  WRONG_PLATFORM: '非元宝平台',
  HARASSMENT: '骚扰/不当行为',
  OTHER: '其他问题'
}
```

#### 5.2 处理机制（方案C）

```
用户举报
    ↓
0-6小时：等待人工审核
    ↓
6-24小时：自动处理
    ├─ 同一目标被举报≥3次 → 自动下架 + 扣分
    └─ 仅1次举报 → 标记为"无效"
    ↓
24小时未处理
    └─ 执行自动处理结果
```

#### 5.3 奖惩规则

- **举报成功**：举报者 +3分，被举报者按类型扣分
- **举报无效**：举报者 -2分
- **恶意举报**：累计3次无效举报，禁止举报功能7天

#### 5.4 申诉机制

- 被处罚用户可在72小时内申诉
- 管理员复核后可撤销处罚
- 撤销后恢复信用分，但不追溯曝光损失

### 6. 互助契约（可开关）

#### 6.1 契约机制

```
用户A发布礼包 ←──契约──→ 用户B领取
                      ↓
              B必须在24小时内发布自己的礼包
                      ↓
              完成：+2分 | 违约：-5分
```

#### 6.2 契约状态

```javascript
contract: {
  enabled: Boolean,      // 是否开启契约
  deadline: Date,        // 截止时间（24小时后）
  fulfilled: Boolean,    // 是否完成
  penaltyApplied: Boolean // 是否已扣分
}
```

#### 6.3 提醒机制

- **18小时**：发送提醒通知
- **23小时**：紧急提醒
- **24小时**：自动检测，未发布则扣分

### 7. 互助群组（可开关）

#### 7.1 群组规则

- **创建条件**：信用分≥75
- **人数上限**：50人
- **加入方式**：申请制或邀请制

#### 7.2 群组特权

- 群内成员礼包优先展示
- 群组专属排行榜
- 群组内互助额外+1分奖励

#### 7.3 群组管理

- 群主可设置最低信用分要求
- 可踢出违规成员
- 可转让群主

### 8. 成就徽章（可开关）

#### 8.1 徽章列表

| 徽章 | 名称 | 获得条件 | 特权 |
|------|------|----------|------|
| 🏅 | 初来乍到 | 注册完成 | - |
| 🥉 | 互助新手 | 帮助3人 | - |
| 🥈 | 互助达人 | 帮助50人 | 曝光+10% |
| 🥇 | 互助之星 | 帮助200人 | 曝光+20% |
| 💎 | 信用模范 | 信用90+保持30天 | 每日+1额度 |
| 🔥 | 连续打卡 | 连续7天登录 | 曝光+5% |
| 🌟 | 举报先锋 | 有效举报10次 | 举报+1分 |
| 👑 | 群主 | 创建群组 | 群组管理权 |

#### 8.2 展示位置

- 个人主页徽章墙
- 礼包列表昵称旁
- 排行榜头像框

---

## 数据库设计

### 集合总览

| 集合名 | 主要用途 | 预估数据量 | 索引策略 |
|--------|----------|------------|----------|
| users | 用户数据 | 10万+ | _openid(唯一) |
| packages | 礼包数据 | 100万+ | creatorOpenid, status, createdAt |
| helpRecords | 帮助记录 | 1000万+ | packageId, helperOpenid, helpedAt |
| reports | 举报数据 | 10万+ | targetId, status, createdAt |
| creditHistory | 信用记录 | 1000万+ | _openid, timestamp |
| groups | 群组数据 | 1000+ | creatorOpenid |
| groupMembers | 群组成员 | 5万+ | groupId, userOpenid |
| leaderboards | 排行榜 | 4条/次 | type, period |
| systemConfig | 系统配置 | 1条 | _id |
| adminLogs | 管理员日志 | 10万+ | adminOpenid, timestamp |

### 详细Schema

#### users（用户表）

```javascript
{
  // 基础信息
  _openid: String,              // 微信OpenID（唯一）
  unionid: String,              // 微信UnionID（可选）
  nickName: String,             // 昵称
  avatarUrl: String,            // 头像URL
  
  // 信用系统
  creditScore: Number,          // 当前信用分（默认60）
  creditLevel: String,          // 等级：EXCELLENT/GOOD/NORMAL/WARNING/RESTRICTED/BANNED
  
  // 每日统计
  dailyStats: {
    date: String,               // 日期（YYYY-MM-DD）
    helped: Number,             // 今日帮助次数
    published: Number,          // 今日发布次数
    quota: Number               // 今日剩余额度
  },
  
  // 累计统计
  totalStats: {
    totalHelped: Number,        // 累计帮助
    totalPublished: Number,     // 累计发布
    totalReceived: Number,      // 累计被领取
    streakDays: Number,         // 连续登录天数
    lastActive: Date            // 最后活跃时间
  },
  
  // 成就
  achievements: [String],       // 已获得徽章代码列表
  
  // 群组
  groupId: String,              // 所属群组ID（可选）
  groupRole: String,            // 角色：member/admin/owner
  
  // 权限
  isAdmin: Boolean,             // 是否管理员
  adminPermissions: [String],   // 权限列表：audit/config/userManage
  
  // 设置
  settings: {
    publicLeaderboard: Boolean, // 是否公开排行榜
    enableContract: Boolean,    // 是否开启契约提醒
    allowNotification: Boolean  // 是否允许推送
  },
  
  // 风控
  riskFlags: [String],          // 风险标记
  bannedUntil: Date,            // 封禁截止时间
  
  // 时间戳
  createdAt: Date,
  updatedAt: Date
}

// 索引
// db.users.createIndex({ _openid: 1 }, { unique: true })
// db.users.createIndex({ creditScore: -1 })
// db.users.createIndex({ "dailyStats.date": 1, creditScore: -1 })
```

#### packages（礼包表）

```javascript
{
  // 基础信息
  _id: ObjectId,
  creatorOpenid: String,        // 发布者OpenID
  
  // 类型
  type: String,                 // LINK（链接）/ IMAGE（图片）
  
  // 链接模式字段
  giftUrl: String,              // 完整链接
  giftId: String,               // red_packet_id（去重用）
  
  // 图片模式字段
  imageFileId: String,          // 云存储文件ID
  imageUrl: String,             // 临时访问链接
  
  // 状态
  status: String,               // pending/active/completed/expired/rejected
  
  // 审核信息
  auditInfo: {
    auditor: String,            // 审核管理员OpenID
    result: String,             // approved/rejected
    reason: String,             // 拒绝原因
    auditedAt: Date
  },
  
  // 帮助信息
  helpCount: Number,            // 当前帮助数（0-10）
  maxHelp: Number,              // 最大帮助数（固定10）
  helpers: [{
    openid: String,             // 帮助者OpenID
    helpedAt: Date,             // 帮助时间
    contractId: String          // 关联契约ID
  }],
  
  // 契约
  contract: {
    enabled: Boolean,           // 是否开启契约
  },
  
  // 举报
  reports: [{
    reportId: String,           // 举报记录ID
    reporter: String,           // 举报者
    reason: String,
    createdAt: Date
  }],
  reportCount: Number,          // 举报次数（用于自动处理）
  
  // 曝光
  exposureScore: Number,        // 曝光分数（动态计算）
  
  // 管理操作记录
  management: {
    // 更正领取数历史
    helpCountAdjustments: [{
      from: Number,             // 原数量
      to: Number,               // 新数量
      reason: String,           // 更正原因
      adjustedAt: Date,         // 更正时间
      adjustedBy: String        // 操作者（自己或admin）
    }],
    // 取消分享记录
    cancelledAt: Date,          // 取消时间
    cancelledBy: String,        // 取消者
    cancelReason: String        // 取消原因（可选）
  },
  
  // 时间戳
  createdAt: Date,
  updatedAt: Date,
  expireAt: Date                // 过期时间（7天后）
}

// 索引
// db.packages.createIndex({ creatorOpenid: 1, createdAt: -1 })
// db.packages.createIndex({ status: 1, createdAt: -1 })
// db.packages.createIndex({ status: 1, exposureScore: -1 })
// db.packages.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
```

#### helpRecords（帮助记录表）

```javascript
{
  _id: ObjectId,
  packageId: ObjectId,          // 礼包ID
  creatorOpenid: String,        // 发布者OpenID（冗余，方便查询）
  helperOpenid: String,         // 帮助者OpenID
  
  // 契约
  contract: {
    enabled: Boolean,
    fulfilled: Boolean,
    fulfilledAt: Date
  },
  
  // 设备信息（风控）
  deviceInfo: {
    fingerprint: String,        // 设备指纹（简化版）
    platform: String            // ios/android
  },
  
  helpedAt: Date
}

// 索引
// db.helpRecords.createIndex({ packageId: 1, helperOpenid: 1 }, { unique: true })
// db.helpRecords.createIndex({ helperOpenid: 1, helpedAt: -1 })
// db.helpRecords.createIndex({ creatorOpenid: 1, helpedAt: -1 })
```

#### reports（举报表）

```javascript
{
  _id: ObjectId,
  reporterOpenid: String,       // 举报者
  
  // 举报目标
  targetType: String,           // PACKAGE / USER
  targetId: String,             // 礼包ID或用户ID
  targetCreator: String,        // 如果是礼包，记录发布者
  
  // 举报内容
  reasonCode: String,           // 预设原因代码
  reasonText: String,           // 补充说明
  evidence: String,             // 证据（图片链接或文字）
  
  // 处理状态
  status: String,               // PENDING/PROCESSING/VALID/INVALID
  autoProcessed: Boolean,       // 是否自动处理
  
  // 处理结果
  handledBy: String,            // 处理管理员
  result: String,               // 处理说明
  creditImpact: Number,         // 对被举报者的信用影响
  reporterReward: Number,       // 对举报者的奖励
  
  // 关联操作
  relatedActions: [{
    type: String,               // package_removed/user_banned等
    targetId: String,
    timestamp: Date
  }],
  
  createdAt: Date,
  handledAt: Date
}

// 索引
// db.reports.createIndex({ targetId: 1, status: 1 })
// db.reports.createIndex({ status: 1, createdAt: 1 })
// db.reports.createIndex({ reporterOpenid: 1, createdAt: -1 })
```

#### creditHistory（信用记录表）

```javascript
{
  _id: ObjectId,
  _openid: String,              // 用户OpenID
  
  // 变动信息
  type: String,                 // ADD（增加）/ DEDUCT（扣除）
  reason: String,               // 原因描述
  reasonCode: String,           // 原因代码（便于统计）
  amount: Number,               // 变动分值
  
  // 余额
  balanceBefore: Number,        // 变动前
  balanceAfter: Number,         // 变动后
  
  // 关联
  relatedType: String,          // 关联类型：report/help/contract/system
  relatedId: String,            // 关联记录ID
  
  // 操作者
  operator: String,             // 操作者（system/admin/openid）
  
  timestamp: Date
}

// 索引
// db.creditHistory.createIndex({ _openid: 1, timestamp: -1 })
// db.creditHistory.createIndex({ relatedId: 1 })
```

#### groups（群组表）

```javascript
{
  _id: ObjectId,
  name: String,                 // 群组名称
  description: String,          // 群组描述
  avatarUrl: String,            // 群组头像
  
  creatorOpenid: String,        // 创建者
  ownerOpenid: String,          // 当前群主
  
  // 成员
  memberCount: Number,          // 成员数
  maxMembers: Number,           // 最大成员数（默认50）
  
  // 设置
  settings: {
    minCredit: Number,          // 最低信用分要求
    inviteOnly: Boolean,        // 是否仅邀请
    verifyRequired: Boolean     // 是否需要审核
  },
  
  // 统计
  stats: {
    totalPackages: Number,      // 群内发布总数
    totalHelps: Number,         // 群内互助总数
    createdAt: Date
  },
  
  updatedAt: Date
}
```

#### groupMembers（群组成员表）

```javascript
{
  _id: ObjectId,
  groupId: ObjectId,
  userOpenid: String,
  
  role: String,                 // member/admin/owner
  joinedAt: Date,
  
  // 群内统计
  stats: {
    packagesCount: Number,      // 在群内发布数
    helpsCount: Number          // 在群内帮助数
  }
}

// 索引
// db.groupMembers.createIndex({ groupId: 1, userOpenid: 1 }, { unique: true })
// db.groupMembers.createIndex({ userOpenid: 1 })
```

#### leaderboards（排行榜表）

```javascript
{
  _id: ObjectId,
  type: String,                 // helper/credit/active/contributor
  period: String,               // daily/weekly/monthly/all
  
  // 榜单数据
  data: [{
    rank: Number,               // 排名
    openid: String,
    nickname: String,           // 已打码
    avatarUrl: String,
    score: Number,              // 分数
    change: Number,             // 排名变化（+上升/-下降）
    isSelf: Boolean             // 是否当前查看用户
  }],
  
  // 统计
  totalParticipants: Number,    // 总参与人数
  updatedAt: Date,
  nextUpdateAt: Date            // 下次更新时间
}

// 索引
// db.leaderboards.createIndex({ type: 1, period: 1 }, { unique: true })
```

#### systemConfig（系统配置表）

```javascript
{
  _id: 'system_config',
  version: '1.0.0',
  
  // 管理员列表
  admins: [{
    openid: String,
    nickName: String,
    role: String,               // super/audit/config
    addedAt: Date,
    addedBy: String
  }],
  
  // 功能开关
  features: {
    basic: {
      enabled: true,
      requireAudit: true,
      autoPublishThreshold: 75
    },
    publish: {
      linkEnabled: true,
      imageEnabled: true,
      dailyQuota: 2
    },
    contract: {
      enabled: true,
      deadline: 24,               // 小时
      reminderAt: [18, 23]        // 提醒时间点
    },
    groups: {
      enabled: true,
      maxMembers: 50,
      minCredit: 75
    },
    leaderboard: {
      enabled: true,
      privacy: 'masked',          // masked/full/nickname
      types: ['helper', 'credit', 'active', 'contributor']
    },
    achievements: {
      enabled: true
    },
    smartRecommend: {
      enabled: true,
      algorithm: 'credit_priority' // credit_priority/freshness/balanced
    }
  },
  
  // 信用规则配置
  creditRules: {
    // 扣分项
    penalties: {
      FAKE_LINK: { amount: -20, auto: false },
      FAKE_IMAGE: { amount: -20, auto: false },
      NO_REWARD: { amount: -10, auto: false },
      SPAM: { amount: -30, auto: true },
      CONTRACT_BREACH: { amount: -5, auto: true },
      FALSE_REPORT: { amount: -2, auto: true },
      CHEATING: { amount: -50, auto: false }
    },
    
    // 加分项
    rewards: {
      DAILY_HELP: { amount: 1, dailyMax: 2 },
      STREAK_7: { amount: 5, cooldown: 7 },
      VALID_REPORT: { amount: 3 },
      CONTRACT_FULFILL: { amount: 2 },
      RECOVERY_30D: { amount: 5, interval: 30 }
    },
    
    // 等级阈值
    levels: {
      EXCELLENT: 90,
      GOOD: 75,
      NORMAL: 60,
      WARNING: 40,
      RESTRICTED: 20,
      BANNED: 0
    }
  },
  
  // 举报处理配置
  reportConfig: {
    autoProcess: true,
    checkInterval: 6,             // 6小时开始检查
    autoRemoveThreshold: 3,       // 3次举报自动下架
    validReward: 3,
    invalidPenalty: -2,
    falseReportLimit: 3,          // 3次无效禁举报
    falseReportBanDays: 7
  },
  
  // 数据清理配置
  cleanup: {
    enabled: true,
    packageRetention: 7,          // 礼包保留7天
    recordRetention: 30,          // 记录保留30天
    logRetention: 90              // 日志保留90天
  },
  
  // 系统统计
  stats: {
    totalUsers: 0,
    totalPackages: 0,
    pendingAudit: 0,
    todayActive: 0,
    lastUpdated: Date
  },
  
  updatedAt: Date,
  updatedBy: String
}
```

---

## API接口设计

### 接口规范

**基础路径：** `wx.cloud.callFunction({ name: 'functionName' })`

**响应格式：**
```javascript
{
  success: true/false,
  code: 200/400/401/403/404/500,
  message: '错误信息',
  data: {}
}
```

### 用户模块

#### login - 用户登录
```javascript
// 调用
wx.cloud.callFunction({
  name: 'login',
  data: {
    userInfo: { nickName, avatarUrl } // 可选
  }
})

// 响应
{
  success: true,
  data: {
    user: { /* 用户信息 */ },
    isNewUser: false,
    todayTask: { helped: 1, needHelp: 2, canPublish: false }
  }
}
```

#### getUserInfo - 获取用户信息
```javascript
wx.cloud.callFunction({
  name: 'getUserInfo',
  data: { openid: 'xxx' } // 不传则查自己
})
```

#### updateSettings - 更新设置
```javascript
wx.cloud.callFunction({
  name: 'updateSettings',
  data: {
    publicLeaderboard: true,
    enableContract: true
  }
})
```

### 礼包模块

#### getPackages - 获取礼包列表
```javascript
wx.cloud.callFunction({
  name: 'getPackages',
  data: {
    status: 'active',       // active/pending/completed/my
    sortBy: 'exposure',     // exposure/time/helpCount
    page: 1,
    limit: 20,
    groupId: 'xxx'          // 可选，查看特定群组
  }
})
```

#### publishPackage - 发布礼包
```javascript
wx.cloud.callFunction({
  name: 'publishPackage',
  data: {
    type: 'LINK',           // LINK/IMAGE
    giftUrl: 'https://...', // 链接模式
    // 或
    imageFileId: 'cloud://...', // 图片模式
    enableContract: true
  }
})

// 响应
{
  success: true,
  data: {
    packageId: 'xxx',
    status: 'pending',      // pending/active
    message: '已提交审核'
  }
}
```

#### helpPackage - 帮助礼包（领取）
```javascript
wx.cloud.callFunction({
  name: 'helpPackage',
  data: {
    packageId: 'xxx'
  }
})
```

#### getPackageDetail - 获取礼包详情
```javascript
wx.cloud.callFunction({
  name: 'getPackageDetail',
  data: {
    packageId: 'xxx'
  }
})
```

#### getMyPackages - 获取我的分享列表
```javascript
wx.cloud.callFunction({
  name: 'getMyPackages',
  data: {
    status: 'all',          // all/active/completed/cancelled/pending
    page: 1,
    limit: 20
  }
})

// 响应
{
  success: true,
  data: {
    list: [{
      packageId: 'xxx',
      type: 'LINK',
      giftUrl: '...',
      status: 'active',
      helpCount: 5,
      maxHelp: 10,
      createdAt: Date,
      // 管理操作记录
      management: {
        adjustments: [{ from: 0, to: 3, reason: '分享到微信群领了3人' }],
        isCancelled: false
      }
    }],
    total: 15,
    hasMore: true
  }
}
```

#### updatePackage - 更正分享信息
```javascript
// 用于更正领取数或编辑未审核通过的礼包
wx.cloud.callFunction({
  name: 'updatePackage',
  data: {
    packageId: 'xxx',
    action: 'adjust_help_count',  // adjust_help_count/edit_info
    // 更正领取数时
    helpCount: 5,                 // 新的已领取数
    reason: '分享到微信群领了5人', // 必须提供说明
    // 编辑信息时（仅pending/rejected状态可用）
    giftUrl: 'new_url',
    imageFileId: 'new_image'
  }
})

// 响应
{
  success: true,
  data: {
    packageId: 'xxx',
    helpCount: 5,
    remaining: 5,               // 剩余名额
    message: '领取数已更正为5，剩余5个名额'
  }
}
```

#### cancelPackage - 取消分享
```javascript
wx.cloud.callFunction({
  name: 'cancelPackage',
  data: {
    packageId: 'xxx',
    reason: '已经领满了' // 可选
  }
})

// 响应
{
  success: true,
  data: {
    message: '分享已取消，该礼包将不再展示'
  }
}

// 规则：
// 1. 只能取消自己发布的礼包
// 2. 已完成的礼包（10人领完）不能取消
// 3. 取消后status变为cancelled
// 4. 已领取记录保留，但不再接受新的领取
// 5. 不返还今日发布额度（已发布即消耗额度）
```

### 信用模块

#### getCreditHistory - 获取信用记录
```javascript
wx.cloud.callFunction({
  name: 'getCreditHistory',
  data: {
    page: 1,
    limit: 20
  }
})
```

#### getCreditRules - 获取信用规则
```javascript
wx.cloud.callFunction({
  name: 'getCreditRules'
})
```

### 排行榜模块

#### getLeaderboard - 获取排行榜
```javascript
wx.cloud.callFunction({
  name: 'getLeaderboard',
  data: {
    type: 'helper',         // helper/credit/active/contributor
    period: 'weekly'        // daily/weekly/monthly
  }
})
```

### 举报模块

#### submitReport - 提交举报
```javascript
wx.cloud.callFunction({
  name: 'submitReport',
  data: {
    targetType: 'PACKAGE',
    targetId: 'package_id',
    reasonCode: 'FAKE_LINK',
    reasonText: '链接打不开',
    evidence: 'screenshot_url' // 可选
  }
})
```

### 群组模块

#### getGroups - 获取群组列表
```javascript
wx.cloud.callFunction({
  name: 'getGroups',
  data: {
    page: 1,
    limit: 20
  }
})
```

#### createGroup - 创建群组
```javascript
wx.cloud.callFunction({
  name: 'createGroup',
  data: {
    name: '互助小分队',
    description: '高质量互助群',
    minCredit: 70,
    inviteOnly: false
  }
})
```

#### joinGroup - 加入群组
```javascript
wx.cloud.callFunction({
  name: 'joinGroup',
  data: {
    groupId: 'xxx'
  }
})
```

### 管理模块

#### adminAuditPackage - 审核礼包
```javascript
wx.cloud.callFunction({
  name: 'adminAuditPackage',
  data: {
    packageId: 'xxx',
    action: 'approve',      // approve/reject
    reason: '不符合规范'     // 拒绝时必填
  }
})
```

#### adminHandleReport - 处理举报
```javascript
wx.cloud.callFunction({
  name: 'adminHandleReport',
  data: {
    reportId: 'xxx',
    action: 'valid',        // valid/invalid
    creditImpact: -20,      // 对被举报者影响
    reason: '核实为虚假链接'
  }
})
```

#### adminAdjustCredit - 调整信用分
```javascript
wx.cloud.callFunction({
  name: 'adminAdjustCredit',
  data: {
    openid: 'user_openid',
    amount: 10,             // 正数加分，负数扣分
    reason: '补偿'
  }
})
```

#### adminUpdateConfig - 更新系统配置
```javascript
wx.cloud.callFunction({
  name: 'adminUpdateConfig',
  data: {
    feature: 'contract.enabled',
    value: false
  }
})
```

#### adminGetStats - 获取统计数据
```javascript
wx.cloud.callFunction({
  name: 'adminGetStats'
})
```

---

## 页面结构

### 页面清单

| 页面 | 路径 | 功能描述 | 优先级 |
|------|------|----------|--------|
| 首页 | pages/index/index | 礼包列表，曝光排序 | P0 |
| 发布 | pages/publish/index | 发布礼包（链接/图片） | P0 |
| 礼包详情 | pages/package/detail | 礼包详情，帮助按钮 | P0 |
| 我的 | pages/my/index | 个人中心，今日任务 | P0 |
| **分享管理** | **pages/my/packages** | **管理我的分享（取消/更正）** | **P0** |
| 信用记录 | pages/credit/history | 信用分变动记录 | P1 |
| 排行榜 | pages/leaderboard/index | 4类榜单 | P1 |
| 举报 | pages/report/index | 提交举报 | P1 |
| 群组 | pages/groups/index | 群组列表 | P2 |
| 群组详情 | pages/groups/detail | 群组内礼包 | P2 |
| 规则说明 | pages/rules/index | 信用规则/使用教程 | P1 |
| 管理员后台 | admin/index.html | Web管理端 | P1 |

### 核心页面设计

#### 1. 首页（pages/index/index）

**布局：**
```
┌─────────────────────────────┐
│ 🔍 搜索栏                    │
├─────────────────────────────┤
│ [全部] [链接] [图片] [群组]   │ ← Tab筛选
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │ 🏆 用户A               │   │ ← 礼包卡片
│ │ [图片] 还差3人领满      │   │
│ │ 2分钟前 · 曝光值: 85   │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ ⭐ 用户B               │   │
│ │ [链接] 元宝抽奖         │   │
│ │ 5分钟前 · 曝光值: 72   │   │
│ └───────────────────────┘   │
├─────────────────────────────┤
│    [发布按钮 - 悬浮]         │
└─────────────────────────────┘
```

**排序算法：**
```javascript
exposureScore = (
  baseScore: 50,
  + (creditLevel.weight * 20),    // 信用等级权重
  + (freshness * 30),              // 新鲜度（发布时间）
  + (urgency * 15),                // 紧急度（差几人满）
  + (random * 5)                   // 随机因子（防刷）
)
```

#### 2. 发布页（pages/publish/index）

**前置检查：**
```javascript
// 1. 检查今日互助数
if (dailyStats.helped < 2) {
  showModal('请先完成今日互助任务')
  return
}

// 2. 检查发布额度
if (dailyStats.published >= dailyQuota) {
  showModal('今日发布额度已用完')
  return
}

// 3. 检查信用分
if (creditScore < 20) {
  showModal('信用分过低，无法发布')
  return
}
```

**布局：**
```
┌─────────────────────────────┐
│ ← 发布礼包                  │
├─────────────────────────────┤
│ [粘贴链接] [上传图片]        │ ← Tab切换
├─────────────────────────────┤
│                             │
│  输入框：粘贴元宝链接        │
│  或                         │
│  [+ 上传二维码图片]          │
│                             │
├─────────────────────────────┤
│ ☑️ 开启互助契约             │
│   （24小时内需发布自己的）   │
├─────────────────────────────┤
│     [确认发布]              │
└─────────────────────────────┘
```

#### 3. 我的页（pages/my/index）

**布局：**
```
┌─────────────────────────────┐
│  ┌─────┐                    │
│  │头像 │  用户昵称 🔹       │
│  └─────┘  信用分: 60         │
│           等级: 一般         │
├─────────────────────────────┤
│ 📊 今日任务                  │
│ ┌───────────────────────┐   │
│ │ 互助进度：░░░░░░░░ 2/2 │   │ ← 完成后变绿色
│ │ 发布额度：░░░░░░░░ 0/2 │   │
│ └───────────────────────┘   │
├─────────────────────────────┤
│ 🏅 我的徽章                  │
│ [🏅][🥉][🔥] 查看全部 →    │
├─────────────────────────────┤
│ 📋 功能列表                  │
│ ├─ 我的发布                 │
│ ├─ 我的帮助                 │
│ ├─ 信用记录                 │
│ ├─ 排行榜                   │
│ ├─ 互助群组                 │
│ ├─ 设置                     │
│ └─ 规则说明                 │
└─────────────────────────────┘
```

#### 4. 分享管理页（pages/my/packages）

**布局：**
```
┌─────────────────────────────┐
│ ← 我的分享                  │
├─────────────────────────────┤
│ [全部][进行中][已领满][已取消]│ ← Tab筛选
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │ 🔹 进行中              │   │
│ │ [链接] 元宝抽奖         │   │
│ │ 已领 3/10              │   │
│ │                         │   │
│ │ [更正] [取消分享] [查看]│   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ ✅ 已领满              │   │
│ │ [图片] 二维码           │   │
│ │ 已领 10/10             │   │
│ │ 完成时间：2小时前       │   │
│ │                         │   │
│ │ [查看详情]             │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ ❌ 已取消              │   │
│ │ [链接] 元宝抽奖         │   │
│ │ 取消时间：2026-02-01    │   │
│ │ 原因：已领满            │   │
│ │                         │   │
│ │ [重新发布]             │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

**更正领取数弹窗：**
```
┌─────────────────────────────┐
│     更正领取数量            │
├─────────────────────────────┤
│                             │
│  当前显示：3人已领           │
│                             │
│  实际已领：[    5    ]人    │
│                             │
│  更正说明：                 │
│  ┌───────────────────────┐ │
│  │分享到微信群领了2人    │ │
│  └───────────────────────┘ │
│                             │
│  ⚠️ 更正后剩余5个名额      │
│                             │
│    [取消]    [确认更正]     │
└─────────────────────────────┘
```

**取消分享弹窗：**
```
┌─────────────────────────────┐
│      确认取消分享？          │
├─────────────────────────────┤
│                             │
│ 取消后该礼包将不再展示，    │
│ 其他人无法继续领取。        │
│                             │
│ 取消原因（可选）：          │
│ ├─ ○ 已经领满了            │
│ ├─ ○ 链接已失效            │
│ ├─ ○ 不想分享了            │
│ └─ ○ 其他原因              │
│                             │
│    [暂不取消]  [确认取消]   │
└─────────────────────────────┘
```

**页面逻辑：**
```javascript
Page({
  data: {
    currentTab: 'all',  // all/active/completed/cancelled
    packages: [],
    hasMore: true
  },

  onLoad() {
    this.loadPackages()
  },

  // 加载分享列表
  async loadPackages() {
    const res = await wx.cloud.callFunction({
      name: 'getMyPackages',
      data: {
        status: this.data.currentTab,
        page: 1,
        limit: 20
      }
    })
    
    this.setData({
      packages: res.result.data.list
    })
  },

  // 更正领取数
  async handleAdjust(e) {
    const { packageId, currentCount } = e.currentTarget.dataset
    
    // 弹出输入框
    const { value } = await wx.showModal({
      title: '更正领取数量',
      editable: true,
      placeholderText: `当前显示${currentCount}人`
    })
    
    const newCount = parseInt(value)
    
    // 校验
    if (newCount <= currentCount) {
      wx.showToast({ title: '只能增加不能减少', icon: 'none' })
      return
    }
    if (newCount > 10) {
      wx.showToast({ title: '不能超过10人', icon: 'none' })
      return
    }
    
    // 请求更正
    const { reason } = await this.showReasonInput() // 弹出原因输入
    
    await wx.cloud.callFunction({
      name: 'updatePackage',
      data: {
        packageId,
        action: 'adjust_help_count',
        helpCount: newCount,
        reason
      }
    })
    
    wx.showToast({ title: '更正成功' })
    this.loadPackages()
  },

  // 取消分享
  async handleCancel(e) {
    const { packageId } = e.currentTarget.dataset
    
    const { confirm } = await wx.showModal({
      title: '确认取消分享？',
      content: '取消后其他人将无法领取',
      confirmText: '确认取消',
      cancelText: '暂不'
    })
    
    if (confirm) {
      await wx.cloud.callFunction({
        name: 'cancelPackage',
        data: { packageId }
      })
      
      wx.showToast({ title: '已取消分享' })
      this.loadPackages()
    }
  }
})
```

---

## 开发计划

### Phase 1: 基础架构（第1-4天）

**Day 1: 项目初始化**
- [ ] 创建小程序项目
- [ ] 配置云开发环境
- [ ] 设计数据库集合结构
- [ ] 创建数据库索引

**Day 2: 微信登录**
- [ ] 实现login云函数
- [ ] 前端登录流程
- [ ] 用户信息存储
- [ ] 新用户初始化（60分）

**Day 3: 用户系统**
- [ ] 用户信息获取API
- [ ] 每日任务统计
- [ ] 连续登录检测
- [ ] 个人中心页面框架

**Day 4: 系统配置**
- [ ] systemConfig集合
- [ ] 功能开关设计
- [ ] 信用规则配置化
- [ ] 管理员权限体系

### Phase 2: 核心流程（第5-9天）

**Day 5: 发布功能-链接模式**
- [ ] URL格式验证
- [ ] 提取giftId去重
- [ ] 发布前检查（互助数/额度/信用）
- [ ] 审核流程（人工）

**Day 6: 发布功能-图片模式**
- [ ] 图片上传到云存储
- [ ] 生成临时访问链接
- [ ] 图片礼包数据结构
- [ ] 图片预览功能

**Day 7: 首页与列表**
- [ ] 礼包列表API
- [ ] 曝光排序算法
- [ ] 首页UI实现
- [ ] 下拉刷新/上拉加载

**Day 8: 领取功能**
- [ ] 帮助礼包API
- [ ] 防重复领取验证
- [ ] 帮助记录存储
- [ ] 实时更新状态

**Day 9: 信用分系统**
- [ ] 信用分变动逻辑
- [ ] 等级自动计算
- [ ] 每日额度重置
- [ ] 信用记录存储

### Phase 3: 高级功能（第10-14天）

**Day 10: 举报系统**
- [ ] 举报提交API
- [ ] 举报类型预设
- [ ] 6-24小时自动处理
- [ ] 奖惩执行逻辑

**Day 11: 排行榜**
- [ ] 4类榜单计算逻辑
- [ ] 定时更新任务
- [ ] 隐私打码处理
- [ ] 榜单UI实现

**Day 12: 互助契约**
- [ ] 契约签订逻辑
- [ ] 24小时倒计时
- [ ] 提醒推送（可选）
- [ ] 违约自动扣分

**Day 13: 群组系统**
- [ ] 群组CRUD
- [ ] 成员管理
- [ ] 群内优先展示
- [ ] 群组UI实现

**Day 14: 成就徽章**
- [ ] 徽章定义
- [ ] 获得条件检测
- [ ] 徽章展示
- [ ] 特权应用（曝光加成等）

### Phase 4: 管理后台（第15-17天）

**Day 15: Web管理端基础**
- [ ] 管理员登录验证
- [ ] 礼包审核界面
- [ ] 用户信用管理
- [ ] 举报处理界面

**Day 16: 系统管理**
- [ ] 功能开关配置
- [ ] 信用规则调整
- [ ] 管理员权限管理
- [ ] 系统统计数据

**Day 17: 数据管理**
- [ ] 定时清理任务
- [ ] 数据导出功能
- [ ] 日志查询
- [ ] 公告发布

### Phase 5: 测试优化（第18-20天）

**Day 18: 功能测试**
- [ ] 单元测试
- [ ] 集成测试
- [ ] 边界情况测试
- [ ] Bug修复

**Day 19: 性能优化**
- [ ] 数据库查询优化
- [ ] 云函数性能优化
- [ ] 前端性能优化
- [ ] 缓存策略

**Day 20: 上线准备**
- [ ] 审核材料准备
- [ ] 隐私协议
- [ ] 用户协议
- [ ] 提交微信审核

---

## 技术规范

### 代码规范

#### 命名约定
```javascript
// 变量：camelCase
let userInfo = {}
let creditScore = 60
let isActive = true

// 常量：UPPER_SNAKE
const MAX_HELP = 10
const DEFAULT_CREDIT = 60

// 函数：camelCase，动词开头
function getUserInfo() {}
function handleSubmit() {}
function calculateExposure() {}

// 文件：kebab-case
// pages/user-profile/index.js
// cloudfunctions/update-credit/index.js

// 组件：PascalCase（如果使用自定义组件）
// components/PackageCard/PackageCard.wxml
```

#### 注释规范
```javascript
/**
 * 计算礼包曝光分数
 * @param {Object} package - 礼包数据
 * @param {Object} user - 当前用户
 * @returns {Number} 曝光分数
 */
function calculateExposure(package, user) {
  // 基础分数
  let score = 50
  
  // 根据信用等级加权
  const levelWeights = {
    EXCELLENT: 2.0,
    GOOD: 1.5,
    NORMAL: 1.0,
    WARNING: 0.5
  }
  score *= levelWeights[user.level] || 1.0
  
  return score
}
```

### 安全规范

1. **数据校验**
```javascript
// 所有输入必须校验
function validateGiftUrl(url) {
  const pattern = /^https:\/\/yb\.tencent\.com\/fes\/red\/claim/
  return pattern.test(url)
}
```

2. **权限检查**
```javascript
// 敏感操作检查权限
async function deletePackage(packageId, userOpenid) {
  const pkg = await db.collection('packages').doc(packageId).get()
  
  // 只能删除自己的
  if (pkg.data.creatorOpenid !== userOpenid) {
    throw new Error('无权限')
  }
  
  // 或检查是否是管理员
  const isAdmin = await checkAdmin(userOpenid)
  if (!isAdmin) {
    throw new Error('无权限')
  }
}
```

3. **防刷限制**
```javascript
// 频率限制
const rateLimit = {
  publish: { count: 10, window: 60 },    // 60秒内最多10次
  help: { count: 5, window: 60 },
  report: { count: 3, window: 300 }
}
```

### 性能优化

1. **数据库优化**
```javascript
// 使用索引
// db.collection('packages').where({ status: 'active' }).orderBy('createdAt', 'desc')

// 分页查询
function getPackages(page = 1, limit = 20) {
  return db.collection('packages')
    .skip((page - 1) * limit)
    .limit(limit)
    .get()
}

// 只查询需要的字段
.field({ _openid: true, nickName: true, avatarUrl: true })
```

2. **云函数优化**
```javascript
// 批量操作
const batch = db.batch()
packages.forEach(pkg => {
  batch.update(pkg.ref, { status: 'expired' })
})
await batch.commit()

// 并行查询
const [users, packages] = await Promise.all([
  getUsers(),
  getPackages()
])
```

3. **前端优化**
```javascript
// 图片懒加载
<image src="{{item.avatarUrl}}" lazy-load />

// 列表虚拟滚动（数据量大时）
// 使用 recycle-view 组件

// 本地缓存
wx.setStorageSync('userInfo', userInfo)
```

---

## 部署配置

### 云开发环境

```yaml
# project.config.json
{
  "cloudfunctionRoot": "cloudfunctions/",
  "cloudfunctionTemplateRoot": "cloudfunctionTemplate/",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true
  }
}
```

### 云函数列表

| 函数名 | 功能 | 触发器 | 内存配置 |
|--------|------|--------|----------|
| login | 用户登录 | HTTP | 128MB |
| user | 用户相关操作 | HTTP | 128MB |
| packages | 礼包CRUD | HTTP | 256MB |
| help | 帮助操作 | HTTP | 128MB |
| credit | 信用分操作 | HTTP | 128MB |
| report | 举报处理 | HTTP | 128MB |
| leaderboard | 排行榜 | HTTP | 256MB |
| groups | 群组操作 | HTTP | 128MB |
| admin | 管理操作 | HTTP | 512MB |
| cleanup | 数据清理 | Timer(每天4点) | 256MB |
| updateLeaderboard | 更新榜单 | Timer(每小时) | 512MB |
| contractCheck | 契约检查 | Timer(每小时) | 128MB |
| reportProcessor | 举报处理 | Timer(每6小时) | 256MB |

### 定时任务配置

```json
// cloudfunctions/cleanup/config.json
{
  "triggers": [
    {
      "name": "cleanup",
      "type": "timer",
      "config": "0 0 4 * * * *"
    }
  ]
}

// cloudfunctions/updateLeaderboard/config.json
{
  "triggers": [
    {
      "name": "updateLeaderboard",
      "type": "timer",
      "config": "0 0 * * * * *"
    }
  ]
}

// cloudfunctions/contractCheck/config.json
{
  "triggers": [
    {
      "name": "contractCheck",
      "type": "timer",
      "config": "0 0 * * * * *"
    }
  ]
}
```

---

## 费用预算

### 免费额度（每月）

| 资源 | 免费额度 | 预估用量 | 状态 |
|------|----------|----------|------|
| 云函数调用 | 500万次 | 10万次 | ✅ 充足 |
| 云函数运行 | 10万GBs | 5000GBs | ✅ 充足 |
| 数据库读 | 500万次 | 50万次 | ✅ 充足 |
| 数据库写 | 300万次 | 20万次 | ✅ 充足 |
| 云存储容量 | 5GB | 2GB | ✅ 充足 |
| 云存储下载 | 5GB | 1GB | ✅ 充足 |
| CDN流量 | 5GB | 2GB | ✅ 充足 |

### 预期费用（超出免费额度后）

| 用户数 | 月费用 | 主要消耗 |
|--------|--------|----------|
| 1,000 | ¥0 | 免费额度内 |
| 10,000 | ¥0-50 | 可能略超 |
| 50,000 | ¥100-200 | 数据库读写 |
| 100,000 | ¥300-500 | 云函数+数据库 |

**成本控制措施：**
1. 定期清理过期数据
2. 使用缓存减少数据库查询
3. 图片压缩后上传
4. 批量操作代替单条

---

## 风险评估

### 技术风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 微信审核不通过 | 中 | 高 | 强调公益性质，准备备用文案 |
| 用户量超出免费额度 | 低 | 中 | 监控使用量，设置告警 |
| 数据库性能瓶颈 | 低 | 中 | 优化索引，必要时分表 |
| 云函数冷启动慢 | 中 | 低 | 预热策略，保持最小实例 |

### 运营风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 恶意用户破坏生态 | 中 | 高 | 完善风控，快速响应举报 |
| 用户增长缓慢 | 中 | 中 | 优化产品体验，口碑传播 |
| 平台规则变化 | 低 | 高 | 关注微信政策，灵活调整 |
| 竞争对手出现 | 高 | 低 | 保持创新，用户粘性 |

### 法律风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 用户隐私投诉 | 低 | 高 | 严格遵守隐私协议 |
| 抽奖链接合规性 | 低 | 高 | 声明仅提供互助平台 |
| 用户纠纷 | 中 | 中 | 完善举报机制，留存证据 |

---

## 附录

### A. 元宝链接解析

```javascript
// 示例链接
const url = 'https://yb.tencent.com/fes/red/claim?signature=xxx&red_packet_id=xxx'

// 解析函数
function parseYuanbaoUrl(url) {
  try {
    const urlObj = new URL(url)
    const params = new URLSearchParams(urlObj.search)
    
    return {
      valid: urlObj.hostname === 'yb.tencent.com',
      giftId: params.get('red_packet_id'),
      signature: params.get('signature'),
      path: urlObj.pathname
    }
  } catch (e) {
    return { valid: false }
  }
}
```

### B. 设备指纹（简化版）

```javascript
// 前端收集
function getDeviceFingerprint() {
  const info = wx.getSystemInfoSync()
  
  const fingerprint = [
    info.platform,
    info.brand,
    info.model,
    info.system,
    info.screenWidth,
    info.screenHeight,
    info.pixelRatio
  ].join('|')
  
  // 简单哈希
  return simpleHash(fingerprint)
}

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}
```

### C. 昵称打码算法

```javascript
function maskNickname(nickname) {
  if (!nickname || nickname.length === 0) {
    return '用**'
  }
  
  if (nickname.length <= 2) {
    return nickname[0] + '**'
  }
  
  const first = nickname[0]
  const last = nickname[nickname.length - 1]
  const middle = '*'.repeat(nickname.length - 2)
  
  return first + middle + last
}

// 测试用例
console.log(maskNickname('张三'))        // '张**'
console.log(maskNickname('李小明'))      // '李*明'
console.log(maskNickname('HelloWorld'))  // 'H*******d'
```

### D. 曝光分数计算

```javascript
function calculateExposureScore(package, config) {
  const now = Date.now()
  const created = package.createdAt.getTime()
  const age = (now - created) / (1000 * 60 * 60) // 小时数
  
  // 基础分
  let score = 50
  
  // 信用等级权重
  const levelWeights = {
    EXCELLENT: 2.0,
    GOOD: 1.5,
    NORMAL: 1.0,
    WARNING: 0.5,
    RESTRICTED: 0,
    BANNED: 0
  }
  score *= levelWeights[package.creatorLevel] || 1.0
  
  // 新鲜度（发布时间越近越高）
  if (age < 1) {
    score += 30 // 1小时内
  } else if (age < 6) {
    score += 20 // 6小时内
  } else if (age < 24) {
    score += 10 // 24小时内
  }
  
  // 紧急度（差几人满）
  const remaining = package.maxHelp - package.helpCount
  if (remaining <= 2) {
    score += 15 // 快满了，紧急
  } else if (remaining <= 5) {
    score += 8
  }
  
  // 随机因子（0-5分，防止完全排序）
  score += Math.random() * 5
  
  return Math.round(score)
}
```

### E. 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2026-02 | 初始版本，核心功能 |
| v1.1.0 | 待定 | OCR识别、智能推荐优化 |
| v1.2.0 | 待定 | 社区功能、话题讨论 |
| v2.0.0 | 待定 | 开放API、多平台支持 |

---

## 联系我们

- **项目主页：** [待添加]
- **问题反馈：** [待添加]
- **管理员邮箱：** [待添加]

---

**文档版本：** v1.0.0  
**最后更新：** 2026-02-02  
**作者：** 点点圈开发团队
