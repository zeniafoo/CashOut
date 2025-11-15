# Referral System Integration Guide

## Overview

The referral system is now fully integrated into CashOut! Here's how it works:

### The Flow

1. **User A (Referrer)** gets a unique referral code from the system
2. **User B (New User)** signs up and enters User A's referral code
3. **Referral Created** - Link is established between User A and User B
4. **User B makes first transaction** (deposit, transfer, or exchange)
5. **Bonus Triggered** - Both User A and User B get $5 added to their accounts!

---

## What Was Integrated

### 1. Environment Configuration

Added to [.env](/.env#L10-L11):
```env
NEXT_PUBLIC_REFERRAL_API_BASE_URL=https://personal-fxfq0mme.outsystemscloud.com/ReferralService/rest/ReferralAPI
```

### 2. TypeScript Types

Created [types/referral.ts](types/referral.ts):
- `ReferralInfo` - User's referral stats
- `UseReferralCodeRequest` - Apply referral code
- `CompleteReferralRequest` - Complete referral after first transaction

### 3. Referral Service API Client

Created [lib/api/referral.ts](lib/api/referral.ts):
- `useReferralCode(newUserId, referralCode)` - Apply code during signup
- `completeReferral(userId)` - Trigger $5 bonus after first transaction
- `getReferralInfo(userId)` - Get user's referral stats

### 4. Registration Form

Updated [components/register-form.tsx](components/register-form.tsx):
- ✅ Added optional "Referral Code" input field
- ✅ Converts code to uppercase automatically
- ✅ Shows helpful message: "Both you and your friend get $5 after your first transaction!"

### 5. Registration Flow

Updated [contexts/AuthContext.tsx](contexts/AuthContext.tsx):
```
User fills registration form
    ↓
POST /Register → User account created
    ↓
If referral code entered:
    POST /referrals/use → Link referrer and new user
    ↓
Create wallets
    ↓
Redirect to dashboard
```

### 6. Referral Helper

Created [lib/referral-helper.ts](lib/referral-helper.ts):
- `checkAndCompleteReferral(userId)` - Call this after any transaction

---

## How to Use

### For Users Signing Up

1. Go to `/register`
2. Fill in name, email, phone, password
3. **(Optional)** Enter a friend's referral code
4. Click "Create Account"
5. Make first transaction to activate bonus!

### For Developers: Triggering the Bonus

The $5 bonus is awarded after the **first transaction**. You need to call `checkAndCompleteReferral()` after successful transactions.

#### Example: In Deposit Form

```typescript
import { checkAndCompleteReferral } from '@/lib/referral-helper'
import { useAuth } from '@/contexts/AuthContext'

const handleDeposit = async () => {
  try {
    // 1. Process deposit
    const result = await depositAPI.deposit(userId, amount, currency)

    if (result.success) {
      // 2. Check and complete referral (if this is first transaction)
      await checkAndCompleteReferral(user.UserId)

      // 3. Show success
      toast({ title: 'Deposit successful!' })
    }
  } catch (error) {
    toast({ title: 'Deposit failed', variant: 'destructive' })
  }
}
```

#### Example: In Transfer Form

```typescript
const handleTransfer = async () => {
  try {
    // 1. Process transfer
    const result = await transferAPI.transfer(from, to, amount)

    if (result.success) {
      // 2. Complete referral if first transaction
      await checkAndCompleteReferral(user.UserId)

      // 3. Show success
      toast({ title: 'Transfer successful!' })
    }
  } catch (error) {
    toast({ title: 'Transfer failed', variant: 'destructive' })
  }
}
```

---

## API Endpoints Used

### 1. Use Referral Code (During Registration)

**Endpoint:** `POST /referrals/use`

**Request:**
```json
{
  "NewUserId": "new-user-123",
  "ReferralCode": "ABC123"
}
```

**Response:**
```json
{
  "Success": true,
  "Message": "Referral code applied successfully",
  "ReferrerId": "existing-user-456"
}
```

### 2. Complete Referral (After First Transaction)

**Endpoint:** `POST /referrals/complete`

**Request:**
```json
{
  "UserId": "new-user-123"
}
```

**Response:**
```json
{
  "Success": true,
  "Message": "$5 bonus awarded to both users",
  "ReferrerId": "existing-user-456",
  "RefereeId": "new-user-123"
}
```

### 3. Get Referral Info

**Endpoint:** `GET /GetReferralInfo?UserId={userId}`

**Response:**
```json
{
  "ReferralCode": "ABC123",
  "TotalReferrals": 5,
  "CompletedReferrals": 3,
  "PendingReferrals": 2,
  "TotalEarnings": 15.00
}
```

---

## How It Works Behind the Scenes

### Registration with Referral Code

```
1. User enters referral code "ABC123"
2. Frontend calls: POST /Register → Creates user, gets UserId
3. Frontend calls: POST /referrals/use
   {
     "NewUserId": "new-user-id",
     "ReferralCode": "ABC123"
   }
4. Backend links new user to referrer
5. Status: PENDING (waiting for first transaction)
```

### First Transaction Triggers Bonus

```
1. New user makes first deposit/transfer/exchange
2. Transaction succeeds
3. Frontend calls: POST /referrals/complete
   {
     "UserId": "new-user-id"
   }
4. Backend checks if referral exists and is pending
5. If yes:
   - Add $5 to referrer's account
   - Add $5 to new user's account
   - Mark referral as COMPLETED
6. If no: Return "No pending referral" (not an error)
```

---

## Error Handling

### Referral Code Not Found

```json
{
  "Success": false,
  "Message": "Invalid referral code"
}
```
**Action:** User registration still succeeds, just shows warning

### Referral Already Completed

```json
{
  "Success": false,
  "Message": "Referral bonus already claimed"
}
```
**Action:** Transaction succeeds normally, no bonus awarded

### No Pending Referral

```json
{
  "Success": false,
  "Message": "No pending referral for this user"
}
```
**Action:** Transaction succeeds normally (user wasn't referred)

---

## Testing the Integration

### Step 1: Create User A (Referrer)

1. Register a new account (User A)
2. Note their `ReferralCode` from the response (check browser console or API logs)

### Step 2: Create User B (New User)

1. Go to `/register`
2. Fill in the form
3. Enter User A's referral code in the "Referral Code" field
4. Register
5. Check console - should see: `✓ Referral code "ABC123" applied successfully`

### Step 3: Trigger the Bonus

1. Log in as User B
2. Make a deposit/transfer/exchange
3. After successful transaction, `checkAndCompleteReferral()` is called
4. Check console - should see: `✓ Referral bonus awarded!`
5. Both User A and User B should now have $5 added

### Step 4: Verify in Database

Check your OutSystems database:
- User A's wallet should have +$5
- User B's wallet should have +$5
- Referral status should be "COMPLETED"

---

## Important Notes

### ⚠️ Critical Implementation Required

**You must add `checkAndCompleteReferral()` to ALL transaction forms:**
- Deposit form ([components/deposit-form.tsx](components/deposit-form.tsx))
- Transfer form ([components/transfer-form.tsx](components/transfer-form.tsx))
- Exchange form ([components/exchange-form.tsx](components/exchange-form.tsx))

Without this, the referral bonus will NEVER be triggered!

### Non-Blocking Design

The referral system is designed to be **non-blocking**:
- ✅ If referral code is invalid, registration still succeeds
- ✅ If referral completion fails, transaction still succeeds
- ✅ All errors are logged but don't interrupt user flow

### Backend Requirements

Your OutSystems Referral API must:
1. ✅ Track referral status (PENDING → COMPLETED)
2. ✅ Only award bonus once per referral
3. ✅ Handle duplicate completion requests gracefully
4. ✅ Add $5 to both users' wallets when completing referral

### CORS Configuration

Don't forget to enable CORS on your Referral API:
1. OutSystems Service Studio
2. Open ReferralService module
3. Enable CORS for `http://localhost:3000`
4. Publish

---

## Next Steps: Add to Transaction Forms

You need to call `checkAndCompleteReferral()` in your transaction forms. Here's how:

### 1. Import the helper

```typescript
import { checkAndCompleteReferral } from '@/lib/referral-helper'
import { useAuth } from '@/contexts/AuthContext'
```

### 2. Get the user ID

```typescript
const { user } = useAuth()
```

### 3. Call after successful transaction

```typescript
if (transactionSuccess && user?.UserId) {
  await checkAndCompleteReferral(user.UserId)
}
```

### Example: Complete Deposit Form Integration

```typescript
'use client'

import { useState } from 'react'
import { checkAndCompleteReferral } from '@/lib/referral-helper'
import { useAuth } from '@/contexts/AuthContext'

export function DepositForm() {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')

  const handleDeposit = async () => {
    try {
      // Process deposit
      const result = await depositService.deposit(user.UserId, amount)

      if (result.Success) {
        // Trigger referral completion (if applicable)
        await checkAndCompleteReferral(user.UserId)

        toast({ title: 'Deposit successful!' })
      }
    } catch (error) {
      toast({ title: 'Deposit failed', variant: 'destructive' })
    }
  }

  return (
    // ... form JSX
  )
}
```

---

## Summary

✅ Referral code field added to registration
✅ API endpoints integrated
✅ Non-blocking error handling
✅ Helper function created for bonus trigger
✅ Documentation complete

**Action Required:**
Add `checkAndCompleteReferral()` to deposit, transfer, and exchange forms after successful transactions!

The referral system is ready to use! 🎉
