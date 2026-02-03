export type CreditLevel = 'EXCELLENT' | 'GOOD' | 'NORMAL' | 'WARNING' | 'RESTRICTED' | 'BANNED'

export interface User {
  id: string
  email?: string
  phone?: string
  nickName: string
  avatarUrl: string
  creditScore: number
  creditLevel: CreditLevel
  dailyStats: {
    date: string
    helped: number
    published: number
    quota: number
  }
  totalStats: {
    totalHelped: number
    totalPublished: number
    totalReceived: number
    streakDays: number
  }
  createdAt: string
  updatedAt: string
}

export type PackageType = 'LINK' | 'IMAGE'
export type PackageStatus = 'active' | 'completed' | 'cancelled' | 'pending'

export interface Package {
  id: string
  creatorId: string
  type: PackageType
  giftUrl?: string
  imageUrl?: string
  status: PackageStatus
  helpCount: number
  maxHelp: number
  helpers: Helper[]
  exposureScore: number
  contractEnabled: boolean
  createdAt: string
  updatedAt: string
  creator?: User
}

export interface Helper {
  userId: string
  helpedAt: string
  avatarUrl?: string
}

export interface HelpRecord {
  id: string
  packageId: string
  helperId: string
  helpedAt: string
  contractFulfilled?: boolean
  contractFulfilledAt?: string
}

export interface CreditHistory {
  id: string
  userId: string
  type: 'ADD' | 'DEDUCT'
  amount: number
  reason: string
  reasonCode: string
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  user: User
  score: number
  change?: number
}

export type LeaderboardType = 'helper' | 'credit' | 'active' | 'contributor'

export interface CreditLevelInfo {
  level: CreditLevel
  name: string
  badge: string
  color: string
  quota: number
  minScore: number
  maxScore: number
}

export const CREDIT_LEVELS: CreditLevelInfo[] = [
  { level: 'EXCELLENT', name: '优秀', badge: '🏆', color: '#fbbf24', quota: 3, minScore: 90, maxScore: 100 },
  { level: 'GOOD', name: '良好', badge: '⭐', color: '#9ca3af', quota: 2, minScore: 75, maxScore: 89 },
  { level: 'NORMAL', name: '一般', badge: '🔹', color: '#3b82f6', quota: 2, minScore: 60, maxScore: 74 },
  { level: 'WARNING', name: '警告', badge: '⚠️', color: '#f97316', quota: 1, minScore: 40, maxScore: 59 },
  { level: 'RESTRICTED', name: '受限', badge: '🚫', color: '#6b7280', quota: 0, minScore: 20, maxScore: 39 },
  { level: 'BANNED', name: '封禁', badge: '❌', color: '#ef4444', quota: 0, minScore: 0, maxScore: 19 },
]

export function getCreditLevel(score: number): CreditLevelInfo {
  return CREDIT_LEVELS.find(level => score >= level.minScore && score <= level.maxScore) || CREDIT_LEVELS[2]
}