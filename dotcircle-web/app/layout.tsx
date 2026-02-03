import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '点点圈 - 腾讯元宝抽奖互助平台',
  description: '纯公益的腾讯元宝抽奖互助平台，先助人后受助，信用越好曝光越高',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}