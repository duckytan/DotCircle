import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '登录 - 点点圈',
  description: '登录点点圈互助平台',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}