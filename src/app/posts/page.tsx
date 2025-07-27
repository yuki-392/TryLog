'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PostList } from '@/components/postlist'
import { toast } from 'sonner'

type Post = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  users: {
    username: string
    image_url: string
  }
  reactions: {
    type: string
    count: number
    reactedByUser: boolean
  }[]
  commentCount: number
}

const REACTION_TYPES = ['いいね', '私もやる', 'やったことある'] as const
type ReactionType = typeof REACTION_TYPES[number]

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(10)
  const router = useRouter()

  // 投稿・コメント数・リアクションをまとめて取得する共通関数
  const fetchPosts = async (currentUserId: string | null) => {
    if (!currentUserId) return

    // 投稿とリアクションを取得
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
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('投稿の取得に失敗しました:', postsError.message)
      return
    }

    const postIds = postsData?.map((post: any) => post.id) ?? []

    // コメント数を取得
    const { data: commentCountsData, error: commentCountError } = await supabase
      .from('comment')
      .select('post_id, id', { count: 'exact', head: false })
      .in('post_id', postIds)

    if (commentCountError) {
      console.error('コメント数の取得に失敗しました:', commentCountError.message)
    }

    const commentCountsMap = commentCountsData?.reduce((acc: Record<string, number>, comment) => {
      acc[comment.post_id] = (acc[comment.post_id] || 0) + 1
      return acc
    }, {}) ?? {}

    // 投稿にコメント数・リアクション情報を合成
    const postsWithReactions = (postsData ?? []).map((post: any) => {
      const reactionsByType: {
        [key in ReactionType]?: { count: number; reactedByUser: boolean }
      } = {}

      REACTION_TYPES.forEach((type) => {
        const filtered = post.reactions.filter((r: any) => r.type === type)
        const count = filtered.length
        const reactedByUser = filtered.some((r: any) => r.user_id === currentUserId)
        reactionsByType[type] = { count, reactedByUser }
      })

      return {
        ...post,
        commentCount: commentCountsMap[post.id] || 0,
        users: Array.isArray(post.users) ? post.users[0] : post.users,
        reactions: REACTION_TYPES.map((type) => ({
          type,
          count: reactionsByType[type]?.count || 0,
          reactedByUser: reactionsByType[type]?.reactedByUser || false,
        })),
      }
    })

    setPosts(postsWithReactions)
  }

  // ユーザー取得 & 投稿取得
  useEffect(() => {
    const fetchUserAndPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await fetchPosts(user.id)
      }
    }
    fetchUserAndPosts()
  }, [])

  // リアクションのトグル処理
  const toggleReaction = async (postId: string, reactionType: ReactionType) => {
    if (!userId) return

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    const reacted = post.reactions.find((r) => r.type === reactionType)?.reactedByUser

    if (reacted) {
      // 削除
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', reactionType)

      if (error) {
        alert('リアクションの取り消しに失敗しました: ' + error.message)
        console.error(error)
        return
      }

      toast.success('リアクションを取り消しました')
    } else {
      // 追加
      const newId = crypto.randomUUID()
      const now = new Date().toISOString()

      const { error } = await supabase.from('reactions').insert([
        {
          id: newId,
          post_id: postId,
          user_id: userId,
          type: reactionType,
          created_at: now,
        },
      ])

      if (error) {
        alert('リアクションの追加に失敗しました: ' + error.message)
        console.error(error)
        return
      }

      toast.success('リアクションを追加しました')
    }

    // リアクション切替後に再フェッチ
    await fetchPosts(userId)
  }

  // 投稿削除
  const deletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      toast.success('投稿を削除しました')
    }
    else {
      toast.error('投稿の削除に失敗しました: ' + error.message)
      console.error(error)
    }
  }

  return (
    <PostList
      posts={posts}
      currentUserId={userId}
      visibleCount={visibleCount}
      setVisibleCount={setVisibleCount}
      onDeletePost={deletePost}
      onToggleReaction={toggleReaction}
      showHeader={true}
      headerRightButton={
        <button
          onClick={() => router.push('/create-post')}
          className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-5 py-2 text-sm sm:text-base"
        >
          投稿する
        </button>
      }
    />
  )
}
