# QR Payment with Wallet Deduction - Complete Implementation

## Overview

The QR payment feature now includes complete wallet integration with balance checking and automatic deduction before transferring to the external TBank account.

## Payment Flow (Updated)

```
1. User scans QR code → Merchant details auto-fill
2. User enters amount and note
3. User clicks "Confirm Transfer"
   ↓
4. Frontend validates user is logged in
   ↓
5. Backend checks SGD wallet balance
   ↓
6. If insufficient → Show error, stop process
   ↓
7. If sufficient → Deduct amount from user's wallet
   ↓
8. Transfer to external TBank account
   ↓
9. If TBank fails → Show error (amount already deducted)
   ↓
10. If TBank succeeds → Show success, redirect to dashboard
```

## Implementation Details

### 1. API Endpoint: `/api/external-payment` ([route.ts](my-app/app/api/external-payment/route.ts))

**Request Body:**
```json
{
  "accountId": "0000005637",
  "amount": 100.00,
  "narrative": "QR Payment",
  "transactionId": "TXN1234567890",
  "userId": "USR_08837c05-1183-43da-a87d-2f4265840994",
  "currencyCode": "SGD"
}
```

**Process:**

**Step 1: Check Wallet Balance**
- Calls: `GET /wallets/{userId}/{currencyCode}`
- Validates wallet exists
- Checks if `currentBalance >= amount`
- Returns 400 error if insufficient

**Step 2: Deduct from Wallet**
- Calls: `PUT /UpdateWallet`
- Body: `{ UserId, CurrencyCode, Amount: -amount }`
- Negative amount deducts from balance
- Returns error if deduction fails

**Step 3: Transfer to TBank**
- Calls: `PUT https://smuedu-dev.outsystemsenterprise.com/gateway/rest/account/0000002578/DepositCash`
- Uses Basic Auth with TBank credentials
- Body: `{ consumerId: "0", transactionId, accountId, amount, narrative }`
- If fails: Amount already deducted, shows error message

**Response (Success):**
```json
{
  "success": true,
  "transactionId": "TXN1234567890",
  "message": "Payment processed successfully",
  "tbankResponse": "..."
}
```

**Response (Insufficient Balance):**
```json
{
  "error": "Insufficient balance",
  "currentBalance": 50.00,
  "requiredAmount": 100.00
}
```

### 2. Transfer Form ([transfer-form.tsx](my-app/components/transfer-form.tsx:89-140))

**Key Changes:**
- Added `useAuth()` hook to get current user
- Validates `user.UserId` exists before payment
- Passes `userId` and `currencyCode` to API
- Handles insufficient balance error with specific message
- Shows user-friendly error messages

**Error Handling:**
```typescript
// Insufficient balance
toast({
  title: "Insufficient Balance",
  description: `You need ${currency} ${amount} but only have ${currency} ${currentBalance}`
})

// General payment failure
toast({
  title: "Payment Failed",
  description: responseData.error
})
```

### 3. Environment Variables ([.env](my-app/.env))

```env
# Wallet API (for balance check and deduction)
NEXT_PUBLIC_WALLET_API_BASE_URL=https://personal-v44qxubl.outsystemscloud.com/Deposit/rest/WalletAPI

# TBank API (for external transfer)
TBANK_USERNAME=12173e30ec556fe4a951
TBANK_API_PASSWORD=2fbbd75fd60a8389b82719d2dbc37f1eb9ed226f3eb43cfa7d9240c72fd5+bfc89ad4-c17f-4fe9-82c2-918d29d59fe0
TBANK_TARGET_ACCOUNT_ID=0000002578
```

## API Integrations

### OutSystems Wallet API

**Check Balance:**
```
GET /wallets/{userId}/{currencyCode}
Response: { Success: true, Wallet: { Balance: 1000.00, CurrencyCode: "SGD", ... } }
```

**Deduct Amount:**
```
PUT /UpdateWallet
Body: { UserId: "USR_xxx", CurrencyCode: "SGD", Amount: -100.00 }
Response: { Success: true, NewBalance: 900.00, Message: "Wallet updated" }
```

### TBank External API

**Deposit to External Account:**
```
PUT /gateway/rest/account/0000002578/DepositCash
Headers: Authorization: Basic {credentials}
Body: {
  "consumerId": "0",
  "transactionId": "TXN1234567890",
  "accountId": "0000005637",
  "amount": 100.00,
  "narrative": "QR Payment"
}
```

## Currency Handling

- **User can select any currency** in the form dropdown (SGD, USD, MYR, KRW, JPY)
- **Backend uses selected currency** for wallet deduction
- **TBank API receives the same amount** in the selected currency
- **For demo purposes**: Only SGD is fully supported by TBank external account

