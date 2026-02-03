'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { PackageCard } from '@/components/packages/package-card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import type { Package } from '@/types'
import { Search } from 'lucide-react'

export default function HomePage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPackages()
  }, [activeTab])

  async function loadPackages() {
    setLoading(true)
    
    let query = supabase
      .from('packages')
      .select('*, creator:users(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (activeTab !== 'all') {
      query = query.eq('type', activeTab.toUpperCase())
    }

    const { data, error } = await query

    if (error) {
      console.error('加载礼包失败:', error)
    } else {
      setPackages(data || [])
    }
    
    setLoading(false)
  }

  async function handleHelp(packageId: string) {
    try {
      // 检查用户是否登录
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('请先登录')
        return
      }

      // 调用帮助 API
      const response = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || '帮助失败')
        return
      }

      // 刷新列表
      loadPackages()
      alert('领取成功！')
    } catch (error) {
      console.error('帮助失败:', error)
      alert('操作失败，请重试')
    }
  }

  const filteredPackages = packages.filter(pkg =>
    searchQuery === '' || 
    pkg.creator?.nickName?.includes(searchQuery)
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="点点圈" />

      {/* 搜索栏 */}
      <div className="bg-white p-3 sticky top-14 z-40">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索礼包"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* 标签筛选 */}
      <div className="bg-white px-3 pb-3 border-b border-gray-100">
        <div className="flex gap-2 max-w-lg mx-auto">
          {['all', 'link', 'image'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? 'gradient-primary text-white border-0'
                  : 'text-gray-600'
              }
            >
              {tab === 'all' ? '全部' : tab === 'link' ? '链接' : '图片'}
            </Button>
          ))}
        </div>
      </div>

      {/* 礼包列表 */}
      <main className="p-3 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-gray-500">暂无礼包，快去发布吧！</p>
          </div>
        ) : (
          filteredPackages.map((pkg) => (
            <PackageCard key={pkg.id} package={pkg} onHelp={handleHelp} />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}