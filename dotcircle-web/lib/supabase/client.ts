// @ts-nocheck
// 临时禁用严格类型检查
import { createClient } from '@supabase/supabase-js'

// DEBUG: 输出环境变量
console.log('=== Supabase Client Debug ===')
console.log('Supabase URL defined:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Anon Key defined:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log('Supabase URL value:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...')
console.log('============================')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase environment variables are not set!')
  console.error('Please check your .env.local file or Vercel environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'dotcircle-web'
    }
  }
})

// 服务端使用的 client（使用 service role key）
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}