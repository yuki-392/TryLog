'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { toast } from 'sonner'

export default function Header() {
  const [username, setUsername] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const router = useRouter()

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      setIsLoggedIn(true)
      setUserId(user.id)
      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (data?.username) {
        setUsername(data.username)
      } else {
        setUsername(null)
      }
    } else {
      setIsLoggedIn(false)
      setUsername(null)
      setUserId(null)
    }
  }

  useEffect(() => {
    fetchUser()
    setMounted(true)

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setMenuOpen(false)
    toast.success('ログアウトしました')
  }

  return (
    <header className="w-full bg-white shadow-md py-4 px-6">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        {/* 左：ロゴと状態 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(isLoggedIn ? '/posts' : '/')}
            className="text-2xl font-bold text-sky-600 hover:text-sky-700"
          >
            TryLog
          </button>
          {mounted && (
            <span className="hidden sm:inline text-sm text-gray-500">
              {isLoggedIn
                ? username
                  ? `ログイン中: ${username}`
                  : 'ユーザー名取得中...'
                : '未ログイン'}
            </span>
          )}
        </div>

        {/* 右：メニュー */}
        <div className="sm:hidden">
          {/* モバイル用メニューボタン */}
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
          {isLoggedIn && mounted && (
            <>
              <Link href="/posts" className="text-sky-600 hover:text-sky-800 transition">
                ホーム
              </Link>
              <Link href="/create-post" className="text-sky-600 hover:text-sky-800 transition">
                投稿する
              </Link>
              <Link href={`/users/${userId}`} className="text-sky-600 hover:text-sky-800 transition">
                マイページ
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-700 transition"
              >
                ログアウト
              </button>
            </>
          )}
        </nav>
      </div>

      {/* モバイルメニュー */}
      {menuOpen && isLoggedIn && mounted && (
        <div className="sm:hidden mt-4 space-y-2 text-sm font-medium text-sky-600">
          <Link
            href="/posts"
            onClick={() => setMenuOpen(false)}
            className="block px-2"
          >
            ホーム
          </Link>
          <Link
            href="/create-post"
            onClick={() => setMenuOpen(false)}
            className="block px-2"
          >
            投稿する
          </Link>
          <Link
            href={`/users/${userId}`}
            onClick={() => setMenuOpen(false)}
            className="block px-2"
          >
            マイページ
          </Link>
          <button
            onClick={handleLogout}
            className="block px-2 text-red-500"
          >
            ログアウト
          </button>
        </div>
      )}
    </header>
  )
}
