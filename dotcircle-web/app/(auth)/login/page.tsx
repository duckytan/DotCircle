'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // DEBUG: 输出环境变量（注意：生产环境不要这样做）
    console.log('=== DEBUG INFO ===')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Email:', email)
    console.log('Password length:', password.length)
    console.log('==================')

    try {
      console.log('Step 1: Calling signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Step 2: signInWithPassword response:', { data, error })

      if (error) {
        console.error('Login error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack,
        })
        throw error
      }

      if (!data.user) {
        throw new Error('登录成功但没有返回用户信息')
      }

      console.log('Step 3: User authenticated:', data.user.id)

      // 检查用户是否已创建资料
      console.log('Step 4: Checking user profile...')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      console.log('Step 5: User profile query result:', { userData, userError })

      if (userError && userError.code !== 'PGRST116') {
        console.error('Profile check error:', userError)
      }

      if (!userData) {
        console.log('Step 6: Creating user profile...')
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          nick_name: email.split('@')[0],
        })
        
        if (insertError) {
          console.error('Profile creation error:', insertError)
          throw insertError
        }
        console.log('Step 7: User profile created successfully')
      } else {
        console.log('Step 6: User profile already exists')
      }

      console.log('Step 8: Redirecting to home...')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error('=== LOGIN FAILED ===')
      console.error('Error:', err)
      console.error('Error message:', err.message)
      console.error('Error status:', err.status)
      console.error('Error code:', err.code)
      console.error('====================')
      
      // 提供更友好的错误提示
      let errorMessage = err.message || '登录失败'
      
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = '账号或密码错误。如果是新用户，请先注册。'
      } else if (err.status === 429) {
        errorMessage = '登录过于频繁，请稍后再试。'
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = '邮箱未确认，请检查您的邮箱。'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log('Login process completed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="gradient-primary text-white">
        <div className="flex items-center justify-center h-14 px-4">
          <h1 className="text-lg font-semibold">登录</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center p-4 max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-primary rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4">
            ⊙
          </div>
          <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
          <p className="text-gray-500 mt-2">登录后继续互助之旅</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 gradient-primary text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              还没有账号？{' '}
              <Link href="/register" className="text-orange-500 font-semibold">
                立即注册
              </Link>
            </p>
          </div>
        </Card>

        {/* 返回首页 */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}