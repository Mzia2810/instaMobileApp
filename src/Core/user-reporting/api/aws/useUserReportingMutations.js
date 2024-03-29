import {
  markAbuse as markAbuseAPI,
  unblockUser as unblockUserAPI,
} from './awsUserReportingClient'

const useUserReportingMutations = () => {
  const markAbuse = async (sourceUserID, destUserID, abuseType) => {
    return await markAbuseAPI(sourceUserID, destUserID, abuseType)
  }
  const unblockUser = async (sourceUserID, destUserID) => {
    return await unblockUserAPI(sourceUserID, destUserID)
  }

  return { markAbuse, unblockUser }
}

export default useUserReportingMutations
