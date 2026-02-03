import type { Metadata } from 'next'
import { BottomNav } from '@/components/layout/bottom-nav'

export const metadata: Metadata = {
  title: '点点圈 - 腾讯元宝抽奖互助平台',
  description: '纯公益的腾讯元宝抽奖互助平台',
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <BottomNav />
    </div>
  )
}