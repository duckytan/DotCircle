// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 信用等级配置
const CREDIT_LEVELS = {
  EXCELLENT: { min: 90, name: '优秀', quota: 3 },
  GOOD: { min: 75, name: '良好', quota: 2 },
  NORMAL: { min: 60, name: '一般', quota: 2 },
  WARNING: { min: 40, name: '警告', quota: 1 },
  RESTRICTED: { min: 20, name: '受限', quota: 0 },
  BANNED: { min: 0, name: '封禁', quota: 0 }
}

// 获取信用等级
function getCreditLevel(score) {
  for (const [level, config] of Object.entries(CREDIT_LEVELS)) {
    if (score >= config.min) {
      return level
    }
  }
  return 'BANNED'
}

// 获取今日日期字符串
function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID, UNIONID } = wxContext
  const { userInfo = {} } = event

  try {
    // 查询用户是否存在
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).get()

    let user = null
    let isNewUser = false
    const today = getTodayString()

    if (userRes.data.length === 0) {
      // 新用户注册
      isNewUser = true
      const defaultCredit = 60
      const creditLevel = getCreditLevel(defaultCredit)
      
      const newUser = {
        _openid: OPENID,
        unionid: UNIONID || null,
        nickName: userInfo.nickName || '微信用户',
        avatarUrl: userInfo.avatarUrl || '',
        creditScore: defaultCredit,
        creditLevel: creditLevel,
        dailyStats: {
          date: today,
          helped: 0,
          published: 0,
          quota: CREDIT_LEVELS[creditLevel].quota
        },
        totalStats: {
          totalHelped: 0,
          totalPublished: 0,
          totalReceived: 0,
          streakDays: 1,
          lastActive: new Date()
        },
        achievements: ['NEWBIE'],
        settings: {
          publicLeaderboard: true,
          enableContract: true,
          allowNotification: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const addRes = await db.collection('users').add({
        data: newUser
      })

      user = { ...newUser, _id: addRes._id }
    } else {
      // 老用户更新
      user = userRes.data[0]
      const updates = {
        updatedAt: new Date(),
        'totalStats.lastActive': new Date()
      }

      // 更新用户信息（如果有变化）
      if (userInfo.nickName && userInfo.nickName !== user.nickName) {
        updates.nickName = userInfo.nickName
      }
      if (userInfo.avatarUrl && userInfo.avatarUrl !== user.avatarUrl) {
        updates.avatarUrl = userInfo.avatarUrl
      }

      // 检查是否需要重置每日统计
      if (user.dailyStats.date !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
        
        updates.dailyStats = {
          date: today,
          helped: 0,
          published: 0,
          quota: CREDIT_LEVELS[user.creditLevel].quota
        }

        // 连续登录逻辑
        if (user.dailyStats.date === yesterdayStr) {
          updates['totalStats.streakDays'] = (user.totalStats.streakDays || 1) + 1
        } else {
          updates['totalStats.streakDays'] = 1
        }
      }

      await db.collection('users').doc(user._id).update({ data: updates })
      
      // 重新获取更新后的用户信息
      const updatedUser = await db.collection('users').doc(user._id).get()
      user = updatedUser.data
    }

    // 构建今日任务状态
    const todayTask = {
      helped: user.dailyStats.helped || 0,
      needHelp: 2,
      published: user.dailyStats.published || 0,
      quota: user.dailyStats.quota || 2,
      canPublish: (user.dailyStats.helped || 0) >= 2 && (user.dailyStats.published || 0) < (user.dailyStats.quota || 2)
    }

    return {
      success: true,
      data: {
        user: {
          _id: user._id,
          _openid: user._openid,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          creditScore: user.creditScore,
          creditLevel: user.creditLevel,
          dailyStats: user.dailyStats,
          totalStats: user.totalStats,
          achievements: user.achievements
        },
        isNewUser,
        todayTask
      }
    }

  } catch (err) {
    console.error('登录失败:', err)
    return {
      success: false,
      code: 500,
      message: err.message || '登录失败'
    }
  }
}