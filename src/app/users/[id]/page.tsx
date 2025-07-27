'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PostList } from '@/components/postlist'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

const REACTION_TYPES = ['いいね', '私もやる', 'やったことある'] as const
type ReactionType = typeof REACTION_TYPES[number]

type Post = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  users: {
    username: string
    image_url: string | null
  }
  reactions: {
    type: ReactionType
    count: number
    reactedByUser: boolean
  }[]
  commentCount: number
}

type UserData = {
  username: string
  image_url: string | null
  bio: string | null
}

export default function UserPage() {
  const { id } = useParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [visibleCount, setVisibleCount] = useState(10)

  // ログインユーザー取得
  useEffect(() => {
    const fetchAuthUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAuthUserId(user.id)
    }
    fetchAuthUser()
  }, [])

  // プロフィール情報取得
  useEffect(() => {
    if (!id) return
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('username, image_url, bio')
        .eq('id', id)
        .single()
      if (error) {
        console.error('ユーザー情報取得エラー:', error.message)
        return
      }
      setUserData(data)
    }
    fetchUserData()
  }, [id])

  // 投稿＋リアクション情報取得
  useEffect(() => {
    if (!id || !authUserId) return

    const fetchPosts = async () => {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          users (
            username,
            image_url
          ),
          reactions (
            type,
            user_id
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      if (postsError) {
        console.error('投稿取得エラー:', postsError.message)
        return
      }

      const postIds = postsData?.map((post: any) => post.id) ?? []
      const { data: commentCountsData } = await supabase
        .from('comment')
        .select('post_id, id', { count: 'exact', head: false })
        .in('post_id', postIds)

      const commentCountsMap = commentCountsData?.reduce((acc: Record<string, number>, c) => {
        acc[c.post_id] = (acc[c.post_id] || 0) + 1
        return acc
      }, {}) ?? {}

      const postsWithReactions = postsData.map((post: any) => {
        const reactionsByType: Record<ReactionType, { count: number; reactedByUser: boolean }> = {
          'いいね': { count: 0, reactedByUser: false },
          '私もやる': { count: 0, reactedByUser: false },
          'やったことある': { count: 0, reactedByUser: false },
        }

        for (const type of REACTION_TYPES) {
          const filtered = post.reactions.filter((r: any) => r.type === type)
          reactionsByType[type] = {
            count: filtered.length,
            reactedByUser: filtered.some((r: any) => r.user_id === authUserId),
          }
        }

        return {
          ...post,
          commentCount: commentCountsMap[post.id] || 0,
          users: Array.isArray(post.users) ? post.users[0] : post.users,
          reactions: REACTION_TYPES.map((type) => ({
            type,
            count: reactionsByType[type].count,
            reactedByUser: reactionsByType[type].reactedByUser,
          })),
        }
      })

      setPosts(postsWithReactions)
    }

    fetchPosts()
  }, [authUserId, id])

  const toggleReaction = async (postId: string, reactionType: ReactionType) => {
    if (!authUserId) return

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    const reacted = post.reactions.find((r) => r.type === reactionType)?.reactedByUser

    if (reacted) {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', authUserId)
        .eq('type', reactionType)

      if (error) {
        alert('リアクション削除失敗: ' + error.message)
        return
      }
    } else {
      const newId = crypto.randomUUID()
      const now = new Date().toISOString()
      const { error } = await supabase.from('reactions').insert([
        {
          id: newId,
          post_id: postId,
          user_id: authUserId,
          type: reactionType,
          created_at: now,
        },
      ])

      if (error) {
        alert('リアクション追加失敗: ' + error.message)
        return
      }
    }

    // 投稿再取得
    const { data: updatedPosts, error: refreshError } = await supabase
      .from('posts')
      .select(`
        *,
        users (
          username,
          image_url
        ),
        reactions (
          type,
          user_id
        )
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    if (refreshError) {
      console.error('投稿更新失敗:', refreshError.message)
      return
    }

    const postsWithReactions = updatedPosts.map((post: any) => {
      const reactionsByType: Record<ReactionType, { count: number; reactedByUser: boolean }> = {
        'いいね': { count: 0, reactedByUser: false },
        '私もやる': { count: 0, reactedByUser: false },
        'やったことある': { count: 0, reactedByUser: false },
      }

      for (const type of REACTION_TYPES) {
        const filtered = post.reactions.filter((r: any) => r.type === type)
        reactionsByType[type] = {
          count: filtered.length,
          reactedByUser: filtered.some((r: any) => r.user_id === authUserId),
        }
      }

      return {
        ...post,
        users: Array.isArray(post.users) ? post.users[0] : post.users,
        reactions: REACTION_TYPES.map((type) => ({
          type,
          count: reactionsByType[type].count,
          reactedByUser: reactionsByType[type].reactedByUser,
        })),
      }
    })

    setPosts(postsWithReactions)
  }

  const handleDeletePost = async (postId: string) => {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId))
    toast.success('投稿を削除しました')
  }

  const isOwnPage = authUserId === id

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      {/* プロフィール表示部分 */}
      {userData && (
        <div className="bg-white border rounded-xl shadow p-6 text-center sm:text-left mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {userData.image_url && (
              <div className="w-24 h-24 relative rounded-full overflow-hidden border shrink-0">
                <Image
                  src={userData.image_url}
                  alt="プロフィール画像"
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold mb-1">{userData.username}</h2>
              <p className="text-gray-600 text-sm">
                {userData.bio || '自己紹介は未設定です。'}
              </p>
              {isOwnPage && (
                <div className="mt-2">
                  <Link
                    href="/profile"
                    className="text-sky-600 underline text-sm hover:text-sky-700"
                  >
                    プロフィールを編集する
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 投稿一覧 */}
      <PostList
        posts={posts}
        currentUserId={authUserId}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
        onToggleReaction={toggleReaction}
        onDeletePost={isOwnPage ? handleDeletePost : undefined}
      />
    </div>
  )
}
