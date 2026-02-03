// pages/publish/index.js
const { API, utils } = require('../../utils/api')

Page({
  data: {
    publishType: 'link',
    giftUrl: '',
    linkValid: false,
    imageUrl: '',
    imageFileId: '',
    enableContract: true,
    todayHelped: 0,
    todayPublished: 0,
    dailyQuota: 2,
    canPublish: false,
    canSubmit: false,
    submitting: false
  },

  onLoad() {
    this.checkUserStatus()
  },

  onShow() {
    this.checkUserStatus()
  },

  // 检查用户状态
  async checkUserStatus() {
    try {
      const app = getApp()
      const userData = app.globalData.userData

      if (!userData) {
        // 未登录，尝试登录
        const res = await API.login()
        if (res.success) {
          app.globalData.userData = res.data.user
          this.updateStatus(res.data.user, res.data.todayTask)
        }
      } else {
        // 已登录，获取今日任务
        const res = await API.getUserInfo()
        if (res.success) {
          this.updateStatus(res.data.user, res.data.todayTask)
        }
      }
    } catch (err) {
      console.error('检查用户状态失败:', err)
    }
  },

  // 更新状态显示
  updateStatus(user, todayTask) {
    const todayHelped = todayTask?.helped || 0
    const todayPublished = todayTask?.published || 0
    const dailyQuota = user?.dailyStats?.quota || 2
    const canPublish = todayHelped >= 2 && todayPublished < dailyQuota

    this.setData({
      todayHelped,
      todayPublished,
      dailyQuota,
      canPublish,
      canSubmit: canPublish && (this.data.linkValid || this.data.imageUrl)
    })
  },

  // 切换发布类型
  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      publishType: type,
      canSubmit: this.data.canPublish && (
        (type === 'link' && this.data.linkValid) ||
        (type === 'image' && this.data.imageUrl)
      )
    })
  },

  // 链接输入验证
  onLinkInput(e) {
    const url = e.detail.value
    const { valid } = utils.parseYuanbaoUrl(url)

    this.setData({
      giftUrl: url,
      linkValid: valid,
      canSubmit: this.data.canPublish && valid
    })
  },

  // 选择图片
  async chooseImage() {
    try {
      const { tempFiles } = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      })

      if (tempFiles && tempFiles.length > 0) {
        const tempFilePath = tempFiles[0].tempFilePath

        // 上传到云存储
        wx.showLoading({ title: '上传中...' })

        const { fileID } = await wx.cloud.uploadFile({
          cloudPath: `packages/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
          filePath: tempFilePath
        })

        wx.hideLoading()

        // 获取临时访问链接
        const { tempFileURL } = await wx.cloud.getTempFileURL({
          fileList: [fileID]
        })

        this.setData({
          imageUrl: tempFileURL[0].tempFileURL,
          imageFileId: fileID,
          canSubmit: this.data.canPublish
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('上传图片失败:', err)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    }
  },

  // 移除图片
  removeImage(e) {
    e.stopPropagation()
    this.setData({
      imageUrl: '',
      imageFileId: '',
      canSubmit: false
    })
  },

  // 切换契约
  toggleContract() {
    this.setData({
      enableContract: !this.data.enableContract
    })
  },

  // 提交发布
  async submitPublish() {
    if (!this.data.canSubmit || this.data.submitting) return

    this.setData({ submitting: true })

    try {
      const params = {
        type: this.data.publishType.toUpperCase(),
        enableContract: this.data.enableContract
      }

      if (this.data.publishType === 'link') {
        params.giftUrl = this.data.giftUrl
      } else {
        params.imageFileId = this.data.imageFileId
      }

      const res = await API.publishPackage(params)

      if (res.success) {
        wx.showToast({
          title: res.data.status === 'active' ? '发布成功' : '提交审核成功',
          icon: 'success'
        })

        // 重置表单
        this.setData({
          giftUrl: '',
          linkValid: false,
          imageUrl: '',
          imageFileId: '',
          submitting: false
        })

        // 返回首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      }
    } catch (err) {
      this.setData({ submitting: false })
      console.error('发布失败:', err)
    }
  }
})