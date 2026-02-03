// 信用相关云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  const { action } = event

  try {
    switch (action) {
      case 'getHistory':
        return await getCreditHistory(event, OPENID)
      case 'getRules':
        return await getCreditRules()
      default:
        return { success: false, code: 400, message: '未知操作' }
    }
  } catch (err) {
    console.error('信用操作失败:', err)
    return { success: false, code: 500, message: err.message }
  }
}

async function getCreditHistory(event, openid) {
  const { page = 1, limit = 20 } = event
  
  const { data } = await db.collection('creditHistory')
    .where({ _openid: openid })
    .orderBy('timestamp', 'desc')
    .skip((page - 1) * limit)
    .limit(limit)
    .get()
  
  return { success: true, data: { list: data } }
}

async function getCreditRules() {
  const rules = {
    penalties: [
      { type: 'FAKE_LINK', name: '虚假链接', score: -20 },
      { type: 'NO_REWARD', name: '领取无奖励', score: -10 },
      { type: 'SPAM', name: '垃圾广告', score: -30 },
      { type: 'CONTRACT_BREACH', name: '未履行契约', score: -5 },
      { type: 'FALSE_REPORT', name: '恶意举报', score: -2 },
      { type: 'CHEATING', name: '作弊行为', score: -50 }
    ],
    rewards: [
      { type: 'DAILY_HELP', name: '每日互助', score: 1, limit: '2次/天' },
      { type: 'STREAK_7', name: '连续7天互助', score: 5, limit: '7天一次' },
      { type: 'VALID_REPORT', name: '有效举报', score: 3, limit: '无上限' },
      { type: 'CONTRACT_FULFILL', name: '履行契约', score: 2, limit: '每次' },
      { type: 'RECOVERY_30D', name: '30天自然恢复', score: 5, limit: '30天一次' }
    ],
    levels: [
      { level: 'EXCELLENT', name: '优秀', minScore: 90, quota: 3 },
      { level: 'GOOD', name: '良好', minScore: 75, quota: 2 },
      { level: 'NORMAL', name: '一般', minScore: 60, quota: 2 },
      { level: 'WARNING', name: '警告', minScore: 40, quota: 1 },
      { level: 'RESTRICTED', name: '受限', minScore: 20, quota: 0 },
      { level: 'BANNED', name: '封禁', minScore: 0, quota: 0 }
    ]
  }
  
  return { success: true, data: rules }
}