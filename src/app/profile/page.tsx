'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        router.push('/signin')
        return
      }

      const { data, error: userError } = await supabase
        .from('users')
        .select('username, bio')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        setError('プロフィールの取得に失敗しました')
      } else {
        setUsername(data.username)
        setBio(data.bio || '')
      }

      setLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleUpdate = async () => {
    setMessage('')
    setError('')
    setLoading(true)

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setError('認証情報がありません')
      setLoading(false)
      return
    }

    const userId = authData.user.id
    let image_url = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `avatar_${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('users-icon')
        .upload(filePath, imageFile, { upsert: true })

      if (uploadError) {
        setError('画像のアップロードに失敗しました')
        setLoading(false)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('users-icon').getPublicUrl(filePath)

      image_url = publicUrl
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        username,
        bio,
        ...(image_url && { image_url }),
      })
      .eq('id', userId)

    if (updateError) {
      setError('更新に失敗しました: ' + updateError.message)
      toast.error('プロフィールの更新に失敗しました')
    } else {
      setMessage('プロフィールを更新しました')
      toast.success('プロフィールを更新しました')
      router.push(`/users/${userId}`)
    }

    setLoading(false)
  }

  if (loading) return <p className="text-center py-10 text-gray-600">読み込み中...</p>

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-sky-700">プロフィール編集</h1>

      <label className="block mb-2 text-sm font-medium text-gray-700">ユーザー名</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
        placeholder="例）taro123"
      />

      <label className="block mb-2 text-sm font-medium text-gray-700">自己紹介</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        className="w-full p-3 border rounded-md mb-4 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-sky-400"
        placeholder="簡単な紹介文を書いてみよう"
      />

      <label className="block mb-2 text-sm font-medium text-gray-700">プロフィール画像</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        className="mb-6"
      />

      {message && <p className="text-green-600 mb-2 text-sm">{message}</p>}
      {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}

      <button
        onClick={handleUpdate}
        disabled={loading}
        className={`w-full text-white font-semibold py-2 rounded-full transition ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-sky-500 hover:bg-sky-600'
        }`}
      >
        {loading ? '保存中...' : '保存'}
      </button>
    </div>
  )
}
