// pages/package/detail/index.js
const { API, utils } = require('../../../utils/api')

Page({
  data: {
    package: {},
    isCreator: false,
    canHelp: false,
    hasHelped: false,
    helping: false,
    progressPercent: 0,
    remaining: 0,
    creditInfo: {}
  },

  onLoad(options) {
    const packageId = options.id
    if (packageId) {
      this.loadPackageDetail(packageId)
    }

    // 如果是从帮助跳转来的
    if (options.action === 'help' && packageId) {
      setTimeout(() => {
        this.openGiftLink()
      }, 500)
    }
  },

  // 加载礼包详情
  async loadPackageDetail(packageId) {
    try {
      wx.showLoading({ title: '加载中...' })

      const res = await API.getPackageDetail(packageId)

      if (res.success) {
        const pkg = res.data
        const app = getApp()
        const userOpenid = app.globalData.userData?._openid

        // 计算进度
        const progressPercent = (pkg.helpCount / pkg.maxHelp) * 100
        const remaining = pkg.maxHelp - pkg.helpCount

        // 检查是否是发布者
        const isCreator = pkg.creatorOpenid === userOpenid

        // 检查是否已帮助
        const hasHelped = pkg.helpers?.some(h => h.openid === userOpenid)

        // 获取信用等级信息
        const creditInfo = utils.getCreditLevel(pkg.publisher?.creditScore || 60)

        // 处理帮助者列表
        const helpers = (pkg.helpers || []).map(h => ({
          ...h,
          nickname: utils.maskNickname(h.nickname || '用户')
        }))

        this.setData({
          package: { ...pkg, helpers },
          isCreator,
          canHelp: !isCreator && !hasHelped && pkg.status === 'active' && remaining > 0,
          hasHelped,
          progressPercent,
          remaining,
          creditInfo
        })
      }

      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      console.error('加载礼包详情失败:', err)
    }
  },

  // 帮助礼包
  async helpPackage() {
    if (!this.data.canHelp || this.data.helping) return

    this.setData({ helping: true })

    try {
      const res = await API.helpPackage(this.data.package._id)

      if (res.success) {
        wx.showToast({
          title: '领取成功',
          icon: 'success'
        })

        // 更新状态
        this.setData({
          canHelp: false,
          hasHelped: true,
          helping: false,
          'package.helpCount': this.data.package.helpCount + 1,
          progressPercent: ((this.data.package.helpCount + 1) / this.data.package.maxHelp) * 100,
          remaining: this.data.remaining - 1
        })

        // 打开链接
        setTimeout(() => {
          this.openGiftLink()
        }, 1000)
      }
    } catch (err) {
      this.setData({ helping: false })
      console.error('帮助失败:', err)
    }
  },

  // 打开礼包链接
  openGiftLink() {
    const { package } = this.data

    if (package.type === 'LINK' && package.giftUrl) {
      // 复制链接
      wx.setClipboardData({
        data: package.giftUrl,
        success: () => {
          wx.showModal({
            title: '领取礼包',
            content: '链接已复制到剪贴板，请打开浏览器粘贴访问',
            showCancel: false
          })
        }
      })
    }
  },

  // 预览图片
  previewImage() {
    if (this.data.package.imageUrl) {
      wx.previewImage({
        urls: [this.data.package.imageUrl]
      })
    }
  },

  // 取消分享
  async cancelPackage() {
    const { package } = this.data

    const { confirm } = await wx.showModal({
      title: '确认取消分享？',
      content: '取消后该礼包将不再展示，其他人无法继续领取',
      confirmText: '确认取消',
      cancelText: '暂不'
    })

    if (confirm) {
      try {
        const res = await API.cancelPackage(package._id)

        if (res.success) {
          wx.showToast({
            title: '已取消分享',
            icon: 'success'
          })

          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      } catch (err) {
        console.error('取消分享失败:', err)
      }
    }
  },

  // 分享
  sharePackage() {
    // 触发分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 昵称打码
  maskNickname(nickname) {
    return utils.maskNickname(nickname)
  },

  onShareAppMessage() {
    const { package } = this.data
    return {
      title: `快来帮我领取元宝礼包！还差${this.data.remaining}人`,
      path: `/pages/package/detail/index?id=${package._id}`,
      imageUrl: '/assets/share-image.png'
    }
  }
})