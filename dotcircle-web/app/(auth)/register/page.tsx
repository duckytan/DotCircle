'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickName, setNickName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6位')
      setLoading(false)
      return
    }

    try {
      // 1. 注册 Supabase Auth (带重试机制)
      let authData: any = null
      let authError: any = null
      let retries = 0
      const maxRetries = 3

      while (retries < maxRetries) {
        const result = await supabase.auth.signUp({
          email,
          password,
        })
        authData = result.data
        authError = result.error

        if (!authError) break

        // 如果是 429 错误，等待后重试
        if (authError.status === 429) {
          retries++
          if (retries < maxRetries) {
            const waitTime = 2000 * retries // 2秒, 4秒, 6秒
            setError(`注册过于频繁，${waitTime / 1000}秒后重试...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        } else {
          break // 其他错误直接跳出
        }
      }

      if (authError) throw authError

      if (authData.user) {
        // 2. 创建用户资料
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: authData.user.email,
          nick_name: nickName || email.split('@')[0],
          credit_score: 60,
          credit_level: 'NORMAL',
        })

        if (profileError) throw profileError

        setSuccess(true)
        
        // 3秒后自动跳转到登录页
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="gradient-primary text-white">
          <div className="flex items-center justify-center h-14 px-4">
            <h1 className="text-lg font-semibold">注册成功</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-center p-4 max-w-md mx-auto w-full">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">注册成功！</h2>
            <p className="text-gray-500 mb-6">
              欢迎加入点点圈，3秒后自动跳转到登录页
            </p>
            <Link href="/login">
              <Button className="gradient-primary text-white">
                立即登录
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="gradient-primary text-white">
        <div className="flex items-center justify-center h-14 px-4">
          <h1 className="text-lg font-semibold">注册</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center p-4 max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-primary rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4">
            ⊙
          </div>
          <h2 className="text-2xl font-bold text-gray-900">创建账号</h2>
          <p className="text-gray-500 mt-2">加入点点圈互助社区</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                昵称 <span className="text-gray-400">(可选)</span>
              </label>
              <input
                type="text"
                value={nickName}
                onChange={(e) => setNickName(e.target.value)}
                placeholder="给自己起个名字"
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
              />
            </div>

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
                  placeholder="至少6位密码"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none pr-12"
                  required
                  minLength={6}
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

            <div>
              <label className="block text-sm font-medium mb-2">确认密码</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 gradient-primary text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              已有账号？{' '}
              <Link href="/login" className="text-orange-500 font-semibold">
                立即登录
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