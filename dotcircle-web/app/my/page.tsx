'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCreditLevel } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { 
  Package, 
  FileText, 
  TrendingUp, 
  Users, 
  Settings, 
  BookOpen,
  ChevronRight,
  Loader2
} from 'lucide-react'

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      // 获取当前登录用户
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        // 未登录，显示默认数据
        setUser({
          nickName: '游客',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
          creditScore: 60,
          dailyStats: { helped: 0, published: 0, quota: 2 },
          totalStats: { totalHelped: 0, totalPublished: 0, streakDays: 0 },
          isGuest: true,
        })
        setLoading(false)
        return
      }

      // 获取用户资料
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('获取用户资料失败:', error)
      } else if (data) {
        setUser({
          ...data,
          nickName: data.nick_name,
          avatarUrl: data.avatar_url,
          creditScore: data.credit_score,
          dailyStats: {
            helped: data.daily_helped,
            published: data.daily_published,
            quota: data.daily_quota,
          },
          totalStats: {
            totalHelped: data.total_helped,
            totalPublished: data.total_published,
            streakDays: data.streak_days,
          },
        })
      }
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  const creditInfo = getCreditLevel(user?.creditScore || 60)

  const menuItems = [
    { icon: Package, label: '我的分享', href: '/packages', color: 'bg-orange-100 text-orange-600' },
    { icon: FileText, label: '我的帮助', href: '/helps', color: 'bg-blue-100 text-blue-600' },
    { icon: TrendingUp, label: '信用记录', href: '/credit', color: 'bg-green-100 text-green-600' },
    { icon: Users, label: '排行榜', href: '/leaderboard', color: 'bg-purple-100 text-purple-600' },
    { icon: BookOpen, label: '规则说明', href: '/rules', color: 'bg-gray-100 text-gray-600' },
    { icon: Settings, label: '设置', href: '/settings', color: 'bg-gray-100 text-gray-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="我的" showSettings />

      {/* 用户信息卡片 */}
      <div className="gradient-primary text-white p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-orange-500 overflow-hidden">
            <img src={user?.avatarUrl} alt="" className="w-full h-full" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-semibold">{user?.nickName || '用户'}</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {creditInfo.badge} {creditInfo.name}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{user?.creditScore || 60}</span>
              <span className="text-sm opacity-80">信用分</span>
            </div>
          </div>
        </div>

        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold">{user?.totalStats?.totalHelped || 0}</div>
            <div className="text-xs opacity-80">累计帮助</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user?.totalStats?.totalPublished || 0}</div>
            <div className="text-xs opacity-80">累计发布</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user?.totalStats?.streakDays || 0}</div>
            <div className="text-xs opacity-80">连续登录</div>
          </div>
        </div>
      </div>

      {/* 今日任务 */}
      <Card className="mx-4 mt-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">📊 今日任务</h3>
          <span className="text-xs text-gray-400">
            {new Date().toISOString().split('T')[0]}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                (user?.dailyStats?.helped || 0) >= 2 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {(user?.dailyStats?.helped || 0) >= 2 ? '✓' : '⏳'}
              </div>
              <span className="text-sm">互助任务</span>
            </div>
            <span className={`text-sm font-semibold ${(user?.dailyStats?.helped || 0) >= 2 ? 'text-green-600' : ''}`}>
              {user?.dailyStats?.helped || 0}/2 {(user?.dailyStats?.helped || 0) >= 2 ? '✓' : ''}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center">
                📦
              </div>
              <span className="text-sm">发布额度</span>
            </div>
            <span className="text-sm font-semibold">
              {user?.dailyStats?.published || 0}/{user?.dailyStats?.quota || 2}
            </span>
          </div>
        </div>
      </Card>

      {/* 徽章展示 */}
      <Card className="mx-4 mt-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">🏅 我的徽章</h3>
          <span className="text-xs text-gray-400">2个</span>
        </div>
        <div className="flex gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-2xl shadow-md">
            🏅
          </div>
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-2xl shadow-md">
            🔥
          </div>
        </div>
      </Card>

      {/* 功能菜单 */}
      <Card className="mx-4 mt-4 overflow-hidden">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-gray-900">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          )
        })}
      </Card>

      {/* 游客登录提示 */}
      {user?.isGuest && (
        <div className="mx-4 mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700 mb-3">
            登录后可获得完整功能和数据同步
          </p>
          <div className="flex gap-2">
            <Link href="/login" className="flex-1">
              <Button className="w-full gradient-primary text-white">
                登录
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button variant="outline" className="w-full">
                注册
              </Button>
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}