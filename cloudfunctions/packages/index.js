// 礼包相关云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 信用等级配置
const CREDIT_LEVELS = {
  EXCELLENT: { weight: 2.0, autoAudit: true },
  GOOD: { weight: 1.5, autoAudit: true },
  NORMAL: { weight: 1.0, autoAudit: false },
  WARNING: { weight: 0.5, autoAudit: false },
  RESTRICTED: { weight: 0, autoAudit: false },
  BANNED: { weight: 0, autoAudit: false }
}

// 计算曝光分数
function calculateExposureScore(pkg, user) {
  const baseScore = 50
  const creditWeight = CREDIT_LEVELS[user.creditLevel]?.weight || 1.0
  
  // 新鲜度（发布时间，越新越高）
  const age = Date.now() - new Date(pkg.createdAt).getTime()
  const freshness = Math.max(0, 1 - age / (24 * 60 * 60 * 1000)) * 30
  
  // 紧急度（差几人满）
  const remaining = pkg.maxHelp - pkg.helpCount
  const urgency = (remaining / pkg.maxHelp) * 15
  
  // 随机因子
  const random = Math.random() * 5
  
  return Math.round(baseScore + creditWeight * 20 + freshness + urgency + random)
}

// 解析元宝链接
function parseYuanbaoUrl(url) {
  try {
    const pattern = /^https:\/\/yb\.tencent\.com\/fes\/red\/claim/
    const valid = pattern.test(url)
    const match = url.match(/red_packet_id=([^&]+)/)
    const giftId = match ? match[1] : null
    return { valid, giftId }
  } catch (e) {
    return { valid: false, giftId: null }
  }
}

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  const { action } = event

  try {
    switch (action) {
      case 'getList':
        return await getPackageList(event, OPENID)
      case 'getDetail':
        return await getPackageDetail(event, OPENID)
      case 'publish':
        return await publishPackage(event, OPENID)
      case 'getMyPackages':
        return await getMyPackages(event, OPENID)
      case 'cancel':
        return await cancelPackage(event, OPENID)
      case 'adjustHelpCount':
        return await adjustHelpCount(event, OPENID)
      default:
        return { success: false, code: 400, message: '未知操作' }
    }
  } catch (err) {
    console.error('礼包操作失败:', err)
    return {
      success: false,
      code: 500,
      message: err.message || '操作失败'
    }
  }
}

// 获取礼包列表
async function getPackageList(event, openid) {
  const { status = 'active', type, sortBy = 'exposure', page = 1, limit = 20 } = event
  
  let where = { status }
  if (type) where.type = type
  
  let query = db.collection('packages').where(where)
  
  // 排序
  if (sortBy === 'exposure') {
    query = query.orderBy('exposureScore', 'desc')
  } else if (sortBy === 'time') {
    query = query.orderBy('createdAt', 'desc')
  }
  
  const { data } = await query
    .skip((page - 1) * limit)
    .limit(limit)
    .get()
  
  // 获取发布者信息
  const packages = await Promise.all(data.map(async pkg => {
    const userRes = await db.collection('users').where({
      _openid: pkg.creatorOpenid
    }).field({
      nickName: true,
      avatarUrl: true,
      creditScore: true,
      creditLevel: true
    }).get()
    
    return {
      ...pkg,
      publisher: userRes.data[0] || {}
    }
  }))
  
  return { success: true, data: { list: packages } }
}

// 获取礼包详情
async function getPackageDetail(event, openid) {
  const { packageId } = event
  
  const { data } = await db.collection('packages').doc(packageId).get()
  
  if (!data) {
    return { success: false, code: 404, message: '礼包不存在' }
  }
  
  // 获取发布者信息
  const userRes = await db.collection('users').where({
    _openid: data.creatorOpenid
  }).field({
    nickName: true,
    avatarUrl: true,
    creditScore: true,
    creditLevel: true,
    totalStats: true
  }).get()
  
  data.publisher = userRes.data[0] || {}
  
  // 获取帮助者信息
  if (data.helpers && data.helpers.length > 0) {
    const helpers = await Promise.all(data.helpers.map(async h => {
      const helperRes = await db.collection('users').where({
        _openid: h.openid
      }).field({
        nickName: true,
        avatarUrl: true
      }).get()
      
      return {
        ...h,
        nickname: helperRes.data[0]?.nickName || '用户',
        avatarUrl: helperRes.data[0]?.avatarUrl || ''
      }
    }))
    data.helpers = helpers
  }
  
  return { success: true, data }
}