## Error Scenarios

### 1. Insufficient Balance
```
User has: SGD 50.00
User wants to pay: SGD 100.00
Result: Payment blocked, show error message
```

### 2. Wallet Deduction Fails
```
Balance check passes → Deduction fails
Result: Payment stopped, no amount transferred
```

### 3. TBank Transfer Fails
```
Balance check passes → Deduction succeeds → TBank fails
Result: Amount deducted from user wallet but not transferred
Action: Show error message asking user to contact support
Note: In production, implement refund mechanism
```

### 4. User Not Logged In
```
User tries to pay without authentication
Result: Redirect to login page
```

## Testing

### Test Scenario 1: Successful Payment
1. Login with test account
2. Ensure SGD wallet has sufficient balance (e.g., 1000 SGD)
3. Scan QR code
4. Enter amount: 100.00
5. Click "Confirm Transfer"
6. ✓ Wallet deducts 100 SGD
7. ✓ TBank receives 100 SGD
8. ✓ Success message shown
9. ✓ Redirects to dashboard

### Test Scenario 2: Insufficient Balance
1. Login with test account
2. Check SGD balance (e.g., 50 SGD)
3. Scan QR code
4. Enter amount: 100.00
5. Click "Confirm Transfer"
6. ✓ Error shown: "Insufficient Balance"
7. ✓ No deduction occurs
8. ✓ User remains on transfer page

### Test Scenario 3: Different Currency
1. Login with test account
2. Scan QR code
3. Select currency: USD
4. Enter amount: 100.00
5. Click "Confirm Transfer"
6. ✓ Deducts from USD wallet
7. ✓ Sends 100 USD to TBank
8. Note: TBank may reject non-SGD currencies

## Console Logs for Debugging

The API endpoint logs each step:
```
[Payment] Step 1: Checking SGD wallet balance for user USR_xxx
[Payment] Current SGD balance: 1000.00
[Payment] Step 2: Deducting 100.00 SGD from user wallet
[Payment] ✓ Wallet deducted successfully. New balance: 900.00
[Payment] Step 3: Transferring to TBank external account
[Payment] Calling TBank API: https://smuedu-dev.outsystemsenterprise.com/...
[Payment] Payload: { consumerId: "0", ... }
[Payment] ✓ TBank transfer successful: ...
```

## Known Limitations & Future Improvements

### Current Limitations:
1. **No automatic refund**: If TBank fails after wallet deduction, manual refund required
2. **Currency mismatch**: TBank only accepts SGD (demo limitation)
3. **No transaction history**: Payments aren't logged in database
4. **Single merchant**: Only supports fixed external account

### Recommended Improvements:
1. **Implement refund mechanism**: Auto-refund if TBank transfer fails
2. **Transaction logging**: Store all payment attempts in database
3. **Multi-merchant support**: Support dynamic merchant accounts
4. **Receipt generation**: Email/download payment receipt
5. **Payment confirmation screen**: Show details before final confirmation
6. **Balance display**: Show current balance in transfer form
7. **Currency conversion**: Handle SGD-only limitation with auto-conversion
8. **Retry logic**: Retry TBank transfer on temporary failures
9. **Webhook notifications**: Real-time payment status updates
10. **Admin dashboard**: Monitor failed payments and manual refunds

## Security Considerations

✅ **Implemented:**
- User authentication required
- Balance validation before deduction
- Server-side API calls (credentials not exposed to client)
- Transaction ID generation for traceability
- Input validation (amount > 0, required fields)

⚠️ **Consider Adding:**
- Rate limiting on payment endpoint
- Transaction amount limits
- Two-factor authentication for large amounts
- Payment confirmation via SMS/email
- Fraud detection patterns
- IP whitelisting for TBank API

## Support & Troubleshooting

### Payment Fails with "Insufficient Balance"
- Check user's wallet balance in dashboard
- Verify correct currency selected
- Ensure amount includes any fees (currently free)

### Payment Deducted but TBank Shows Error
- Contact support immediately
- Provide transaction ID
- Manual investigation required
- Potential refund needed

### "Authentication Required" Error
- User session expired
- Re-login required
- Check AuthContext provider wraps component

### "Wallet not found" Error
- User's wallet for selected currency doesn't exist
- Create wallet first (should auto-create on registration)
- Check wallet API connectivity

---

**Implementation Status:** ✅ Complete and Ready for Testing

**Last Updated:** 2025-11-15

**Key Files Modified:**
- [my-app/app/api/external-payment/route.ts](my-app/app/api/external-payment/route.ts)
- [my-app/components/transfer-form.tsx](my-app/components/transfer-form.tsx)
- [my-app/.env](my-app/.env)
