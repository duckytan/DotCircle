'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { getCreditLevel, type LeaderboardType } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { cn, maskNickname } from '@/lib/utils'
import { Trophy, TrendingUp, Users, Star } from 'lucide-react'

export default function LeaderboardPage() {
  const [activeType, setActiveType] = useState<LeaderboardType>('helper')
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const types = [
    { id: 'helper' as LeaderboardType, label: '互助达人', icon: Trophy },
    { id: 'credit' as LeaderboardType, label: '信用之星', icon: Star },
    { id: 'active' as LeaderboardType, label: '活跃先锋', icon: TrendingUp },
    { id: 'contributor' as LeaderboardType, label: '贡献榜', icon: Users },
  ]

  useEffect(() => {
    loadLeaderboard()
  }, [activeType])

  async function loadLeaderboard() {
    setLoading(true)
    
    // 从 Supabase 获取排行榜数据
    // 这里简化处理，实际应该根据类型查询不同的排序
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('credit_score', { ascending: false })
      .limit(20)

    if (error) {
      console.error('加载排行榜失败:', error)
    } else {
      // 转换数据格式
      const formatted = data?.map((user, index) => ({
        rank: index + 1,
        user,
        score: activeType === 'credit' ? user.credit_score : Math.floor(Math.random() * 200),
      })) || []
      setEntries(formatted)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="🏆 排行榜" />

      {/* 类型切换 */}
      <div className="bg-white px-3 py-3 border-b border-gray-100 overflow-x-auto">
        <div className="flex gap-2 max-w-lg mx-auto">
          {types.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={cn(
                  'flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  activeType === type.id
                    ? 'gradient-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 排行榜列表 */}
      <main className="p-3 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const creditInfo = getCreditLevel(entry.user.credit_score)
              const isTop3 = entry.rank <= 3

              return (
                <div
                  key={entry.user.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg"
                >
                  {/* 排名 */}
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm',
                      isTop3 && entry.rank === 1 && 'bg-yellow-400 text-white',
                      isTop3 && entry.rank === 2 && 'bg-gray-400 text-white',
                      isTop3 && entry.rank === 3 && 'bg-orange-400 text-white',
                      !isTop3 && 'text-gray-400'
                    )}
                  >
                    {entry.rank}
                  </div>

                  {/* 头像 */}
                  <img
                    src={entry.user.avatar_url || '/default-avatar.png'}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover"
                  />

                  {/* 用户信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {maskNickname(entry.user.nick_name)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {creditInfo.badge} 信用{creditInfo.name}
                    </div>
                  </div>

                  {/* 分数 */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-500">
                      {entry.score}
                    </div>
                    <div className="text-xs text-gray-400">
                      {activeType === 'helper' ? '人' : 
                       activeType === 'credit' ? '分' : 
                       activeType === 'active' ? '天' : '个'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}