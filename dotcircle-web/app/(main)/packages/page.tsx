'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { formatRelativeTime, maskNickname } from '@/lib/utils'
import { 
  ArrowLeft,
  Loader2,
  Package,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MyPackagesPage() {
  const router = useRouter()
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadPackages()
  }, [activeTab])

  async function loadPackages() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('packages')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab)
      }

      const { data, error } = await query

      if (error) throw error

      setPackages(data || [])
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(packageId: string) {
    if (!confirm('确定要取消分享吗？')) return

    const { error } = await supabase
      .from('packages')
      .update({ status: 'cancelled' })
      .eq('id', packageId)

    if (error) {
      alert('取消失败: ' + error.message)
    } else {
      loadPackages()
    }
  }

  async function handleAdjustCount(packageId: string, currentCount: number) {
    const newCount = prompt(`当前显示 ${currentCount} 人，请输入实际领取人数：`, String(currentCount))
    if (!newCount) return

    const count = parseInt(newCount)
    if (isNaN(count) || count < currentCount || count > 10) {
      alert('请输入有效的数字（不能减少，最多10）')
      return
    }

    const { error } = await supabase
      .from('packages')
      .update({ 
        help_count: count,
        status: count >= 10 ? 'completed' : 'active'
      })
      .eq('id', packageId)

    if (error) {
      alert('更正失败: ' + error.message)
    } else {
      loadPackages()
    }
  }

  const tabs = [
    { id: 'all', label: '全部' },
    { id: 'active', label: '进行中' },
    { id: 'completed', label: '已完成' },
    { id: 'cancelled', label: '已取消' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="gradient-primary text-white">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Link href="/my" className="p-2 -ml-2 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold ml-2">我的分享</h1>
        </div>
      </header>

      {/* 标签筛选 */}
      <div className="bg-white px-3 py-3 border-b border-gray-100 sticky top-14 z-40">
        <div className="flex gap-2 max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'gradient-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto pb-20">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-gray-500">暂无分享</p>
            <Link href="/publish" className="text-orange-500 font-semibold mt-2 inline-block">
              去发布礼包 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => {
              const progressPercent = (pkg.help_count / pkg.max_help) * 100
              const isCompleted = pkg.status === 'completed'
              const isCancelled = pkg.status === 'cancelled'
              const isActive = pkg.status === 'active'

              return (
                <Card key={pkg.id} className={cn('p-4', isCancelled && 'opacity-60')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pkg.type === 'LINK' ? '🎁' : '📱'}</span>
                      <span className="font-semibold">
                        {pkg.type === 'LINK' ? '元宝抽奖' : '二维码'}
                      </span>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        isActive && 'bg-blue-100 text-blue-700',
                        isCompleted && 'bg-green-100 text-green-700',
                        isCancelled && 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {isActive && '进行中'}
                      {isCompleted && '已完成'}
                      {isCancelled && '已取消'}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">领取进度</span>
                      <span className={cn(
                        'font-bold',
                        isCompleted ? 'text-green-600' : 'text-orange-500'
                      )}>
                        {pkg.help_count}/{pkg.max_help}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all',
                          isCompleted ? 'bg-green-500' : 'gradient-primary'
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-orange-600 border-orange-200"
                        onClick={() => handleAdjustCount(pkg.id, pkg.help_count)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        更正领取数
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-gray-600"
                        onClick={() => handleCancel(pkg.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        取消分享
                      </Button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center">
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      已领满！感谢大家的帮助
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    发布于 {formatRelativeTime(pkg.created_at)}
                  </p>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}