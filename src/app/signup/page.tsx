'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleSignUp = async () => {
    setLoading(true)
    setErrorMsg('')

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError || !signUpData.user) {
      setErrorMsg(signUpError?.message || '登録に失敗しました')
      setLoading(false)
      return
    }

    const userId = signUpData.user.id

    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      username: username,
    })

    if (insertError) {
      setErrorMsg('このユーザーは既に登録されています')
      setLoading(false)
      console.error('ユーザー名の保存に失敗:', insertError)
      toast.error('このユーザーは既に登録されています')
      return
    }

    router.push('/signin')
    toast.success('アカウントが作成されました。メールを認証してください')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 max-w-full">
      <div className="w-full max-w-sm sm:max-w-md p-6 rounded-lg shadow-md border border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-700 mb-6 text-center">新規登録</h1>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 sm:p-4 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        <input
          type="password"
          placeholder="パスワード（6文字以上）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 sm:p-4 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        <input
          type="text"
          placeholder="ユーザー名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 sm:p-4 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        {errorMsg && (
          <p className="text-red-600 text-sm mb-4 text-center">{errorMsg}</p>
        )}

        <Button
          onClick={handleSignUp}
          disabled={loading || !email || !password || !username}
          className={`w-full py-2 rounded-full font-semibold transition ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-600 text-white'
          }`}
        >
          {loading ? '登録中...' : '新規登録'}
        </Button>

        <p className="mt-6 text-sm text-center text-gray-600">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/signin" className="text-sky-600 underline font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </div>

  )
}
