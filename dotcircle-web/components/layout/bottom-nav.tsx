'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, Trophy, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const [activeTab, setActiveTab] = useState('home')

  const tabs = [
    { id: 'home', label: '首页', icon: Home, href: '/' },
    { id: 'leaderboard', label: '榜单', icon: Trophy, href: '/leaderboard' },
    { id: 'my', label: '我的', icon: User, href: '/my' },
  ]

  return (
    <>
      {/* 悬浮发布按钮 */}
      <Link
        href="/publish"
        className="fixed bottom-20 right-4 z-50 w-14 h-14 gradient-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </Link>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full",
                  isActive ? "text-orange-500" : "text-gray-400"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}