'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function CreatePostPage() {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('ユーザー取得失敗:', userError)
      setError('ログイン情報が取得できませんでした')
      toast.error('ログイン情報が取得できませんでした')
      return
    }

    let image_url = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        console.error('画像アップロード失敗:', uploadError)
        setError('画像のアップロードに失敗しました')
        toast.error('画像のアップロードに失敗しました')
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath)

      image_url = publicUrl
    }

    const newId = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error: insertError } = await supabase.from('posts').insert([
      {
        id: newId,
        content,
        user_id: user.id,
        image_url,
        created_at: now,
      },
    ])

    if (insertError) {
      console.error('投稿挿入失敗:', insertError)
      setError('投稿の作成に失敗しました')
    } else {
      toast.success('投稿が作成されました')
      router.push('/posts')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-sky-700">
          投稿を作成
        </h1>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <textarea
          className="w-full h-32 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 mb-5 text-base sm:text-sm resize-none"
          placeholder="いま考えていることをシェアしよう！"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <label className="block mb-5 text-sm text-gray-700">
          <span className="block mb-2">画像を選択（任意）:</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-sky-100 file:text-sky-700
              hover:file:bg-sky-200"
          />
        </label>

        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-full text-sm"
          >
            投稿する
          </Button>
        </div>
      </div>
    </div>
  )
}
