// app/error.tsx
'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('エラー発生:', error)
  }, [error])

  return (
    <html>
      <body className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
        <p className="text-gray-700 mb-6">
          申し訳ありません。問題が発生しました。もう一度お試しください。
        </p>
        <button
          onClick={() => reset()}
          className="bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 rounded-lg"
        >
          再読み込み
        </button>
      </body>
    </html>
  )
}
