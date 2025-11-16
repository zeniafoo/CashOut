# Referral System Documentation

## How It Works

### 1. User Signs Up with Referral Code
When a new user registers:
- They can optionally enter a referral code during registration
- The referral code is linked to an existing user (the referrer)
- A referral relationship is created with status "PENDING"

### 2. First Transaction Bonus (ONE-TIME)
When the new user (referee) completes their **FIRST transaction**:
- The system checks if they have a pending referral
- If yes, both users receive a **ONE-TIME $5 bonus**:
  - **Referrer** gets $5 added to their SGD wallet
  - **Referee** gets $5 added to their SGD wallet
- The referral status changes from "PENDING" to "COMPLETED"
- **Subsequent transactions do NOT trigger additional bonuses**

### 3. Earning More Referral Bonuses
To earn additional $5 bonuses:
- Users must **refer NEW people** using their referral code
- Each new person who completes their first transaction = another $5 bonus
- There is no limit to how many people you can refer

## Important Rules

✅ **One-time bonus**: Each referral relationship only pays out once
✅ **First transaction only**: Bonus is triggered by referee's first transaction
✅ **Both users benefit**: Both referrer and referee get $5 each
✅ **Unlimited referrals**: You can refer as many people as you want
✅ **Backend validation**: The OutSystems API ensures no duplicate bonuses

❌ **NOT** awarded for every transaction
❌ **NOT** awarded multiple times for the same referral
❌ **NOT** retroactive - only works for new signups with your code

## Technical Implementation

### Frontend Cache (localStorage)
- Tracks which users have been checked using localStorage
- Persists across browser sessions, page refreshes, and logins
- Prevents redundant API calls for users who already completed their referral
- **Survives logout/login** - prevents users from getting duplicate bonuses by re-logging in
- Cache is stored in browser's localStorage under key `referral_checked_users`
- Only cleared manually via `resetReferralCache()` (for testing purposes)

### Backend Validation
The OutSystems Referral API handles:
- Checking if referral is in "PENDING" status
- Preventing duplicate bonuses
- Updating wallet balances
- Changing referral status to "COMPLETED"

### API Responses
**Success** (bonus awarded):
```json
{
  "Success": true,
  "ReferrerId": "1234567890",
  "RefereeId": "0987654321",
  "Message": "Referral bonus awarded"
}
```

**Already Completed**:
```json
{
  "Success": false,
  "Message": "Referral already completed"
}
```

**No Referral**:
```json
{
  "Success": false,
  "Message": "No pending referral found"
}
```

## Code Location

- **Helper Function**: `/lib/referral-helper.ts`
- **API Service**: `/lib/api/referral.ts`
- **Usage**: Called in `deposit-form.tsx`, `transfer-form.tsx`, `exchange-form.tsx`

## Testing the Referral System

1. **Create User A** with a unique referral code
2. **Create User B** and use User A's referral code during signup
3. **User B makes their first transaction** (deposit/transfer/exchange)
4. **Check wallets**: Both User A and User B should have +$5 SGD
5. **User B makes another transaction**: No additional bonus
6. **User A refers User C**: User A gets another $5 when User C transacts

## Example Flow

```
User A (Referrer)
├─ Referral Code: ABC123
├─ Refers User B
│  └─ User B signs up with code ABC123
│     └─ User B makes first deposit → Both get $5 ✓
│     └─ User B makes second deposit → No bonus ✗
├─ Refers User C  
│  └─ User C signs up with code ABC123
│     └─ User C makes first transfer → Both get $5 ✓
└─ Total earnings: $10 (from 2 successful referrals)
```
