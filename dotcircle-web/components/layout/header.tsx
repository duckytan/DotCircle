'use client'

import Link from 'next/link'
import { ChevronLeft, Settings } from 'lucide-react'

interface HeaderProps {
  title: string
  showBack?: boolean
  showSettings?: boolean
  backHref?: string
}

export function Header({ title, showBack = false, showSettings = false, backHref = '/' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 gradient-primary text-white">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {showBack ? (
          <Link href={backHref} className="p-2 -ml-2 hover:bg-white/20 rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        ) : (
          <div className="w-10" />
        )}
        
        <h1 className="text-lg font-semibold">{title}</h1>
        
        {showSettings ? (
          <Link href="/settings" className="p-2 -mr-2 hover:bg-white/20 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </div>
    </header>
  )
}