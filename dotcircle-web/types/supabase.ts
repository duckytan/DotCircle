// 点点圈 Web 版本 - Supabase 类型定义
// 使用 supabase gen types 生成

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          nick_name: string
          avatar_url: string
          credit_score: number
          credit_level: string
          daily_helped: number
          daily_published: number
          daily_quota: number
          total_helped: number
          total_published: number
          total_received: number
          streak_days: number
          last_active_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          phone?: string | null
          nick_name?: string
          avatar_url?: string
          credit_score?: number
          credit_level?: string
          daily_helped?: number
          daily_published?: number
          daily_quota?: number
          total_helped?: number
          total_published?: number
          total_received?: number
          streak_days?: number
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          nick_name?: string
          avatar_url?: string
          credit_score?: number
          credit_level?: string
          daily_helped?: number
          daily_published?: number
          daily_quota?: number
          total_helped?: number
          total_published?: number
          total_received?: number
          streak_days?: number
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          creator_id: string
          type: 'LINK' | 'IMAGE'
          gift_url: string | null
          image_url: string | null
          status: 'active' | 'completed' | 'cancelled' | 'pending'
          help_count: number
          max_help: number
          helpers: any[]
          exposure_score: number
          contract_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          type: 'LINK' | 'IMAGE'
          gift_url?: string | null
          image_url?: string | null
          status?: 'active' | 'completed' | 'cancelled' | 'pending'
          help_count?: number
          max_help?: number
          helpers?: any[]
          exposure_score?: number
          contract_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          type?: 'LINK' | 'IMAGE'
          gift_url?: string | null
          image_url?: string | null
          status?: 'active' | 'completed' | 'cancelled' | 'pending'
          help_count?: number
          max_help?: number
          helpers?: any[]
          exposure_score?: number
          contract_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      help_records: {
        Row: {
          id: string
          package_id: string
          helper_id: string
          helped_at: string
          contract_fulfilled: boolean | null
          contract_fulfilled_at: string | null
        }
        Insert: {
          id?: string
          package_id: string
          helper_id: string
          helped_at?: string
          contract_fulfilled?: boolean | null
          contract_fulfilled_at?: string | null
        }
        Update: {
          id?: string
          package_id?: string
          helper_id?: string
          helped_at?: string
          contract_fulfilled?: boolean | null
          contract_fulfilled_at?: string | null
        }
      }
      credit_history: {
        Row: {
          id: string
          user_id: string
          type: 'ADD' | 'DEDUCT'
          amount: number
          reason: string
          reason_code: string | null
          balance_before: number
          balance_after: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'ADD' | 'DEDUCT'
          amount: number
          reason: string
          reason_code?: string | null
          balance_before: number
          balance_after: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'ADD' | 'DEDUCT'
          amount?: number
          reason?: string
          reason_code?: string | null
          balance_before?: number
          balance_after?: number
          created_at?: string
        }
      }
    }
  }
}