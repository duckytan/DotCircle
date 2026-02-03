import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

export function maskNickname(nickname: string): string {
  if (!nickname || nickname.length === 0) {
    return '用**'
  }
  
  if (nickname.length <= 2) {
    return nickname[0] + '**'
  }
  
  return nickname[0] + '*'.repeat(nickname.length - 2) + nickname[nickname.length - 1]
}

export function parseYuanbaoUrl(url: string): { valid: boolean; giftId: string | null } {
  try {
    const pattern = /^https:\/\/yb\.tencent\.com\/fes\/red\/claim/
    const valid = pattern.test(url)
    
    const match = url.match(/red_packet_id=([^&]+)/)
    const giftId = match ? match[1] : null
    
    return { valid, giftId }
  } catch (e) {
    return { valid: false, giftId: null }
  }
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null
  
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return function (...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn(...args)
    }
  }
}