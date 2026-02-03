// pages/my/index.js
const { API, utils } = require('../../utils/api')

Page({
  data: {
    userInfo: {},
    todayTask: {},
    creditInfo: {},
    dailyQuota: 2,
    achievements: [],
    todayDate: ''
  },

  onLoad() {
    this.setTodayDate()
    this.loadUserData()
  },

  onShow() {
    this.loadUserData()
  },

  // 设置今日日期
  setTodayDate() {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setData({ todayDate: dateStr })
  },

  // 加载用户数据
  async loadUserData() {
    try {
      // 检查登录状态
      const app = getApp()
      let userData = app.globalData.userData

      if (!userData) {
        // 尝试登录
        const loginRes = await API.login()
        if (loginRes.success) {
          userData = loginRes.data.user
          app.globalData.userData = userData
          app.globalData.todayTask = loginRes.data.todayTask
        }
      }

      if (userData) {
        const creditInfo = utils.getCreditLevel(userData.creditScore || 60)
        
        // 格式化成就徽章
        const achievements = (userData.achievements || []).map(code => {
          const badgeMap = {
            'NEWBIE': { emoji: '🏅', name: '初来乍到' },
            'HELPER_BRONZE': { emoji: '🥉', name: '互助新手' },
            'HELPER_SILVER': { emoji: '🥈', name: '互助达人' },
            'HELPER_GOLD': { emoji: '🥇', name: '互助之星' },
            'CREDIT_MODEL': { emoji: '💎', name: '信用模范' },
            'STREAK_7': { emoji: '🔥', name: '连续打卡' },
            'REPORTER': { emoji: '🌟', name: '举报先锋' },
            'GROUP_OWNER': { emoji: '👑', name: '群主' }
          }
          return badgeMap[code] || { emoji: '🏅', name: code }
        })

        this.setData({
          userInfo: userData,
          creditInfo,
          dailyQuota: creditInfo.quota,
          achievements,
          todayTask: app.globalData.todayTask || {
            helped: userData.dailyStats?.helped || 0,
            published: userData.dailyStats?.published || 0
          }
        })
      }
    } catch (err) {
      console.error('加载用户数据失败:', err)
    }
  },

  // 跳转我的分享
  goToMyPackages() {
    wx.navigateTo({
      url: '/pages/my/packages/index'
    })
  },

  // 跳转我的帮助
  goToHelpHistory() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转信用记录
  goToCreditHistory() {
    wx.navigateTo({
      url: '/pages/credit/history/index'
    })
  },

  // 跳转排行榜
  goToLeaderboard() {
    wx.navigateTo({
      url: '/pages/leaderboard/index'
    })
  },

  // 跳转规则说明
  goToRules() {
    wx.navigateTo({
      url: '/pages/rules/index'
    })
  }
})