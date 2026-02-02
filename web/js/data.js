/**
 * 点点圈 Web 版本 - 数据存储层
 * 使用 localStorage 模拟后端数据存储
 */

const Storage = {
  // 获取数据
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(`dotcircle_${key}`)
      return data ? JSON.parse(data) : defaultValue
    } catch (e) {
      return defaultValue
    }
  },

  // 设置数据
  set(key, value) {
    try {
      localStorage.setItem(`dotcircle_${key}`, JSON.stringify(value))
      return true
    } catch (e) {
      return false
    }
  },

  // 删除数据
  remove(key) {
    localStorage.removeItem(`dotcircle_${key}`)
  },

  // 清空所有数据
  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith('dotcircle_'))
      .forEach(key => localStorage.removeItem(key))
  }
}

/**
 * 模拟数据生成器
 */
const MockData = {
  // 生成随机用户
  generateUsers(count = 20) {
    const names = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗']
    const users = []
    
    for (let i = 0; i < count; i++) {
      const name = names[Math.floor(Math.random() * names.length)] + '**'
      const score = Math.floor(Math.random() * 50) + 50 // 50-100
      users.push({
        _openid: `user_${i}`,
        nickName: name,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        creditScore: score,
        creditLevel: this.getCreditLevel(score).level,
        totalHelped: Math.floor(Math.random() * 200)
      })
    }
    return users
  },

  // 生成随机礼包
  generatePackages(users, count = 30) {
    const packages = []
    const now = new Date()
    
    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      const helpCount = Math.floor(Math.random() * 10)
      const createdAt = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000)
      
      packages.push({
        _id: `pkg_${i}`,
        creatorOpenid: user._openid,
        publisher: user,
        type: Math.random() > 0.5 ? 'LINK' : 'IMAGE',
        giftUrl: 'https://yb.tencent.com/fes/red/claim?red_packet_id=xxx',
        imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example',
        status: helpCount >= 10 ? 'completed' : 'active',
        helpCount: helpCount,
        maxHelp: 10,
        helpers: this.generateHelpers(users, helpCount),
        exposureScore: Math.floor(Math.random() * 50) + 50,
        createdAt: createdAt.toISOString()
      })
    }
    
    return packages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  // 生成帮助者
  generateHelpers(users, count) {
    const helpers = []
    const shuffled = [...users].sort(() => Math.random() - 0.5)
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      helpers.push({
        openid: shuffled[i]._openid,
        avatarUrl: shuffled[i].avatarUrl,
        helpedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      })
    }
    return helpers
  },

  // 获取信用等级
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
  }
}

/**
 * 数据管理器
 */
