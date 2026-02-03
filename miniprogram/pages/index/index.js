// pages/index/index.js
const { API, utils } = require('../../utils/api')

Page({
  data: {
    packages: [],
    currentTab: 'all',
    page: 1,
    limit: 20,
    hasMore: true,
    loading: false,
    searchKeyword: ''
  },

  onLoad() {
    this.loadPackages()
  },

  onShow() {
    // 每次显示页面时刷新
    if (this.data.packages.length === 0) {
      this.loadPackages()
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, packages: [] })
    this.loadPackages().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      currentTab: tab,
      page: 1,
      packages: [],
      hasMore: true
    })
    this.loadPackages()
  },

  // 搜索输入
  onSearchInput: utils.debounce(function(e) {
    const keyword = e.detail.value
    this.setData({
      searchKeyword: keyword,
      page: 1,
      packages: []
    })
    this.loadPackages()
  }, 500),

  // 加载礼包列表
  async loadPackages() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const params = {
        status: 'active',
        page: this.data.page,
        limit: this.data.limit,
        sortBy: 'exposure'
      }

      if (this.data.currentTab !== 'all') {
        params.type = this.data.currentTab.toUpperCase()
      }

      if (this.data.searchKeyword) {
        params.keyword = this.data.searchKeyword
      }

      const res = await API.getPackages(params)
      
      if (res.success) {
        const packages = res.data.list.map(pkg => this.formatPackage(pkg))
        
        this.setData({
          packages: this.data.page === 1 ? packages : [...this.data.packages, ...packages],
          hasMore: packages.length === this.data.limit,
          loading: false
        })
      }
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载礼包失败:', err)
    }
  },

  // 格式化礼包数据
  formatPackage(pkg) {
    const progressPercent = (pkg.helpCount / pkg.maxHelp) * 100
    const remaining = pkg.maxHelp - pkg.helpCount
    
    return {
      ...pkg,
      progressPercent,
      remaining,
      publishTime: utils.formatRelativeTime(pkg.createdAt),
      canHelp: !pkg.helpers?.some(h => h.openid === getApp().globalData.userData?._openid),
      recentHelpers: (pkg.helpers || []).slice(0, 3),
      publisher: {
        ...pkg.publisher,
        nickname: utils.maskNickname(pkg.publisher?.nickName || '用户'),
        creditLevel: pkg.publisher?.creditLevel || 'NORMAL',
        creditBadge: utils.getCreditLevel(pkg.publisher?.creditScore || 60).badge
      }
    }
  },

  // 加载更多
  loadMore() {
    this.setData({ page: this.data.page + 1 })
    this.loadPackages()
  },

  // 去详情页
  goToDetail(e) {
    const packageId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/package/detail/index?id=${packageId}`
    })
  },

  // 帮助礼包
  async onHelpPackage(e) {
    const packageId = e.currentTarget.dataset.id
    
    try {
      const res = await API.helpPackage(packageId)
      
      if (res.success) {
        wx.showToast({
          title: '领取成功',
          icon: 'success'
        })

        // 更新列表状态
        const packages = this.data.packages.map(pkg => {
          if (pkg._id === packageId) {
            return {
              ...pkg,
              helpCount: pkg.helpCount + 1,
              remaining: pkg.remaining - 1,
              progressPercent: ((pkg.helpCount + 1) / pkg.maxHelp) * 100,
              canHelp: false
            }
          }
          return pkg
        })

        this.setData({ packages })

        // 跳转领取
        if (res.data.giftUrl) {
          setTimeout(() => {
            wx.navigateTo({
              url: `/pages/package/detail/index?id=${packageId}&action=help`
            })
          }, 1000)
        }
      }
    } catch (err) {
      console.error('帮助失败:', err)
    }
  },

  // 去发布页
  goToPublish() {
    wx.navigateTo({
      url: '/pages/publish/index'
    })
  }
})