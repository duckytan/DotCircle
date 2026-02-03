App({
  globalData: {
    userInfo: null,
    userData: null,
    systemConfig: null,
    isLogin: false
  },

  onLaunch() {
    console.log('App Launch')
    
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'dotcircle-env',
        traceUser: true
      })
    }

    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    console.log('App Show')
  },

  onHide() {
    console.log('App Hide')
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'login'
      })
      
      if (result.success) {
        this.globalData.userData = result.data.user
        this.globalData.isLogin = true
        this.globalData.todayTask = result.data.todayTask
        
        // 缓存用户信息
        wx.setStorageSync('userData', result.data.user)
      }
    } catch (err) {
      console.error('登录检查失败:', err)
    }
  },

  // 获取全局数据
  getGlobalData(key) {
    return this.globalData[key]
  },

  // 设置全局数据
  setGlobalData(key, value) {
    this.globalData[key] = value
  }
})