'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  FileText, 
  LogOut,
  ChevronRight,
  Loader2
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const menuItems = [
    {
      icon: User,
      label: '个人资料',
      href: '/settings/profile',
      value: user?.nick_name || '未设置',
    },
    {
      icon: Bell,
      label: '消息通知',
      action: () => setNotifications(!notifications),
      value: notifications ? '开启' : '关闭',
      toggle: true,
    },
    {
      icon: Shield,
      label: '隐私设置',
      href: '/settings/privacy',
    },
    {
      icon: FileText,
      label: '用户协议',
      href: '/terms',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="gradient-primary text-white">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Link href="/my" className="p-2 -ml-2 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold ml-2">设置</h1>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* 用户信息 */}
            <Card className="p-4 mb-4">
              <div className="flex items-center gap-4">
                <img
                  src={user?.avatar_url || '/default-avatar.png'}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-lg">{user?.nick_name || '用户'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </Card>

            {/* 设置菜单 */}
            <Card className="overflow-hidden mb-4">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                const isLast = index === menuItems.length - 1

                return (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer ${
                      !isLast ? 'border-b border-gray-100' : ''
                    }`}
                    onClick={item.action || (() => item.href && router.push(item.href))}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-sm text-gray-400">{item.value}</span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                )
              })}
            </Card>

            {/* 关于 */}
            <Card className="p-4 mb-4">
              <div className="text-center">
                <div className="w-12 h-12 gradient-primary rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-2">
                  ⊙
                </div>
                <p className="font-semibold">点点圈</p>
                <p className="text-sm text-gray-400">版本 1.0.0</p>
              </div>
            </Card>

            {/* 退出登录 */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full py-3 text-red-500 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </>
        )}
      </div>
    </div>
  )
}