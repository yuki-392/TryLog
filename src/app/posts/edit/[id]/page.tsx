'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const EditPostPage = () => {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return

      const { data, error } = await supabase
        .from('posts')
        .select('content, image_url')
        .eq('id', postId)
        .single()

      if (error) {
        console.error('投稿取得エラー:', error.message)
        return
      }

      if (data) {
        setContent(data.content)
        setImageUrl(data.image_url || '')
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('ログイン情報取得失敗:', userError)
        alert('ログイン情報が取得できません')
        setUploading(false)
        return
      }

      // 古い画像の削除
      if (imageUrl) {
        const pathMatch = imageUrl.match(/post-images\/([^"]+)/)
        const imagePath = pathMatch?.[1]?.split('?')[0]
        if (imagePath) {
          await supabase.storage.from('post-images').remove([imagePath])
        }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('post-images').getPublicUrl(filePath)

      setImageUrl(publicUrl)
    } catch (err) {
      console.error('画像アップロード失敗:', err)
      alert('画像アップロードに失敗しました')
      toast.error('画像アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdate = async () => {
    if (!postId) return

    const { error } = await supabase
      .from('posts')
      .update({ content, image_url: imageUrl })
      .eq('id', postId)

    if (error) {
      toast.error('編集が失敗しました: ' + error.message)
    } else {
      toast.success('編集が完了しました')
      router.push('/posts')
    }
  }

  if (loading)
    return <p className="text-center py-10 text-gray-600">読み込み中...</p>

  return (
    <div className="p-6 max-w-3xl mx-auto px-4 sm:px-6">
      <h1 className="text-2xl font-bold text-sky-700 mb-6 text-center">投稿を編集</h1>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="メッセージ"
        rows={6}
        className="w-full border rounded-lg p-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 mb-4 resize-none"
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="mb-4 w-full"
      />

      {imageUrl && (
        <div className="mb-6">
          <div className="bg-white border rounded-lg overflow-hidden shadow-sm p-2">
            <img
              src={imageUrl}
              alt="プレビュー画像"
              className="w-full h-auto object-contain rounded"
            />
          </div>
        </div>
      )}

      <button
        onClick={handleUpdate}
        disabled={uploading}
        className={`w-full text-white font-semibold py-2 rounded-full transition ${
          uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-sky-500 hover:bg-sky-600'
        }`}
      >
        {uploading ? 'アップロード中...' : '更新する'}
      </button>
    </div>
  )
}

export default EditPostPage
