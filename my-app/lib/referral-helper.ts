// Referral Helper Functions

import { referralService } from './api/referral'

/**
 * Check and complete referral bonus after first transaction
 * Call this function after a user completes their first successful transaction
 *
 * @param userId - The ID of the user who just completed a transaction
 * @returns Promise<boolean> - true if referral was completed successfully, false otherwise
 */
export async function checkAndCompleteReferral(userId: string): Promise<boolean> {
  try {
    console.log(`[Referral Helper] Checking if user ${userId} has a pending referral...`)

    // Call the referral completion API
    const result = await referralService.completeReferral(userId)

    if (result.Success) {
      console.log(`[Referral Helper] ✓ Referral bonus awarded!`)
      console.log(`  - Referrer: ${result.ReferrerId} received $5`)
      console.log(`  - Referee: ${result.RefereeId} received $5`)
      return true
    } else {
      // This is not an error - just means user wasn't referred or already completed
      console.log(`[Referral Helper] No pending referral: ${result.Message}`)
      return false
    }
  } catch (error) {
    // Log error but don't throw - transaction should succeed even if referral bonus fails
    console.error('[Referral Helper] Error completing referral:', error)
    return false
  }
}

/**
 * Example usage in your deposit/transfer/exchange forms:
 *
 * ```typescript
 * const handleDeposit = async () => {
 *   // 1. Process the deposit
 *   const depositResult = await depositAPI.deposit(...)
 *
 *   if (depositResult.success) {
 *     // 2. Check if this triggers referral bonus (only first transaction counts)
 *     await checkAndCompleteReferral(userId)
 *
 *     // 3. Show success message
 *     toast({ title: 'Deposit successful!' })
 *   }
 * }
 * ```
 */
