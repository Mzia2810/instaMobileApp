const graphqlQuery = require('../graphql/queries')
const gql = require('graphql-tag')
const { getFriendshipType, getMutualFrienship, fetchUser } = require('./common')

exports.fetchProfile = async event => {
  const viewerID = event.arguments.viewerID
  const profileID = event.arguments.profileID

  try {
    const res = await onFetchProfile(viewerID, profileID)
    return res
  } catch (err) {
    return err
  }
}

const onFetchProfile = async (viewerID, profileID) => {
  // Profile Data
  const profile = await fetchUser(profileID)
  var result = { user: profile, success: true }


  // Button Action Data
  if (profileID === viewerID) {
    // This is my profile (user looking at their own profile)
    result = { ...result, actionButtonType: 'settings' }
  } else {
    // This is someone else's profile - we show either "Send Message" or "Add / Follow" button
    let query = gql(graphqlQuery.friendshipsBySourceUser)
    const res = await getFriendshipType(query, viewerID, profileID)

    let alreadyAdded = res['friendshipsBySourceUser']?.items?.length
    if (alreadyAdded) {
      // This user is already a friend of the profile user. so show DM button
      result = { ...result, actionButtonType: 'message' }
    } else {
      // This user is not a friend of the profile user. so show Add / Follow button
      result = { ...result, actionButtonType: 'add' }
    }
  }

  return { profileData: result, success: true }
}
