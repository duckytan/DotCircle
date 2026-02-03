// pages/my/packages/index.js
const { API, utils } = require('../../../utils/api')

Page({
  data: {
    packages: [],
    currentTab: 'all',
    page: 1,
    limit: 20,
    hasMore: true,
    loading: false,
    
    // 弹窗相关
    showAdjustModal: false,
    adjustPackageId: '',
    adjustCurrent: 0,
    adjustValue: '',
    adjustReason: ''
  },

  onLoad() {
    this.loadPackages()
  },

  onShow() {
    this.loadPackages()
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

  // 加载分享列表
  async loadPackages() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const params = {
        status: this.data.currentTab === 'all' ? 'all' : this.data.currentTab,
        page: this.data.page,
        limit: this.data.limit
      }

      const res = await API.getMyPackages(params)

      if (res.success) {
        const packages = res.data.list.map(pkg => ({
          ...pkg,
          createdAt: utils.formatTime(pkg.createdAt),
          updatedAt: pkg.updatedAt ? utils.formatTime(pkg.updatedAt) : ''
        }))

        this.setData({
          packages: this.data.page === 1 ? packages : [...this.data.packages, ...packages],
          hasMore: packages.length === this.data.limit,
          loading: false
        })
      }
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载分享列表失败:', err)
    }
  },

  // 加载更多
  loadMore() {
    this.setData({ page: this.data.page + 1 })
    this.loadPackages()
  },

  // 跳转详情
  goToDetail(e) {
    const packageId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/package/detail/index?id=${packageId}`
    })
  },

  // 取消分享
  async cancelPackage(e) {
    const packageId = e.currentTarget.dataset.id

    const { confirm } = await wx.showModal({
      title: '确认取消分享？',
      content: '取消后该礼包将不再展示，其他人无法继续领取',
      confirmText: '确认取消',
      cancelText: '暂不',
      confirmColor: '#ef4444'
    })

    if (confirm) {
      try {
        wx.showLoading({ title: '处理中...' })
        const res = await API.cancelPackage(packageId, '用户主动取消')
        wx.hideLoading()

        if (res.success) {
          wx.showToast({
            title: '已取消分享',
            icon: 'success'
          })
          this.loadPackages()
        }
      } catch (err) {
        wx.hideLoading()
        console.error('取消分享失败:', err)
      }
    }
  },

  // 显示更正弹窗
  showAdjustModal(e) {
    const { id, current } = e.currentTarget.dataset
    this.setData({
      showAdjustModal: true,
      adjustPackageId: id,
      adjustCurrent: parseInt(current),
      adjustValue: '',
      adjustReason: ''
    })
  },

  // 关闭弹窗
  closeAdjustModal() {
    this.setData({
      showAdjustModal: false,
      adjustPackageId: '',
      adjustValue: '',
      adjustReason: ''
    })
  },

  // 阻止冒泡
  stopPropagation() {
    // 什么都不做，只是阻止冒泡
  },

  // 输入更正数量
  onAdjustInput(e) {
    this.setData({ adjustValue: e.detail.value })
  },

  // 输入更正原因
  onReasonInput(e) {
    this.setData({ adjustReason: e.detail.value })
  },

  // 确认更正
  async confirmAdjust() {
    const { adjustPackageId, adjustCurrent, adjustValue, adjustReason } = this.data
    
    const newCount = parseInt(adjustValue)
    
    // 校验
    if (!newCount || isNaN(newCount)) {
      wx.showToast({ title: '请输入有效数字', icon: 'none' })
      return
    }
    
    if (newCount <= adjustCurrent) {
      wx.showToast({ title: '新数量必须大于当前数量', icon: 'none' })
      return
    }
    
    if (newCount > 10) {
      wx.showToast({ title: '不能超过10人', icon: 'none' })
      return
    }
    
    if (!adjustReason.trim()) {
      wx.showToast({ title: '请输入更正说明', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '处理中...' })
      const res = await API.adjustHelpCount(adjustPackageId, newCount, adjustReason)
      wx.hideLoading()

      if (res.success) {
        wx.showToast({
          title: '更正成功',
          icon: 'success'
        })
        this.closeAdjustModal()
        this.loadPackages()
      }
    } catch (err) {
      wx.hideLoading()
      console.error('更正失败:', err)
    }
  },

  // 计算剩余名额提示
  get adjustHint() {
    const { adjustValue } = this.data
    const value = parseInt(adjustValue) || 0
    return Math.max(0, 10 - value)
  }
})