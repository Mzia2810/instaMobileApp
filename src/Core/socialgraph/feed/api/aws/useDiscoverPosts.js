import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { listDiscoverFeedPosts as listDiscoverFeedPostsAPI } from './awsFeedClient'
import { useReactions } from './useReactions'
import { hydratePostsWithMyReactions } from '../utils'

const batchSize = 25

export const useDiscoverPosts = () => {
  const [posts, setPosts] = useState(null)
  const [isLoadingBottom, setIsLoadingBottom] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { handleFeedReaction } = useReactions(setPosts)

  const pagination = useRef({ size: batchSize, exhausted: false })

  const locallyDeletedPosts = useSelector(
    state => state.feed.locallyDeletedPosts ?? [],
  )

  useEffect(() => {
    if (posts?.length && locallyDeletedPosts?.length) {
      const hydrateDeletedPosts = posts.filter(post => {
        !locallyDeletedPosts.includes(post.id)
      })
      setPosts(hydrateDeletedPosts)
    }
  }, [JSON.stringify(locallyDeletedPosts)])

  const loadPosts = async userID => {
    if (pagination.current.exhausted) {
      return
    }
    const res = await listDiscoverFeedPostsAPI(
      userID,
      pagination.current.nextToken,
      pagination.current.size,
    )

    if (res?.items?.length === 0) {
      pagination.current.exhausted = true
    }
    pagination.current.nextToken = res.nextToken

    return res.items
  }

  const loadMorePosts = async (userID, loadBottom = true) => {
    loadBottom && setIsLoadingBottom(true)
    const newPosts = await loadPosts(userID)

    loadBottom && setIsLoadingBottom(false)
    setPosts(oldPosts =>
      hydratePostsWithMyReactions(
        deduplicatedPosts(oldPosts, newPosts, true),
        userID,
      ),
    )
  }

  const pullToRefresh = async userID => {
    setRefreshing(true)
    pagination.current.nextToken = undefined
    pagination.current.exhausted = false

    const newPosts = await loadMorePosts(userID, false)

    setRefreshing(false)
    setPosts(oldPosts =>
      hydratePostsWithMyReactions(
        deduplicatedPosts(oldPosts, newPosts, true),
        userID,
      ),
    )
  }

  const addReaction = async (post, author, reaction) => {
    await handleFeedReaction(post, reaction, author)
  }

  const deduplicatedPosts = (oldPosts, newPosts, appendToBottom) => {
    if (!newPosts?.length) {
      return oldPosts || []
    }
    const all = oldPosts
      ? appendToBottom
        ? [...oldPosts, ...newPosts]
        : [...newPosts, ...oldPosts]
      : newPosts
    const deduplicatedPosts = all?.reduce((acc, curr) => {
      if (!acc.some(post => post.id === curr.id)) {
        acc.push(curr)
      }
      return acc
    }, [])

    return deduplicatedPosts || []
  }

  return {
    batchSize,
    posts,
    refreshing,
    isLoadingBottom,
    loadMorePosts,
    pullToRefresh,
    addReaction,
  }
}
