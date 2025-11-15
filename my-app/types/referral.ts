// Referral API Types

export interface ReferralInfo {
  ReferralCode: string
  TotalReferrals: number
  CompletedReferrals: number
  PendingReferrals: number
  TotalEarnings: number
}

export interface UseReferralCodeRequest {
  NewUserId: string
  ReferralCode: string
}

export interface UseReferralCodeResponse {
  Success: boolean
  Message: string
  ReferrerId: string
}

export interface CompleteReferralRequest {
  UserId: string
}

export interface CompleteReferralResponse {
  Success: boolean
  Message: string
  ReferrerId: string
  RefereeId: string
}

export interface GetReferralInfoResponse extends ReferralInfo {}