// 发布礼包
async function publishPackage(event, openid) {
  const { type, giftUrl, imageFileId, enableContract = true } = event
  
  // 获取用户信息
  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) {
    return { success: false, code: 401, message: '用户不存在' }
  }
  
  const user = userRes.data[0]
  
  // 检查发布权限
  if (user.creditScore < 20) {
    return { success: false, code: 403, message: '信用分过低，无法发布' }
  }
  
  // 检查每日额度
  if (user.dailyStats.published >= user.dailyStats.quota) {
    return { success: false, code: 403, message: '今日发布额度已用完' }
  }
  
  // 检查互助任务
  if (user.dailyStats.helped < 2) {
    return { success: false, code: 403, message: '请先完成今日互助任务（领取2个礼包）' }
  }
  
  let giftId = null
  let imageUrl = null
  
  // 验证链接
  if (type === 'LINK') {
    const parsed = parseYuanbaoUrl(giftUrl)
    if (!parsed.valid) {
      return { success: false, code: 400, message: '链接格式不正确' }
    }
    
    // 检查重复
    const existsRes = await db.collection('packages').where({
      giftId: parsed.giftId,
      status: _.in(['active', 'pending'])
    }).count()
    
    if (existsRes.total > 0) {
      return { success: false, code: 400, message: '该礼包已存在' }
    }
    
    giftId = parsed.giftId
  } else if (type === 'IMAGE') {
    // 获取图片临时链接
    if (imageFileId) {
      const { tempFileURL } = await cloud.getTempFileURL({
        fileList: [imageFileId]
      })
      imageUrl = tempFileURL[0].tempFileURL
    }
  }
  
  // 计算曝光分数
  const exposureScore = calculateExposureScore(
    { createdAt: new Date(), helpCount: 0, maxHelp: 10 },
    user
  )
  
  // 确定审核状态
  const autoAudit = CREDIT_LEVELS[user.creditLevel]?.autoAudit || false
  const status = autoAudit ? 'active' : 'pending'
  
  // 创建礼包
  const newPackage = {
    creatorOpenid: openid,
    type,
    giftUrl: type === 'LINK' ? giftUrl : null,
    giftId,
    imageFileId: type === 'IMAGE' ? imageFileId : null,
    imageUrl,
    status,
    helpCount: 0,
    maxHelp: 10,
    helpers: [],
    contract: {
      enabled: enableContract
    },
    exposureScore,
    management: {
      helpCountAdjustments: [],
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
  }
  
  const addRes = await db.collection('packages').add({ data: newPackage })
  
  // 更新用户发布统计
  await db.collection('users').doc(user._id).update({
    data: {
      'dailyStats.published': _.inc(1),
      'totalStats.totalPublished': _.inc(1),
      updatedAt: new Date()
    }
  })
  
  return {
    success: true,
    data: {
      packageId: addRes._id,
      status,
      message: autoAudit ? '发布成功' : '已提交审核'
    }
  }
}

// 获取我的分享
async function getMyPackages(event, openid) {
  const { status = 'all', page = 1, limit = 20 } = event
  
  let where = { creatorOpenid: openid }
  if (status !== 'all') {
    where.status = status
  }
  
  const { data } = await db.collection('packages')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * limit)
    .limit(limit)
    .get()
  
  return { success: true, data: { list: data, total: data.length } }
}

// 取消分享
async function cancelPackage(event, openid) {
  const { packageId, reason = '' } = event
  
  const { data } = await db.collection('packages').doc(packageId).get()
  
  if (!data) {
    return { success: false, code: 404, message: '礼包不存在' }
  }
  
  if (data.creatorOpenid !== openid) {
    return { success: false, code: 403, message: '无权操作' }
  }
  
  if (data.status === 'completed') {
    return { success: false, code: 400, message: '已完成的礼包不能取消' }
  }
  
  await db.collection('packages').doc(packageId).update({
    data: {
      status: 'cancelled',
      'management.cancelledAt': new Date(),
      'management.cancelledBy': openid,
      'management.cancelReason': reason,
      updatedAt: new Date()
    }
  })
  
  return { success: true, data: { message: '分享已取消' } }
}

// 更正领取数
async function adjustHelpCount(event, openid) {
  const { packageId, helpCount, reason } = event
  
  const { data } = await db.collection('packages').doc(packageId).get()
  
  if (!data) {
    return { success: false, code: 404, message: '礼包不存在' }
  }
  
  if (data.creatorOpenid !== openid) {
    return { success: false, code: 403, message: '无权操作' }
  }
  
  if (helpCount <= data.helpCount) {
    return { success: false, code: 400, message: '新数量必须大于当前数量' }
  }
  
  if (helpCount > data.maxHelp) {
    return { success: false, code: 400, message: '不能超过最大帮助数' }
  }
  
  // 添加更正记录
  const adjustment = {
    from: data.helpCount,
    to: helpCount,
    reason,
    adjustedAt: new Date(),
    adjustedBy: openid
  }
  
  const newStatus = helpCount >= data.maxHelp ? 'completed' : data.status
  
  await db.collection('packages').doc(packageId).update({
    data: {
      helpCount,
      status: newStatus,
      'management.helpCountAdjustments': _.push([adjustment]),
      updatedAt: new Date()
    }
  })
  
  return {
    success: true,
    data: {
      helpCount,
      remaining: data.maxHelp - helpCount,
      message: `领取数已更正为${helpCount}，剩余${data.maxHelp - helpCount}个名额`
    }
  }
}