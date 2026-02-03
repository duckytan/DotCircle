// 用户操作云函数
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
      case 'getInfo':
        return await getUserInfo(event, OPENID)
      case 'updateSettings':
        return await updateSettings(event, OPENID)
      default:
        return { success: false, code: 400, message: '未知操作' }
    }
  } catch (err) {
    console.error('用户操作失败:', err)
    return { success: false, code: 500, message: err.message }
  }
}

async function getUserInfo(event, openid) {
  const targetOpenid = event.openid || openid
  
  const { data } = await db.collection('users').where({
    _openid: targetOpenid
  }).get()
  
  if (data.length === 0) {
    return { success: false, code: 404, message: '用户不存在' }
  }
  
  const user = data[0]
  
  // 获取今日任务状态
  const todayTask = {
    helped: user.dailyStats?.helped || 0,
    needHelp: 2,
    published: user.dailyStats?.published || 0,
    quota: user.dailyStats?.quota || 2,
    canPublish: (user.dailyStats?.helped || 0) >= 2 && 
                (user.dailyStats?.published || 0) < (user.dailyStats?.quota || 2)
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
        achievements: user.achievements,
        settings: user.settings
      },
      todayTask
    }
  }
}

async function updateSettings(event, openid) {
  const { settings } = event
  
  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) {
    return { success: false, code: 404, message: '用户不存在' }
  }
  
  await db.collection('users').doc(userRes.data[0]._id).update({
    data: {
      settings: {
        ...userRes.data[0].settings,
        ...settings
      },
      updatedAt: new Date()
    }
  })
  
  return { success: true, data: { message: '设置已更新' } }
}