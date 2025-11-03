# Updated API Integration Guide

## Your Actual OutSystems API Structure

Based on your OutSystems API documentation, here's what was updated:

### API Response Structures

#### 1. Login API
```
POST /Login

Request Body:
{
  "RequestData": {
    "Email": "user@example.com",
    "Password": "password123"
  }
}

Response (200):
{
  "Success": true,
  "Message": "Login successful",
  "UserId": "123",
  "Name": "John Doe",
  "ReferralCode": "ABC123"
}
```

**Key Differences:**
- ✅ No separate `Token` field (using `UserId` as auth identifier)
- ✅ `Email` and `PhoneNumber` NOT returned in response
- ✅ Returns `ReferralCode` instead

#### 2. Register API
```
POST /Register

Request Body:
{
  "RequestData": {
    "Name": "John Doe",
    "Email": "user@example.com",
    "PhoneNumber": "+1234567890",
    "Password": "password123"
  }
}

Response (200):
{
  "Success": true,
  "Message": "Registration successful",
  "UserId": "123",
  "ReferralCode": "ABC123"
}
```

**Key Differences:**
- ✅ No separate `Token` field
- ✅ Returns only `UserId` and `ReferralCode`
- ✅ User details not echoed back in response

#### 3. GetUser API
```
GET /GetUser?UserId={UserId}

Response (200):
{
  "Found": true,
  "Name": "John Doe",
  "Email": "user@example.com",
  "PhoneNumber": "+1234567890",
  "ReferralCode": "ABC123"
}
```

**Key Differences:**
- ✅ Uses `Found` instead of `Success`
- ✅ Returns user details directly (not nested in a `User` object)

## What Was Updated in Frontend

### 1. TypeScript Types ([types/auth.ts](types/auth.ts))

Updated to match your exact API structure:

```typescript
export interface LoginResponse {
  Success: boolean
  Message: string
  UserId: string
  Name: string
  ReferralCode: string
}

export interface RegisterResponse {
  Success: boolean
  Message: string
  UserId: string
  ReferralCode: string
}

export interface GetUserResponse {
  Found: boolean  // Not "Success"
  Name: string
  Email: string
  PhoneNumber: string
  ReferralCode: string
}

export interface User {
  UserId: string
  Name: string
  Email: string
  PhoneNumber: string
  ReferralCode?: string
}
```

### 2. Authentication Service ([lib/api/auth.ts](lib/api/auth.ts))

