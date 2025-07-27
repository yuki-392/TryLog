'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Trash2, Pencil, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const REACTION_TYPES = ['いいね', '私もやる', 'やったことある'] as const
export type ReactionType = (typeof REACTION_TYPES)[number]

export type Reaction = {
  type: ReactionType | string
  count?: number
  reactedByUser?: boolean
  user_id?: string
}

export type User = {
  username: string
  image_url?: string | null
}

export type Post = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  users?: User
  reactions: Reaction[]
  commentCount?: number
}

type PostListProps = {
  posts: Post[]
  currentUserId: string | null
  visibleCount: number
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>
  onDeletePost?: (postId: string) => void
  onToggleReaction: (postId: string, reactionType: ReactionType) => void
  showHeader?: boolean
  headerRightButton?: React.ReactNode
}

export function PostList({
  posts,
  currentUserId,
  visibleCount,
  setVisibleCount,
  onDeletePost,
  onToggleReaction,
  showHeader = false,
  headerRightButton,
}: PostListProps) {
  const router = useRouter()

  return (
    <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6">
      {showHeader && (
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-sky-600 tracking-tight">TryLog</h1>
          {headerRightButton}
        </header>
      )}

      <main className="space-y-6">
        {posts.slice(0, visibleCount).map((post) => {
          const isOwnPost = currentUserId === post.user_id

          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-md p-4 sm:p-6 space-y-3 border border-gray-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {post.users?.image_url && (
                  <Image
                    src={post.users.image_url}
                    alt="icon"
                    width={40}
                    height={40}
                    className="rounded-full object-cover cursor-pointer"
                    onClick={() => router.push(`/users/${post.user_id}`)}
                  />
                )}
                <div>
                  <p
                    className="text-sm font-semibold cursor-pointer hover:underline"
                    onClick={() => router.push(`/users/${post.user_id}`)}
                  >
                    {post.users?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>

              {post.image_url && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <Image
                    key={post.users?.image_url}
                    src={post.image_url}
                    alt="投稿画像"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <button
                  onClick={() => router.push(`/posts/${post.id}/comments`)}
                  className="flex items-center gap-1 hover:underline text-sky-600"
                >
                  <MessageCircle size={16} /> コメントを見る ({post.commentCount ?? 0})
                </button>
              </div>

              {isOwnPost && onDeletePost && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => router.push(`/posts/edit/${post.id}`)}
                    className="text-sm bg-yellow-500 text-white hover:bg-yellow-600"
                  >
                    <Pencil size={16} className="mr-1" /> 編集
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm('この投稿を削除してもよろしいですか？')) {
                        onDeletePost(post.id)
                      }
                    }}
                    className="text-sm bg-red-500 text-white hover:bg-red-600"
                  >
                    <Trash2 size={16} className="mr-1" /> 削除
                  </Button>
                </div>
              )}

              {/* リアクション */}
              <div className="flex flex-wrap gap-2 mt-3">
                {REACTION_TYPES.map((type) => {
                    const reaction = post.reactions.find((r) => r.type === type)
                    const reacted = reaction?.reactedByUser ?? false

                    return (
                        <button
                        key={type}
                        onClick={() => {
                            if (!isOwnPost && currentUserId) onToggleReaction(post.id, type)
                        }}
                        disabled={isOwnPost || !currentUserId}
                        className={`px-3 py-1 text-sm rounded-xl border transition-all ${
                            reacted
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        } ${isOwnPost || !currentUserId ? 'cursor-not-allowed opacity-60 hover:bg-gray-100' : ''}`}
                        >
                        {type} {reaction?.count ? `(${reaction.count})` : ''}
                        </button>
                    )
                    })}
              </div>
            </div>
          )
        })}

        {visibleCount < posts.length && (
          <div className="mt-6 text-center">
            <Button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="text-sm bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-xl px-4 py-2"
            >
              もっと見る
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
