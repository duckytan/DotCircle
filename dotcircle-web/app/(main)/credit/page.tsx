'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { formatRelativeTime, cn } from '@/lib/utils'
import { getCreditLevel } from '@/types'
import { TrendingUp, TrendingDown, ArrowLeft, Loader2 } from 'lucide-react'

export default function CreditHistoryPage() {
  const router = useRouter()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // 获取当前用户
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      // 获取用户资料
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(userData)

      // 获取信用历史
      const { data: historyData } = await supabase
        .from('credit_history')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })

      setRecords(historyData || [])
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const creditInfo = user ? getCreditLevel(user.credit_score) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="gradient-primary text-white">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Link href="/my" className="p-2 -ml-2 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold ml-2">信用记录</h1>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {/* 当前信用分卡片 */}
        {user && creditInfo && (
          <Card className="p-6 mb-4 text-center">
            <div className="text-5xl font-bold text-gradient mb-2">
              {user.credit_score}
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{creditInfo.badge}</span>
              <span className="font-semibold text-lg">{creditInfo.name}</span>
            </div>
            <p className="text-sm text-gray-500">
              每日额度: {creditInfo.quota}个礼包
            </p>
          </Card>
        )}

        {/* 记录列表 */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-500">暂无信用记录</p>
            <p className="text-sm text-gray-400 mt-1">快去互助赚取信用分吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <Card key={record.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      record.type === 'ADD' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    )}>
                      {record.type === 'ADD' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{record.reason}</p>
                      <p className="text-xs text-gray-400">
                        {formatRelativeTime(record.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    'text-lg font-bold',
                    record.type === 'ADD' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {record.type === 'ADD' ? '+' : '-'}{record.amount}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400 text-right">
                  余额: {record.balance_after}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}