**Login Function:**
- Stores `UserId` as the auth token (since no separate token is provided)
- Builds a `User` object from the response
- Stores email from the login request (since API doesn't return it)

**Register Function:**
- Stores `UserId` as the auth token
- Builds a `User` object from both request and response data

**GetUser Function:**
- Checks `Found` instead of `Success`
- Returns a `User` object built from the response fields

### 3. Auth Context ([contexts/AuthContext.tsx](contexts/AuthContext.tsx))

Updated to:
- Check for `response.UserId` instead of `response.Token`
- Get user data from localStorage after login/register

## How Authentication Works Now

### Session Management

Since your API doesn't return a JWT token, we use the `UserId` as the authentication identifier:

```typescript
// On successful login/register:
localStorage.setItem('authToken', response.UserId)  // UserId used as token
localStorage.setItem('user', JSON.stringify(userObject))

// To check if authenticated:
const isAuthenticated = !!localStorage.getItem('authToken')

// To get current user:
const user = JSON.parse(localStorage.getItem('user'))
```

### Security Note

⚠️ **Important:** Using `UserId` as the only authentication method is **not secure** for production. Consider implementing:

1. **Session tokens** - Generate a unique session token on login
2. **JWT tokens** - Implement JWT-based authentication
3. **Session expiration** - Tokens should expire after a period
4. **Token refresh** - Implement refresh token mechanism

For now, this works for development/testing purposes.

## Testing the Integration

### 1. Test Registration

```bash
curl -X POST "https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/Register" \
  -H "Content-Type: application/json" \
  -d '{
    "RequestData": {
      "Name": "Test User",
      "Email": "test@example.com",
      "PhoneNumber": "+1234567890",
      "Password": "password123"
    }
  }'
```

**Expected Response:**
```json
{
  "Success": true,
  "Message": "Registration successful",
  "UserId": "some-unique-id",
  "ReferralCode": "ABC123"
}
```

### 2. Test Login

```bash
curl -X POST "https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/Login" \
  -H "Content-Type: application/json" \
  -d '{
    "RequestData": {
      "Email": "test@example.com",
      "Password": "password123"
    }
  }'
```

**Expected Response:**
```json
{
  "Success": true,
  "Message": "Login successful",
  "UserId": "some-unique-id",
  "Name": "Test User",
  "ReferralCode": "ABC123"
}
```

### 3. Test GetUser

```bash
curl "https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/GetUser?UserId=some-unique-id"
```

**Expected Response:**
```json
{
  "Found": true,
  "Name": "Test User",
  "Email": "test@example.com",
  "PhoneNumber": "+1234567890",
  "ReferralCode": "ABC123"
}
```

## Try It Now!

1. **Start your dev server:**
   ```bash
   cd /Users/zenia/Documents/GitHub/CashOut/my-app
   npm run dev
   ```

2. **Open browser console** (F12) to see API logs

3. **Register a new account:**
   - Go to `http://localhost:3000/register`
   - Fill in the form
   - Click "Create Account"
   - Check console for:
     ```
     [API Request] { method: "POST", url: "...Register" }
     [API Response] { status: 200, contentType: "application/json" }
     [API Response Text] {"Success":true,"UserId":"..."}
     ```

4. **Login with existing account:**
   - Go to `http://localhost:3000`
   - Enter email and password
   - Click "Sign in"
   - Should redirect to `/dashboard`

5. **Check stored data:**
   - Open browser DevTools > Application > Local Storage
   - Should see:
     - `authToken`: Your UserId
     - `user`: JSON object with user details

## What to Expect

### Success Flow:
1. User enters credentials
2. API returns `Success: true` with `UserId`
3. Frontend stores `UserId` and user data
4. Redirects to dashboard
5. Dashboard shows user's name and email
6. User can navigate to protected pages

### Error Flow:
1. User enters invalid credentials
2. API returns `Success: false` with error `Message`
3. Frontend shows error toast with the message
4. User stays on login/register page

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Action                         │
│              (Login / Register)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend (React)                           │
│  - LoginForm / RegisterForm captures input              │
│  - Calls authService.login() or register()              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          API Client (lib/api/client.ts)                 │
│  - Wraps data in { RequestData: {...} }                │
│  - POSTs to OutSystems API                              │
│  - Logs request/response                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          OutSystems REST API                            │
│  - Validates credentials                                │
│  - Returns { Success, Message, UserId, ... }            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│      Auth Service (lib/api/auth.ts)                     │
│  - Checks response.Success && response.UserId           │
│  - Stores UserId as authToken                           │
│  - Builds User object                                   │
│  - Stores user data in localStorage                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│      Auth Context (contexts/AuthContext.tsx)            │
│  - Updates user state                                   │
│  - Triggers router.push('/dashboard')                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Dashboard Page                             │
│  - ProtectedRoute checks authentication                 │
│  - Shows user name, email                               │
│  - Enables logout                                       │
└─────────────────────────────────────────────────────────┘
```

## Differences from Standard Authentication

| Standard Auth | Your API |
|--------------|----------|
| Returns JWT token | Returns UserId |
| Token in Authorization header | UserId used as token |
| Separate user endpoint | User data in login response |
| Token expiration | No expiration (stored UserId) |
| Refresh token | Not implemented |

## Next Steps for Production

1. **Implement proper token-based auth:**
   - Generate unique session tokens in OutSystems
   - Return token in login/register response
   - Validate token on protected endpoints

2. **Add token expiration:**
   - Set expiration time for sessions
   - Implement auto-logout on expiration
   - Add token refresh mechanism

3. **Secure sensitive endpoints:**
   - Validate token on every API call
   - Check user permissions
   - Rate limiting

4. **Better error handling:**
   - Return proper HTTP status codes (401, 403, etc.)
   - Detailed error messages
   - Logging for debugging

## Summary

Your frontend is now fully integrated with your actual OutSystems API structure! The main adaptations were:

✅ No JWT token - using `UserId` as authentication identifier
✅ Response structure matches your API exactly
✅ Login returns partial user data (Name, ReferralCode)
✅ GetUser returns full user profile
✅ All requests wrapped in `RequestData` object
✅ Error handling for empty responses
✅ Detailed console logging for debugging

Try it out and let me know if you see any issues! 🚀
