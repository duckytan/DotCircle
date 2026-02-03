// 数据库索引配置
// 在微信云开发控制台数据库中依次创建以下索引
// 或者使用 db.collection('xxx').createIndex() 命令

module.exports = {
  // users 集合索引
  users: [
    {
      name: '_openid_unique',
      key: { _openid: 1 },
      unique: true
    },
    {
      name: 'credit_score_idx',
      key: { creditScore: -1 }
    },
    {
      name: 'daily_stats_date_idx',
      key: { 'dailyStats.date': 1 }
    },
    {
      name: 'credit_date_compound',
      key: { 'dailyStats.date': 1, creditScore: -1 }
    }
  ],

  // packages 集合索引
  packages: [
    {
      name: 'creator_time_idx',
      key: { creatorOpenid: 1, createdAt: -1 }
    },
    {
      name: 'status_time_idx',
      key: { status: 1, createdAt: -1 }
    },
    {
      name: 'status_exposure_idx',
      key: { status: 1, exposureScore: -1 }
    },
    {
      name: 'expire_ttl',
      key: { expireAt: 1 },
      expireAfterSeconds: 0  // TTL索引，过期自动删除
    },
    {
      name: 'gift_id_idx',
      key: { giftId: 1 }
    },
    {
      name: 'status_type_time',
      key: { status: 1, type: 1, createdAt: -1 }
    }
  ],

  // helpRecords 集合索引
  helpRecords: [
    {
      name: 'package_helper_unique',
      key: { packageId: 1, helperOpenid: 1 },
      unique: true
    },
    {
      name: 'helper_time_idx',
      key: { helperOpenid: 1, helpedAt: -1 }
    },
    {
      name: 'creator_time_idx',
      key: { creatorOpenid: 1, helpedAt: -1 }
    },
    {
      name: 'package_id_idx',
      key: { packageId: 1 }
    }
  ],

  // creditHistory 集合索引
  creditHistory: [
    {
      name: 'user_time_idx',
      key: { _openid: 1, timestamp: -1 }
    },
    {
      name: 'related_id_idx',
      key: { relatedId: 1 }
    },
    {
      name: 'reason_code_idx',
      key: { reasonCode: 1 }
    }
  ],

  // reports 集合索引
  reports: [
    {
      name: 'target_status_idx',
      key: { targetId: 1, status: 1 }
    },
    {
      name: 'status_time_idx',
      key: { status: 1, createdAt: 1 }
    },
    {
      name: 'reporter_time_idx',
      key: { reporterOpenid: 1, createdAt: -1 }
    }
  ],

  // groups 集合索引
  groups: [
    {
      name: 'creator_idx',
      key: { creatorOpenid: 1 }
    },
    {
      name: 'member_count_idx',
      key: { memberCount: -1 }
    }
  ],

  // groupMembers 集合索引
  groupMembers: [
    {
      name: 'group_user_unique',
      key: { groupId: 1, userOpenid: 1 },
      unique: true
    },
    {
      name: 'user_idx',
      key: { userOpenid: 1 }
    }
  ],

  // leaderboards 集合索引
  leaderboards: [
    {
      name: 'type_period_unique',
      key: { type: 1, period: 1 },
      unique: true
    }
  ],

  // systemConfig 集合索引
  systemConfig: [
    {
      name: 'id_unique',
      key: { _id: 1 },
      unique: true
    }
  ],

  // adminLogs 集合索引
  adminLogs: [
    {
      name: 'admin_time_idx',
      key: { adminOpenid: 1, timestamp: -1 }
    },
    {
      name: 'action_time_idx',
      key: { action: 1, timestamp: -1 }
    }
  ]
}

/*
创建索引的命令示例：

// 在小程序端或云函数中执行
const db = wx.cloud.database()

// 创建单个索引
db.collection('users').createIndex({
  name: '_openid_unique',
  key: { _openid: 1 },
  unique: true
})

// 或者在云开发控制台手动创建：
1. 打开云开发控制台
2. 进入 "数据库"
3. 选择集合
4. 点击 "索引"
5. 点击 "添加索引"
6. 填写索引名称和字段
7. 保存

建议优先创建以下核心索引：
1. users: _openid_unique (唯一)
2. packages: status_exposure_idx (查询优化)
3. packages: expire_ttl (自动清理)
4. helpRecords: package_helper_unique (唯一，防重复)
5. creditHistory: user_time_idx (查询优化)
*/