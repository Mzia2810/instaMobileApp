import { API, graphqlOperation } from 'aws-amplify'
import * as reportMutations from '../../../../aws/graphql/mutations'
import * as reportQueries from '../../../../aws/graphql/queries'
import * as reportsubscriptions from '../../../../aws/graphql/subscriptions'
import { storageAPI } from '../../../media'
import { getUnixTimeStamp } from '../../../helpers/timeFormat'

export const fetchBlockedUsers = async (userID, nextToken, size = 1000) => {
  const res = await API.graphql(
    graphqlOperation(reportQueries.userReportsBySourceUser, {
      source: userID,
      limit: size,
      nextToken: nextToken,
      sortDirection: 'DESC',
    }),
  )

  if (!res.data?.userReportsBySourceUser.items) {
    return {
      items: [],
      nextToken: null,
    }
  }

  const userReportsBySourceUser = res.data?.userReportsBySourceUser

  const hydratedUserReports = userReportsBySourceUser.items?.map(async item => {
    item.user.profilePictureURL = await storageAPI.getFileLink(
      item.user.profilePictureKey,
    )

    return item
  })
  return {
    items: await Promise.all(hydratedUserReports),
    nextToken: userReportsBySourceUser.nextToken,
  }
}

export const markAbuse = async (sourceUserID, destUserID, abuseType) => {
  if (sourceUserID === destUserID) {
    return null
  }

  const desRes = await API.graphql(
    graphqlOperation(reportQueries.getUser, {
      id: destUserID,
    }),
  )

  if (!desRes.data?.getUser?.id) {
    return
  }

  const destUser = desRes.data.getUser

  const abuseItem = {
    id: sourceUserID + destUserID,
    dest: destUserID,
    source: sourceUserID,
    user: {
      id: destUserID,
      lastName: destUser.lastName,
      email: destUser.email,
      profilePictureURL: destUser.profilePictureURL,
      profilePictureKey: destUser.profilePictureKey,
      firstName: destUser.firstName,
    },
    type: abuseType,
    createdAt: getUnixTimeStamp(),
    updatedAt: getUnixTimeStamp(),
  }

  try {
    await API.graphql(
      graphqlOperation(reportMutations.createUserReport, {
        input: abuseItem,
      }),
    )

    const res1 = await API.graphql(
      graphqlOperation(reportMutations.onMarkedAbuse, {
        sourceUserID,
        destUserID,
      }),
    )

    return { success: true }
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

export const unblockUser = async (sourceUserID, destUserID) => {
  try {
    await API.graphql(
      graphqlOperation(reportMutations.deleteUserReport, {
        input: {
          id: sourceUserID + destUserID,
        },
      }),
    )

    return { success: true }
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

export const subscribeToReportedUsers = (userID, callback) => {
  const subscription = API.graphql(
    graphqlOperation(reportsubscriptions.onUserReportUpdate, {
      source: userID,
    }),
  ).subscribe({
    next: async ({ provider, value }) => {
      const item = { ...value.data.onUserReportUpdate }
      item.user.profilePictureURL = await storageAPI.getFileLink(
        item.user.profilePictureKey,
      )

      callback([item])
    },
    error: error => console.warn(error),
  })

  return () => subscription.unsubscribe()
}
