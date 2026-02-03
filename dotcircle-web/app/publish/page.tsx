'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { parseYuanbaoUrl, cn } from '@/lib/utils'
import { 
  CheckCircle2, 
  Circle, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react'

export default function PublishPage() {
  const [publishType, setPublishType] = useState<'link' | 'image'>('link')
  const [giftUrl, setGiftUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [contractEnabled, setContractEnabled] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 模拟用户数据
  const user = {
    dailyStats: {
      helped: 2,
      published: 0,
      quota: 2,
    },
  }

  const canPublish = user.dailyStats.helped >= 2 && user.dailyStats.published < user.dailyStats.quota

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  async function handleSubmit() {
    if (!canPublish) {
      alert('请先完成互助任务或今日额度已用完')
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = ''

      // 如果是图片类型，先上传图片
      if (publishType === 'image' && imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`
        const { data, error } = await supabase.storage
          .from('images')
          .upload(`packages/${fileName}`, imageFile)

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(`packages/${fileName}`)

        imageUrl = urlData.publicUrl
      }

      // 创建礼包
      const { data, error } = await supabase
        .from('packages')
        .insert({
          type: publishType.toUpperCase(),
          gift_url: publishType === 'link' ? giftUrl : null,
          image_url: publishType === 'image' ? imageUrl : null,
          contract_enabled: contractEnabled,
          status: 'active',
          help_count: 0,
          max_help: 10,
        })
        .select()

      if (error) throw error

      alert('发布成功！')
      // 跳转到首页或详情页
      window.location.href = '/'
    } catch (error) {
      console.error('发布失败:', error)
      alert('发布失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLinkValid = publishType === 'link' ? parseYuanbaoUrl(giftUrl).valid : true

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="发布礼包" showBack backHref="/" />

      <div className="p-4 max-w-lg mx-auto">
        {/* 任务检查卡片 */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">📊 今日任务</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              canPublish ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
            }`}>
              {canPublish ? '已完成' : '进行中'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">互助任务（先领2个）</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[0, 1].map((i) => (
                    <div key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-xs">
                      {user.dailyStats.helped > i ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  ))}
                </div>
                <span className={`text-sm font-semibold ${user.dailyStats.helped >= 2 ? 'text-green-600' : ''}`}>
                  {user.dailyStats.helped}/2 {user.dailyStats.helped >= 2 ? '✓' : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">发布额度</span>
              <span className="text-sm font-semibold">
                {user.dailyStats.published}/{user.dailyStats.quota}
              </span>
            </div>
          </div>

          {canPublish && (
            <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium text-center">
              ✅ 任务完成！可以发布礼包了
            </div>
          )}
        </Card>

        {/* 类型切换 */}
        <div className="flex gap-3 mb-4">
          <Button
            variant={publishType === 'link' ? 'default' : 'outline'}
            className={cn(
              'flex-1 py-6',
              publishType === 'link' && 'gradient-primary text-white'
            )}
            onClick={() => setPublishType('link')}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            粘贴链接
          </Button>
          <Button
            variant={publishType === 'image' ? 'default' : 'outline'}
            className={cn(
              'flex-1 py-6',
              publishType === 'image' && 'gradient-primary text-white'
            )}
            onClick={() => setPublishType('image')}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            上传图片
          </Button>
        </div>

        {/* 链接输入 */}
        {publishType === 'link' && (
          <Card className="p-4 mb-4">
            <label className="block text-sm font-medium mb-2">元宝抽奖链接</label>
            <textarea
              value={giftUrl}
              onChange={(e) => setGiftUrl(e.target.value)}
              placeholder="粘贴你的元宝抽奖链接..."
              className="w-full h-24 p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-orange-500 focus:outline-none resize-none"
            />
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <span>ℹ️</span>
              <span>支持 https://yb.tencent.com/... 格式的链接</span>
            </div>
            {giftUrl && !isLinkValid && (
              <div className="mt-2 text-xs text-red-500">
                请输入有效的元宝链接
              </div>
            )}
          </Card>
        )}

        {/* 图片上传 */}
        {publishType === 'image' && (
          <Card className="p-4 mb-4">
            <label className="block text-sm font-medium mb-2">二维码图片</label>
            
            {!imagePreview ? (
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <span className="text-sm text-gray-500">点击上传二维码图片</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="预览"
                  className="w-full max-h-48 object-contain rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </Card>
        )}

        {/* 契约选项 */}
        <Card 
          className="p-4 mb-4 cursor-pointer"
          onClick={() => setContractEnabled(!contractEnabled)}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
              contractEnabled 
                ? 'bg-orange-500 border-orange-500' 
                : 'border-gray-300'
            )}>
              {contractEnabled && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">开启互助契约</p>
              <p className="text-xs text-gray-500 mt-1">
                领取者需在24小时内发布自己的礼包，成功履约+2信用分，违约-5信用分
              </p>
            </div>
          </div>
        </Card>

        {/* 发布按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={!canPublish || isSubmitting || (publishType === 'link' ? !isLinkValid : !imageFile)}
          className="w-full py-6 gradient-primary text-white font-semibold text-lg"
        >
          {isSubmitting ? '发布中...' : 
           !canPublish ? (user.dailyStats.published >= user.dailyStats.quota ? '今日额度已用完' : '请先完成互助任务') :
           '确认发布'}
        </Button>

        <p className="text-center text-xs text-gray-400 mt-4">
          发布后需审核通过方可展示
        </p>
      </div>
    </div>
  )
}