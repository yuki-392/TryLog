'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-6 max-w-4xl mx-auto bg-gradient-to-b from-white to-blue-50">
      <h1 className="text-5xl font-extrabold text-blue-600 mb-6 tracking-tight">
        TryLog
      </h1>

      <p className="hidden sm:block text-base sm:text-lg md:text-xl text-gray-700 text-center max-w-2xl mb-10 leading-relaxed whitespace-pre-line">
        TryLogは、あなたの<span className="font-semibold text-blue-500">挑戦・成長・気づき</span>を記録するアプリです。<br />
        行動を振り返り、自分の変化を感じましょう。<br />
        他のユーザーと共有し、<span className="font-medium">刺激</span>や<span className="font-medium">気づき</span>を得ることもできます。<br />
        あなたの新しい一歩を、TryLogで始めてみませんか？<br />
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => router.push('/signup')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 rounded-xl shadow-md"
        >
          🚀 新規登録
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/signin')}
          className="text-lg px-8 py-3 rounded-xl border-gray-400 text-gray-700 hover:bg-gray-100"
        >
          ログインはこちら
        </Button>
      </div>
    </main>

  )
}
