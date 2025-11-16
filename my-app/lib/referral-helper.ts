// Referral Helper Functions

import { referralService } from './api/referral'

const REFERRAL_CACHE_KEY = 'referral_checked_users'

/**
 * Load checked users from localStorage
 */
function loadCheckedUsers(): Set<string> {
  if (typeof window === 'undefined') return new Set()

  try {
    const stored = localStorage.getItem(REFERRAL_CACHE_KEY)
    if (stored) {
      const users = JSON.parse(stored) as string[]
      return new Set(users)
    }
  } catch (error) {
    console.error('[Referral Helper] Error loading cache:', error)
  }

  return new Set()
}

/**
 * Save checked users to localStorage
 */
function saveCheckedUsers(users: Set<string>): void {
  if (typeof window === 'undefined') return

  try {
    const usersArray = Array.from(users)
    localStorage.setItem(REFERRAL_CACHE_KEY, JSON.stringify(usersArray))
  } catch (error) {
    console.error('[Referral Helper] Error saving cache:', error)
  }
}

/**
 * Check and complete referral bonus after first transaction
 * Call this function after a user completes their first successful transaction
 *
 * IMPORTANT: This only triggers the $5 bonus ONCE when the referee completes their first transaction.
 * Both the referrer and referee each receive $5 only once.
 * The backend handles the logic to ensure bonuses are not duplicated.
 * The frontend uses localStorage to persist the cache across sessions.
 *
 * @param userId - The ID of the user who just completed a transaction
 * @returns Promise<boolean> - true if referral was completed successfully, false otherwise
 */
export async function checkAndCompleteReferral(userId: string): Promise<boolean> {
  try {
    // Load checked users from localStorage
    const checkedUsers = loadCheckedUsers()

    // Skip if we've already checked this user (persisted across sessions)
    // This prevents unnecessary API calls for users who have already completed their referral
    if (checkedUsers.has(userId)) {
      console.log(`[Referral Helper] Already checked referral for user ${userId} (persisted), skipping...`)
      return false
    }

    console.log(`[Referral Helper] Checking if user ${userId} has a pending referral...`)

    // Call the referral completion API
    const result = await referralService.completeReferral(userId)

    // Mark this user as checked regardless of result to avoid redundant calls
    checkedUsers.add(userId)
    saveCheckedUsers(checkedUsers)

    if (result.Success) {
      console.log(`[Referral Helper] ✓ Referral bonus awarded!`)
      console.log(`  - Referrer: ${result.ReferrerId} received $5`)
      console.log(`  - Referee: ${result.RefereeId} received $5`)
      console.log(`  - This is a ONE-TIME bonus for the first transaction`)
      console.log(`  - User ${userId} marked as checked (persisted to localStorage)`)
      return true
    } else {
      // This is not an error - just means user wasn't referred or already completed
      console.log(`[Referral Helper] No pending referral: ${result.Message}`)
      console.log(`  - User ${userId} marked as checked to prevent future API calls`)
      return false
    }
  } catch (error) {
    // Log error but don't throw - transaction should succeed even if referral bonus fails
    console.error('[Referral Helper] Error completing referral:', error)
    // Mark as checked even on error to avoid retrying
    const checkedUsers = loadCheckedUsers()
    checkedUsers.add(userId)
    saveCheckedUsers(checkedUsers)
    return false
  }
}

/**
 * Reset the checked users cache (useful for testing)
 * NOTE: This should NOT be called on logout - the cache should persist
 * across sessions to prevent duplicate bonuses
 */
export function resetReferralCache(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(REFERRAL_CACHE_KEY)
    console.log('[Referral Helper] Cache cleared from localStorage')
  } catch (error) {
    console.error('[Referral Helper] Error clearing cache:', error)
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
 *
 * IMPORTANT NOTES:
 * - The referral bonus is ONLY awarded ONCE when a new user completes their FIRST transaction
 * - Both the referrer and referee receive $5 each (one-time)
 * - Subsequent transactions do NOT trigger additional bonuses
 * - To earn more referral bonuses, the user must refer NEW people
 * - The backend API ensures no duplicate bonuses are awarded
 * - The frontend cache prevents redundant API calls within the same session
 */
