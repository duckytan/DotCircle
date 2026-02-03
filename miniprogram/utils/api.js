/**
 * API 请求封装
 */
const API = {
  // 用户相关
  async login(userInfo = {}) {
    return this.call('login', { userInfo })
  },

  async getUserInfo(openid) {
    return this.call('user', { action: 'getInfo', openid })
  },

  async updateSettings(settings) {
    return this.call('user', { action: 'updateSettings', settings })
  },

  // 礼包相关
  async getPackages(params = {}) {
    return this.call('packages', { action: 'getList', ...params })
  },

  async getPackageDetail(packageId) {
    return this.call('packages', { action: 'getDetail', packageId })
  },

  async publishPackage(data) {
    return this.call('packages', { action: 'publish', ...data })
  },

  async helpPackage(packageId) {
    return this.call('help', { action: 'help', packageId })
  },

  async getMyPackages(params = {}) {
    return this.call('packages', { action: 'getMyPackages', ...params })
  },

  async cancelPackage(packageId, reason = '') {
    return this.call('packages', { action: 'cancel', packageId, reason })
  },

  async adjustHelpCount(packageId, helpCount, reason) {
    return this.call('packages', { action: 'adjustHelpCount', packageId, helpCount, reason })
  },

  // 信用相关
  async getCreditHistory(params = {}) {
    return this.call('credit', { action: 'getHistory', ...params })
  },

  async getCreditRules() {
    return this.call('credit', { action: 'getRules' })
  },

  // 排行榜相关
  async getLeaderboard(type = 'helper', period = 'weekly') {
    return this.call('leaderboard', { type, period })
  },

  // 举报相关
  async submitReport(data) {
    return this.call('report', { action: 'submit', ...data })
  },

  // 云函数调用封装
  async call(name, data = {}) {
    try {
      wx.showLoading({ title: '加载中...', mask: true })
      
      const { result } = await wx.cloud.callFunction({
        name,
        data
      })

      wx.hideLoading()

      if (!result.success) {
        throw new Error(result.message || '请求失败')
      }

      return result
    } catch (err) {
      wx.hideLoading()
      console.error(`API ${name} 调用失败:`, err)
      
      wx.showToast({
        title: err.message || '网络错误',
        icon: 'none'
      })

      throw err
    }
  }
}

/**
 * 工具函数
 */
const utils = {
  // 格式化时间
  formatTime(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 格式化相对时间
  formatRelativeTime(date) {
    const now = new Date()
    const d = new Date(date)
    const diff = now - d
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    
    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < 7 * day) {
      return `${Math.floor(diff / day)}天前`
    } else {
      return this.formatTime(date).split(' ')[0]
    }
  },

  // 昵称打码
  maskNickname(nickname) {
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
  },

  // 解析元宝链接
  parseYuanbaoUrl(url) {
    try {
      // 简单验证
      const pattern = /^https:\/\/yb\.tencent\.com\/fes\/red\/claim/
      const valid = pattern.test(url)
      
      // 提取 red_packet_id
      const match = url.match(/red_packet_id=([^&]+)/)
      const giftId = match ? match[1] : null
      
      return { valid, giftId, url }
    } catch (e) {
      return { valid: false, giftId: null, url }
    }
  },

  // 获取信用等级信息
  getCreditLevel(score) {
    if (score >= 90) {
      return { level: 'EXCELLENT', name: '优秀', badge: '🏆', color: '#fbbf24', quota: 3 }
    } else if (score >= 75) {
      return { level: 'GOOD', name: '良好', badge: '⭐', color: '#9ca3af', quota: 2 }
    } else if (score >= 60) {
      return { level: 'NORMAL', name: '一般', badge: '🔹', color: '#3b82f6', quota: 2 }
    } else if (score >= 40) {
      return { level: 'WARNING', name: '警告', badge: '⚠️', color: '#f97316', quota: 1 }
    } else if (score >= 20) {
      return { level: 'RESTRICTED', name: '受限', badge: '🚫', color: '#6b7280', quota: 0 }
    } else {
      return { level: 'BANNED', name: '封禁', badge: '❌', color: '#ef4444', quota: 0 }
    }
  },

  // 防抖函数
  debounce(fn, delay = 300) {
    let timer = null
    return function (...args) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        fn.apply(this, args)
      }, delay)
    }
  },

  // 节流函数
  throttle(fn, interval = 300) {
    let lastTime = 0
    return function (...args) {
      const now = Date.now()
      if (now - lastTime >= interval) {
        lastTime = now
        fn.apply(this, args)
      }
    }
  }
}

module.exports = {
  API,
  utils
}