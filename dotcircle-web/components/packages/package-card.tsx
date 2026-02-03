'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime, maskNickname } from '@/lib/utils'
import { getCreditLevel } from '@/types'
import type { Package } from '@/types'
import { Link, Image as ImageIcon, Users } from 'lucide-react'

interface PackageCardProps {
  package: Package
  onHelp?: (id: string) => void
}

export function PackageCard({ package: pkg, onHelp }: PackageCardProps) {
  const [isHelping, setIsHelping] = useState(false)
  
  const progressPercent = (pkg.helpCount / pkg.maxHelp) * 100
  const remaining = pkg.maxHelp - pkg.helpCount
  const creditInfo = pkg.creator ? getCreditLevel(pkg.creator.creditScore) : null
  
  const handleHelp = async () => {
    if (!onHelp || isHelping) return
    setIsHelping(true)
    await onHelp(pkg.id)
    setIsHelping(false)
  }

  return (
    <Card className="p-4 mb-3">
      {/* 发布者信息 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <img
            src={pkg.creator?.avatarUrl || '/default-avatar.png'}
            alt={pkg.creator?.nickName}
            className="w-10 h-10 rounded-full object-cover"
          />
          {creditInfo && (
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs border-2 border-white"
              style={{ backgroundColor: creditInfo.color }}
            >
              {creditInfo.badge}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {pkg.creator ? maskNickname(pkg.creator.nickName) : '用户'}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {formatRelativeTime(pkg.createdAt)}
          </span>
        </div>
        <span className="text-xl">
          {pkg.type === 'LINK' ? <Link className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
        </span>
      </div>

      {/* 礼包内容 */}
      <div
        className={cn(
          "rounded-lg p-3 mb-3",
          pkg.type === 'LINK'
            ? "bg-orange-50 border border-orange-100"
            : "bg-blue-50 border border-blue-100"
        )}
      >
        <div className="flex items-center gap-2">
          {pkg.type === 'LINK' ? (
            <>
              <Link className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">元宝抽奖链接</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">二维码图片</span>
            </>
          )}
        </div>
        {pkg.type === 'IMAGE' && pkg.imageUrl && (
          <img
            src={pkg.imageUrl}
            alt="二维码"
            className="mt-2 max-h-32 object-contain rounded"
          />
        )}
      </div>

      {/* 进度和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex -space-x-2">
              {pkg.helpers?.slice(0, 3).map((helper, idx) => (
                <img
                  key={idx}
                  src={helper.avatarUrl || '/default-avatar.png'}
                  alt=""
                  className="w-6 h-6 rounded-full border-2 border-white"
                />
              ))}
              {pkg.helpCount > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                  +{pkg.helpCount - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">
              还差 <span className="text-orange-500 font-semibold">{remaining}人</span> 领满
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Button
          onClick={handleHelp}
          disabled={isHelping || remaining === 0}
          size="sm"
          className="ml-3 gradient-primary text-white rounded-full px-4"
        >
          {isHelping ? '领取中...' : remaining === 0 ? '已领满' : '去领取'}
        </Button>
      </div>

      {/* 曝光值 */}
      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
        <Users className="w-3 h-3" />
        <span>曝光值: {pkg.exposureScore}</span>
      </div>
    </Card>
  )
}