const DataManager = {
  // 初始化数据
  init() {
    if (!Storage.get('initialized')) {
      const users = MockData.generateUsers()
      const packages = MockData.generatePackages(users)
      
      Storage.set('users', users)
      Storage.set('packages', packages)
      Storage.set('initialized', true)
      
      // 初始化当前用户
      this.initCurrentUser()
    }
  },

  // 初始化当前用户
  initCurrentUser() {
    const currentUser = {
      _openid: 'current_user',
      nickName: '我',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
      creditScore: 60,
      creditLevel: 'NORMAL',
      dailyStats: {
        date: new Date().toISOString().split('T')[0],
        helped: 0,
        published: 0,
        quota: 2
      },
      totalStats: {
        totalHelped: 0,
        totalPublished: 0,
        totalReceived: 0,
        streakDays: 1
      }
    }
    Storage.set('currentUser', currentUser)
  },

  // 获取当前用户
  getCurrentUser() {
    return Storage.get('currentUser')
  },

  // 更新当前用户
  updateCurrentUser(data) {
    const user = this.getCurrentUser()
    const updated = { ...user, ...data }
    Storage.set('currentUser', updated)
    return updated
  },

  // 获取所有礼包
  getPackages(filters = {}) {
    let packages = Storage.get('packages', [])
    
    if (filters.status) {
      packages = packages.filter(p => p.status === filters.status)
    }
    
    if (filters.type) {
      packages = packages.filter(p => p.type === filters.type)
    }
    
    if (filters.creatorOpenid) {
      packages = packages.filter(p => p.creatorOpenid === filters.creatorOpenid)
    }
    
    // 分页
    const page = filters.page || 1
    const limit = filters.limit || 20
    const start = (page - 1) * limit
    const paginated = packages.slice(start, start + limit)
    
    return {
      list: paginated,
      total: packages.length,
      hasMore: start + limit < packages.length
    }
  },

  // 获取单个礼包
  getPackage(packageId) {
    const packages = Storage.get('packages', [])
    return packages.find(p => p._id === packageId)
  },

  // 创建礼包
  createPackage(data) {
    const packages = Storage.get('packages', [])
    const currentUser = this.getCurrentUser()
    
    const newPackage = {
      _id: `pkg_${Date.now()}`,
      creatorOpenid: currentUser._openid,
      publisher: currentUser,
      type: data.type,
      giftUrl: data.giftUrl || '',
      imageUrl: data.imageUrl || '',
      status: 'active',
      helpCount: 0,
      maxHelp: 10,
      helpers: [],
      exposureScore: Math.floor(Math.random() * 30) + 50,
      createdAt: new Date().toISOString()
    }
    
    packages.unshift(newPackage)
    Storage.set('packages', packages)
    
    // 更新用户统计
    const stats = currentUser.totalStats
    this.updateCurrentUser({
      'totalStats.totalPublished': stats.totalPublished + 1,
      'dailyStats.published': currentUser.dailyStats.published + 1
    })
    
    return newPackage
  },

  // 帮助礼包
  helpPackage(packageId) {
    const packages = Storage.get('packages', [])
    const currentUser = this.getCurrentUser()
    const pkg = packages.find(p => p._id === packageId)
    
    if (!pkg || pkg.helpCount >= 10) {
      return { success: false, message: '礼包不存在或已满' }
    }
    
    // 检查是否已帮助
    if (pkg.helpers.some(h => h.openid === currentUser._openid)) {
      return { success: false, message: '已经帮助过了' }
    }
    
    // 添加帮助记录
    pkg.helpers.push({
      openid: currentUser._openid,
      avatarUrl: currentUser.avatarUrl,
      helpedAt: new Date().toISOString()
    })
    pkg.helpCount++
    
    if (pkg.helpCount >= 10) {
      pkg.status = 'completed'
    }
    
    Storage.set('packages', packages)
    
    // 更新用户统计
    const stats = currentUser.totalStats
    this.updateCurrentUser({
      'totalStats.totalHelped': stats.totalHelped + 1,
      'dailyStats.helped': currentUser.dailyStats.helped + 1
    })
    
    return { success: true, data: pkg }
  },

  // 取消礼包
  cancelPackage(packageId) {
    const packages = Storage.get('packages', [])
    const pkg = packages.find(p => p._id === packageId)
    
    if (pkg) {
      pkg.status = 'cancelled'
      Storage.set('packages', packages)
      return { success: true }
    }
    
    return { success: false, message: '礼包不存在' }
  },

  // 更正领取数
  adjustHelpCount(packageId, newCount) {
    const packages = Storage.get('packages', [])
    const pkg = packages.find(p => p._id === packageId)
    
    if (pkg && newCount > pkg.helpCount && newCount <= 10) {
      pkg.helpCount = newCount
      if (pkg.helpCount >= 10) {
        pkg.status = 'completed'
      }
      Storage.set('packages', packages)
      return { success: true, data: pkg }
    }
    
    return { success: false, message: '更正失败' }
  }
}

/**
 * 工具函数
 */
const Utils = {
  // 格式化相对时间
  formatRelativeTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
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
      return date.toLocaleDateString('zh-CN')
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
    
    return nickname[0] + '*'.repeat(nickname.length - 2) + nickname[nickname.length - 1]
  },

  // 获取信用等级
  getCreditLevel(score) {
    return MockData.getCreditLevel(score)
  },

  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const result = document.execCommand('copy')
      document.body.removeChild(textarea)
      return result
    }
  },

  // 显示提示
  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.classList.add('show')
    }, 10)
    
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 2000)
  },

  // 显示确认对话框
  showConfirm(title, message) {
    return new Promise((resolve) => {
      const modal = document.createElement('div')
      modal.className = 'modal-overlay'
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">${title}</div>
          <div class="modal-body">${message}</div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove(); window._confirmResult = false;">取消</button>
            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); window._confirmResult = true;">确认</button>
          </div>
        </div>
      `
      document.body.appendChild(modal)
      
      const checkResult = () => {
        if (typeof window._confirmResult !== 'undefined') {
          const result = window._confirmResult
          window._confirmResult = undefined
          resolve(result)
        } else {
          setTimeout(checkResult, 100)
        }
      }
      checkResult()
    })
  },

  // 防抖
  debounce(fn, delay = 300) {
    let timer = null
    return function (...args) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => fn.apply(this, args), delay)
    }
  }
}

// 导出
window.Storage = Storage
window.DataManager = DataManager
window.Utils = Utils
window.MockData = MockData