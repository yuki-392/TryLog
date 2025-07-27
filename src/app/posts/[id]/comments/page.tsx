'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  users: {
    username: string
    image_url?: string | null
  }
}

export default function CommentPage() {
  const { id: postId } = useParams()
  const [comment, setComment] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [postUserId, setPostUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const [commentRes, postRes] = await Promise.all([
        supabase
          .from('comment')
          .select(`id, content, created_at, user_id, users(username, image_url)`)
          .eq('post_id', postId)
          .order('created_at', { ascending: true }),

        supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .single()
      ])

      if (commentRes.error) {
        console.error('コメント取得エラー:', commentRes.error)
        toast.error('コメントの取得に失敗しました')
      } else {
        setComment(
          (commentRes.data ?? []).map((c: any) => ({
            ...c,
            users: Array.isArray(c.users) ? c.users[0] : c.users
          }))
        )
      }

      if (postRes.error) {
        console.error('投稿者取得エラー:', postRes.error)
        toast.error('投稿者の取得に失敗しました')
      } else {
        setPostUserId(postRes.data?.user_id ?? null)
      }
    }

    fetchData()
  }, [postId])

  const handleDelete = async (commentId: string) => {
    const confirmed = confirm('このコメントを削除しますか？')
    if (!confirmed) return

    const { error } = await supabase
      .from('comment')
      .delete()
      .eq('id', commentId)

    if (error) {
      toast.error('削除に失敗しました')
      return
    }

    setComment((prev) => prev.filter((c) => c.id !== commentId))
    toast.success('コメントを削除しました')
  }

  const handleSubmit = async () => {
    if (!newComment || !userId) return

    const { error } = await supabase.from('comment').insert([
      {
        id: crypto.randomUUID(),
        post_id: postId,
        user_id: userId,
        content: newComment,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      toast.error('コメントの投稿に失敗しました')
    } else {
      setNewComment('')
      const { data } = await supabase
        .from('comment')
        .select(`id, content, created_at, user_id, users(username, image_url)`)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })


      setComment(
        (data ?? []).map((comment: any) => ({
          ...comment,
          users: Array.isArray(comment.users) ? comment.users[0] : comment.users
        }))
      )
      toast.success('コメントを投稿しました')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="text-2xl font-bold mb-6 text-sky-700 text-center">コメント一覧</h1>

      <div className="space-y-4 mb-8">
        {comment.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl shadow-sm p-4 border flex items-start gap-3"
          >
            {c.users.image_url ? (
              <img
                src={c.users.image_url}
                alt="ユーザーアイコン"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300" />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-sm text-gray-800 break-words">{c.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                by {c.users.username} | {new Date(c.created_at).toLocaleString()}
              </p>
            </div>

            {(userId === c.user_id || userId === postUserId) && (
              <button
                onClick={() => handleDelete(c.id)}
                className="text-xs text-red-500 hover:underline ml-2"
              >
                削除
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-md p-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full border rounded-lg p-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 mb-3 resize-none"
          placeholder="コメントを入力"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white py-2 rounded-full text-sm"
        >
          コメントを投稿
        </button>
      </div>
    </div>
  )
}
