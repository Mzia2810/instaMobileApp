import { useState, useEffect, useRef } from 'react'
import {
  fetchBlockedUsers as fetchBlockedUsersAPI,
  subscribeToReportedUsers as subscribeToReportedUsersAPI,
} from './awsUserReportingClient'

const useUserReporting = userID => {
  const [blockedUsers, setBlockedUsers] = useState(null)
  const [isLoadingMore, setIsLoadingMore] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const pagination = useRef({ size: 25, exhausted: false })

  useEffect(() => {
    if (!userID) {
      return
    }
    const unsubscribe = subscribeToReportedUsers()
    return () => {
      unsubscribe && unsubscribe()
    }
  }, [userID])

  const subscribeToReportedUsers = () => {
    loadMoreReportedUsers()
    return subscribeToReportedUsersAPI(userID, users => {
      setBlockedUsers(deduplicatedReportedUsers(users))
    })
  }

  const loadReportedUsers = async userID => {
    if (pagination.current.exhausted) {
      return
    }
    const res = await fetchBlockedUsersAPI(
      userID,
      pagination.current.nextToken,
      pagination.current.size,
    )
    if (res?.length === 0) {
      pagination.current.exhausted = true
    }
    pagination.current.nextToken = res.nextToken

    return res.items
  }

  const loadMoreReportedUsers = async () => {
    if (pagination.current.exhausted) {
      return
    }
    const res = await loadReportedUsers(userID)

    setBlockedUsers(preBlockedUsers =>
      deduplicatedReportedUsers(preBlockedUsers, res),
    )
  }

  const deduplicatedReportedUsers = (oldBlockedUsers, newBlockedUsers) => {
    if (!newBlockedUsers?.length) {
      return oldBlockedUsers || []
    }
    const all = oldBlockedUsers
      ? [...oldBlockedUsers, ...newBlockedUsers]
      : newBlockedUsers
    return all.reduce((acc, curr) => {
      if (!acc.some(friend => friend.id === curr.id)) {
        acc.push(curr)
      }
      return acc
    }, [])
  }

  const pullToRefresh = async userID => {
    setRefreshing(true)
    pagination.current.nextToken = null
    pagination.current.exhausted = false

    const res = await loadReportedUsers(userID)
    setRefreshing(false)
    setBlockedUsers(deduplicatedReportedUsers([], res))
  }

  return {
    blockedUsers,
    isLoadingMore,
    refreshing,
    pullToRefresh,
    subscribeToReportedUsers,
    loadMoreReportedUsers,
  }
}

export default useUserReporting
