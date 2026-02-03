// 排行榜云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { type = 'helper', period = 'weekly' } = event
  
  try {
    let data = []
    
    switch (type) {
      case 'helper':
        data = await getHelperLeaderboard(period)
        break
      case 'credit':
        data = await getCreditLeaderboard()
        break
      case 'active':
        data = await getActiveLeaderboard()
        break
      case 'contributor':
        data = await getContributorLeaderboard(period)
        break
      default:
        return { success: false, code: 400, message: '未知榜单类型' }
    }
    
    // 处理昵称打码
    data = data.map((item, index) => ({
      ...item,
      rank: index + 1,
      nickname: maskNickname(item.nickname)
    }))
    
    return { success: true, data: { type, period, list: data } }
  } catch (err) {
    console.error('获取排行榜失败:', err)
    return { success: false, code: 500, message: err.message }
  }
}

async function getHelperLeaderboard(period) {
  // 获取帮助数最多的用户
  const { data } = await db.collection('users')
    .orderBy('totalStats.totalHelped', 'desc')
    .limit(100)
    .field({
      nickName: true,
      avatarUrl: true,
      creditScore: true,
      'totalStats.totalHelped': true
    })
    .get()
  
  return data.map(user => ({
    openid: user._openid,
    nickname: user.nickName || '用户',
    avatarUrl: user.avatarUrl,
    score: user.totalStats?.totalHelped || 0
  }))
}

async function getCreditLeaderboard() {
  // 获取信用分最高的用户
  const { data } = await db.collection('users')
    .orderBy('creditScore', 'desc')
    .limit(100)
    .field({
      nickName: true,
      avatarUrl: true,
      creditScore: true
    })
    .get()
  
  return data.map(user => ({
    openid: user._openid,
    nickname: user.nickName || '用户',
    avatarUrl: user.avatarUrl,
    score: user.creditScore
  }))
}

async function getActiveLeaderboard() {
  // 获取连续登录天数最多的用户
  const { data } = await db.collection('users')
    .orderBy('totalStats.streakDays', 'desc')
    .limit(100)
    .field({
      nickName: true,
      avatarUrl: true,
      creditScore: true,
      'totalStats.streakDays': true
    })
    .get()
  
  return data.map(user => ({
    openid: user._openid,
    nickname: user.nickName || '用户',
    avatarUrl: user.avatarUrl,
    score: user.totalStats?.streakDays || 0
  }))
}

async function getContributorLeaderboard(period) {
  // 获取发布数最多的用户
  const { data } = await db.collection('users')
    .orderBy('totalStats.totalPublished', 'desc')
    .limit(100)
    .field({
      nickName: true,
      avatarUrl: true,
      creditScore: true,
      'totalStats.totalPublished': true
    })
    .get()
  
  return data.map(user => ({
    openid: user._openid,
    nickname: user.nickName || '用户',
    avatarUrl: user.avatarUrl,
    score: user.totalStats?.totalPublished || 0
  }))
}

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