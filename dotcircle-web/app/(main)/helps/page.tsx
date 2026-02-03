'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { formatRelativeTime, maskNickname } from '@/lib/utils'
import { ArrowLeft, Link as LinkIcon, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MyHelpsPage() {
  const router = useRouter()
  const [helps, setHelps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHelps()
  }, [])

  async function loadHelps() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('help_records')
        .select(`
          *,
          package:packages(*, creator:users(nick_name, avatar_url)),
          helper:users(nick_name, avatar_url)
        `)
        .eq('helper_id', user.id)
        .order('helped_at', { ascending: false })

      if (error) throw error

      setHelps(data || [])
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="gradient-primary text-white">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Link href="/my" className="p-2 -ml-2 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold ml-2">我的帮助</h1>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : helps.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">🤝</div>
            <p className="text-gray-500">还没有帮助记录</p>
            <Link href="/" className="text-orange-500 font-semibold mt-2 inline-block">
              去首页帮助别人 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {helps.map((help) => {
              const pkg = help.package
              const isCompleted = pkg?.status === 'completed'

              return (
                <Card key={help.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 状态图标 */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        pkg?.type === 'LINK' ? <LinkIcon className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">
                          帮助了 {pkg?.creator ? maskNickname(pkg.creator.nick_name) : '用户'}
                        </span>
                        <Badge variant={isCompleted ? 'default' : 'secondary'} className={cn(
                          isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {isCompleted ? '已完成' : '进行中'}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        {pkg?.type === 'LINK' ? '元宝抽奖链接' : '二维码图片'}
                        {' '}
                        <span className="text-gray-400">
                          ({pkg?.help_count || 0}/{pkg?.max_help || 10}人)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatRelativeTime(help.helped_at)}</span>
                        {help.contract_fulfilled && (
                          <span className="text-green-600">✓ 已履约</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
