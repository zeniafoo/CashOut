# Wallet API Integration Setup

## Configuration Complete ✅

Your wallet API has been successfully integrated into the CashOut app.

---

## Environment Variables

**File:** `.env.local`

```env
# User Authentication API
NEXT_PUBLIC_API_BASE_URL=https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI

# Wallet API
NEXT_PUBLIC_WALLET_API_BASE_URL=https://personal-v44qxubl.outsystemscloud.com/Deposit/rest/WalletAPI
```

---

## API Endpoints Being Called

### User Registration Flow

When a user registers, the app makes **two API calls**:

#### 1. Create User Account
**Endpoint:** `POST https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/Register`

**Request:**
```json
{
  "RequestData": {
    "Name": "John Doe",
    "Email": "john@example.com",
    "PhoneNumber": "+1234567890",
    "Password": "password123"
  }
}
```

**Expected Response:**
```json
{
  "Success": true,
  "Message": "User registered successfully",
  "UserId": "user-id-here",
  "ReferralCode": "ABC123"
}
```

#### 2. Create Wallet (Automatic)
**Endpoint:** `POST https://personal-v44qxubl.outsystemscloud.com/Deposit/rest/WalletAPI/CreateWallet`

**Request:**
```json
{
  "RequestData": {
    "UserId": "user-id-here",
    "Currency": "USD"
  }
}
```

**Expected Response:**
```json
{
  "Success": true,
  "Message": "Wallet created successfully",
  "WalletId": "wallet-id-here"
}
```

---

## Files Modified

1. **`.env.local`** - Added wallet API base URL
2. **`lib/api/wallet.ts`** - Created wallet service with custom API client
3. **`types/wallet.ts`** - Added wallet TypeScript types
4. **`contexts/AuthContext.tsx`** - Integrated wallet creation into registration

---

## How It Works

### Registration Flow:

```
User fills form
    ↓
POST /Register → Creates user account
    ↓
Success? → Get UserId
    ↓
POST /CreateWallet → Creates wallet with UserId
    ↓
Success? → Log "Wallet created successfully"
    ↓
Redirect to dashboard
```

### Error Handling:

- ✅ If user creation fails → Show error, stop process
- ✅ If user creation succeeds but wallet fails → User can still login (wallet can be created later)
- ✅ All errors are logged to browser console

---

## Testing

### 1. Start the app:
```bash
cd "c:\Users\brand\OneDrive\Documents\GitHub\CashOut\my-app"
npm run dev
```

### 2. Open browser:
```
http://localhost:3000/register
```

### 3. Register a new user

### 4. Check browser console (F12):
You should see:
```
[API Request] POST /Register
[Wallet API] Creating wallet for user: <userId>
[API Request] POST /CreateWallet
Wallet created successfully: <walletId>
```

---

## OutSystems Backend Requirements

### Your CreateWallet API must:

1. **Accept this request format:**
```json
{
  "RequestData": {
    "UserId": "string",
    "Currency": "string"
  }
}
```

2. **Return this response format:**
```json
{
  "Success": boolean,
  "Message": "string",
  "WalletId": "string"
}
```

3. **Handle CORS:** Allow requests from `http://localhost:3000` (development)

---

## Troubleshooting

### Issue: "Wallet creation failed"

**Check:**
1. Is your OutSystems wallet API running?
2. Does it accept the `/CreateWallet` endpoint?
3. Is CORS enabled for localhost?
4. Check browser console for detailed error messages

### Issue: "Network error"

**Check:**
1. Verify `.env.local` has the correct wallet API URL
2. Restart your dev server after changing `.env.local`
3. Check if the OutSystems environment is accessible

### Issue: "Empty response"

**Check:**
1. Your OutSystems API must return JSON
2. Ensure the REST API action has proper output structure
3. Check if the endpoint path is correct

---

## API Documentation Reference

Your OutSystems wallet API documentation:
https://personal-v44qxubl.outsystemscloud.com/Deposit/rest/WalletAPI/#/WalletAPI/CreateWallet

---

## Next Steps

If you need to add more wallet operations:
- **GetBalance**
- **Deposit**
- **Withdraw**
- **Transfer**

Simply add them to `lib/api/wallet.ts` using the `walletApi` client!
