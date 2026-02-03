// 帮助操作云函数 - 修复事务API兼容性
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  const { action, packageId } = event

  if (action === 'help') {
    return await helpPackage(packageId, OPENID)
  }

  return { success: false, code: 400, message: '未知操作' }
}

async function helpPackage(packageId, helperOpenid) {
  try {
    // 使用云开发的 runTransaction API
    const result = await db.runTransaction(async transaction => {
      // 1. 获取礼包信息（在事务中）
      const pkgRes = await transaction.collection('packages').doc(packageId).get()
      
      if (!pkgRes.data) {
        throw { code: 404, message: '礼包不存在' }
      }

      const pkg = pkgRes.data

      // 2. 检查状态
      if (pkg.status !== 'active') {
        throw { code: 400, message: '礼包不可领取' }
      }

      // 3. 检查是否已满
      if (pkg.helpCount >= pkg.maxHelp) {
        throw { code: 400, message: '礼包已领满' }
      }

      // 4. 检查是否已帮助过
      if (pkg.helpers && pkg.helpers.some(h => h.openid === helperOpenid)) {
        throw { code: 400, message: '已领取过该礼包' }
      }

      // 5. 检查是否是自己的礼包
      if (pkg.creatorOpenid === helperOpenid) {
        throw { code: 400, message: '不能领取自己的礼包' }
      }

      // 6. 获取帮助者信息（不在事务中，先查询）
      const helperRes = await db.collection('users').where({ _openid: helperOpenid }).get()
      if (helperRes.data.length === 0) {
        throw { code: 401, message: '用户不存在' }
      }
      const helper = helperRes.data[0]

      // 7. 更新礼包（事务操作）
      const newHelpCount = pkg.helpCount + 1
      const newStatus = newHelpCount >= pkg.maxHelp ? 'completed' : pkg.status
      
      await transaction.collection('packages').doc(packageId).update({
        data: {
          helpCount: _.inc(1),
          helpers: _.push([{
            openid: helperOpenid,
            helpedAt: db.serverDate()
          }]),
          status: newStatus,
          updatedAt: db.serverDate()
        }
      })

      // 8. 创建帮助记录（事务操作）
      await transaction.collection('helpRecords').add({
        data: {
          packageId,
          creatorOpenid: pkg.creatorOpenid,
          helperOpenid,
          contract: {
            enabled: pkg.contract?.enabled || false,
            fulfilled: false,
            fulfilledAt: null
          },
          helpedAt: db.serverDate()
        }
      })

      // 9. 更新帮助者统计（事务操作）
      const today = getTodayString()
      const dailyHelped = (helper.dailyStats?.helped || 0) + 1
      
      // 注意：云开发事务不支持复杂的对象更新，需要分步操作
      // 先读取再更新
      await transaction.collection('users').doc(helper._id).update({
        data: {
          'dailyStats.helped': _.inc(1),
          'totalStats.totalHelped': _.inc(1),
          updatedAt: db.serverDate()
        }
      })

      // 10. 增加信用分（每日最多2分）- 事务外操作
      let creditAdded = false
      if (dailyHelped <= 2) {
        await transaction.collection('users').doc(helper._id).update({
          data: {
            creditScore: _.inc(1),
            updatedAt: db.serverDate()
          }
        })
        creditAdded = true
      }

      // 返回操作结果
      return {
        success: true,
        giftUrl: pkg.giftUrl,
        creditAdded,
        newHelpCount,
        newStatus
      }
    })

    // 如果事务成功，记录信用历史（在事务外）
    if (result.creditAdded) {
      try {
        const helperRes = await db.collection('users').where({ _openid: helperOpenid }).get()
        if (helperRes.data.length > 0) {
          const helper = helperRes.data[0]
          const newCreditScore = helper.creditScore
          
          await db.collection('creditHistory').add({
            data: {
              _openid: helperOpenid,
              type: 'ADD',
              reason: '每日互助奖励',
              reasonCode: 'DAILY_HELP',
              amount: 1,
              balanceBefore: newCreditScore - 1,
              balanceAfter: newCreditScore,
              relatedType: 'help',
              relatedId: packageId,
              operator: 'system',
              timestamp: db.serverDate()
            }
          })
        }
      } catch (err) {
        // 信用历史记录失败不影响主流程
        console.error('记录信用历史失败:', err)
      }
    }

    return {
      success: true,
      data: {
        giftUrl: result.giftUrl,
        message: '领取成功'
      }
    }

  } catch (err) {
    console.error('帮助失败:', err)
    
    // 处理事务中的自定义错误
    if (err.code && err.message) {
      return { 
        success: false, 
        code: err.code, 
        message: err.message 
      }
    }
    
    return { 
      success: false, 
      code: 500, 
      message: err.message || '操作失败' 
    }
  }
}

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}