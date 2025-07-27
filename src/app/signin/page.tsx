'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      toast.error('ログインに失敗しました: ' + error.message)
    } else {
      router.push('/posts')
      toast.success('ログインしました')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 max-w-full">
      <div className="w-full max-w-sm sm:max-w-md p-6 rounded-lg shadow-md border border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-700 mb-6 text-center">ログイン</h1>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 sm:p-4 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 sm:p-4 border rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        <Button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className={`w-full py-2 rounded-full font-semibold transition ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-600 text-white'
          }`}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>

        <p className="mt-6 text-sm text-center text-gray-600">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-sky-600 underline font-medium">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  )
}
