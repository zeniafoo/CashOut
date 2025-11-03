# CashOut API Integration Guide

This guide explains how your CashOut frontend is now integrated with your OutSystems backend APIs.

## Overview

Your frontend has been successfully integrated with the following OutSystems APIs:
- `/Login` - User authentication
- `/Register` - New user registration
- `/GetUser` - Fetch user details by ID

## What Was Implemented

### 1. API Client Setup

**Files Created:**
- `lib/api/client.ts` - Core API client with fetch wrapper
- `lib/api/auth.ts` - Authentication-specific API calls
- `.env.local` - Environment configuration for API URL

**Features:**
- Automatic token management (stored in localStorage)
- Error handling with custom ApiError class
- Request/response interceptors
- Authorization header injection

### 2. Authentication System

**Files Created:**
- `contexts/AuthContext.tsx` - Global authentication state management
- `types/auth.ts` - TypeScript types for API requests/responses

**Features:**
- User state management across the app
- Login/register/logout functionality
- Session persistence with localStorage
- Custom `useAuth()` hook for easy access

### 3. UI Components

**Files Created:**
- `components/register-form.tsx` - Registration form
- `components/protected-route.tsx` - Route protection wrapper
- `components/ui/dropdown-menu.tsx` - User menu dropdown
- `app/register/page.tsx` - Registration page

**Files Updated:**
- `components/login-form.tsx` - Now calls real Login API
- `components/dashboard-header.tsx` - Shows user info and logout
- `app/layout.tsx` - Wrapped with AuthProvider
- `app/dashboard/page.tsx` - Protected with ProtectedRoute
- `app/deposit/page.tsx` - Protected with ProtectedRoute
- `app/transfer/page.tsx` - Protected with ProtectedRoute
- `app/exchange/page.tsx` - Protected with ProtectedRoute

## How It Works

### User Registration Flow

1. User fills out registration form at `/register`
2. Form validates input (name, email, phone, password)
3. On submit, calls `POST /Register` with:
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
   **Note:** The data is wrapped in a `RequestData` object as required by OutSystems REST API.
4. If successful, stores token and user data in localStorage
5. Redirects to `/dashboard`

### User Login Flow

1. User enters email and password at `/` (login page)
2. Form validates input
3. On submit, calls `POST /Login` with:
   ```json
   {
     "RequestData": {
       "Email": "john@example.com",
       "Password": "password123"
     }
   }
   ```
   **Note:** The credentials are wrapped in a `RequestData` object as required by OutSystems REST API.
4. If successful, stores token and user data in localStorage
5. Redirects to `/dashboard`

### Protected Routes

All authenticated pages (dashboard, deposit, transfer, exchange) are wrapped with `<ProtectedRoute>`:
- Checks if user is authenticated
- If not authenticated, redirects to login page
- Shows loading spinner while checking auth state

### User Data Display

The `DashboardHeader` component:
- Displays user initials in avatar (extracted from user's name)
- Shows user name and email in dropdown menu
- Provides logout functionality

### Logout Flow

1. User clicks "Log out" in dropdown menu
2. Clears token and user data from localStorage
3. Redirects to login page (`/`)

## API Configuration

### Environment Variables

Edit `.env.local` to configure your API:

```env
NEXT_PUBLIC_API_BASE_URL=https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI
```

**Important:** The `NEXT_PUBLIC_` prefix makes it available in client-side code.

### API Response Format

Your OutSystems APIs should return responses in this format:

**Successful Response:**
```json
{
  "Success": true,
  "Message": "Login successful",
  "Token": "jwt-token-here",
  "User": {
    "UserId": "123",
    "Name": "John Doe",
    "Email": "john@example.com",
    "PhoneNumber": "+1234567890"
  }
}
```

**Error Response:**
```json
{
  "Success": false,
  "Message": "Invalid credentials",
  "Error": "Email or password is incorrect"
}
```

## Using the Authentication System

### In Any Component

```tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.Name}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  )
}
```

### Making Authenticated API Calls

```tsx
import { api } from '@/lib/api/client'

// The API client automatically includes the auth token
const response = await api.get('/SomeProtectedEndpoint')
```

## Testing the Integration

### 1. Start the Development Server

```bash
cd /Users/zenia/Documents/GitHub/CashOut/my-app
npm run dev
```

### 2. Test Registration

1. Navigate to `http://localhost:3000/register`
2. Fill out the form with:
   - Name: Your Name
   - Email: your@email.com
   - Phone: +1234567890
   - Password: password123
3. Click "Create Account"
4. Should redirect to dashboard if successful

### 3. Test Login

1. Navigate to `http://localhost:3000`
2. Enter email and password
3. Click "Sign in"
4. Should redirect to dashboard if successful

### 4. Test Protected Routes

1. Try to access `/dashboard`, `/deposit`, `/transfer`, or `/exchange` without logging in
2. Should redirect to login page

### 5. Test Logout

1. Click on user avatar in dashboard header
2. Click "Log out"
3. Should redirect to login page

## Error Handling

The integration includes comprehensive error handling:

### Form Validation Errors
- Empty fields
- Password mismatch (registration)
- Invalid email format
- Minimum password length

### API Errors
- Network errors (server unreachable)
- Authentication errors (401)
- Server errors (500)
- Custom error messages from API

All errors are displayed using toast notifications.

## Security Features

### Token Storage
- Auth tokens stored in localStorage
- Automatically included in API requests
- Cleared on logout

### Route Protection
- All authenticated pages protected with `<ProtectedRoute>`
- Automatic redirect to login if not authenticated
- Loading state during auth check

### HTTPS
- API calls use HTTPS
- Secure token transmission

## Next Steps

### For Your Backend API

Ensure your OutSystems APIs return the correct response format:

1. **Login Response:** Must include `Success`, `Message`, `Token`, and `User` object
2. **Register Response:** Must include `Success`, `Message`, `Token`, and `User` object
3. **GetUser Response:** Must include `Success`, `Message`, and `User` object
4. **Error Responses:** Must include `Success: false` and `Message`

### For Future Features

You can now add additional API endpoints:

1. Create new service files in `lib/api/` (e.g., `transactions.ts`, `accounts.ts`)
2. Define TypeScript types in `types/` folder
3. Use the `api` client to make calls
4. Update components to use real data instead of mock data

Example:
```typescript
// lib/api/transactions.ts
import { api } from './client'

export const transactionService = {
  getRecent: async (userId: string) => {
    return await api.get(`/GetRecentTransactions?UserId=${userId}`)
  },

  deposit: async (data: DepositRequest) => {
    return await api.post('/Deposit', data)
  },
}
```

## Troubleshooting

### Login fails with network error
- Check that your OutSystems API is running
- Verify the API URL in `.env.local`
- Check browser console for CORS errors

### Token not being sent
- Ensure `NEXT_PUBLIC_` prefix is used in `.env.local`
- Restart dev server after changing `.env.local`
- Check localStorage in browser DevTools

### Redirect loops
- Clear localStorage: `localStorage.clear()`
- Check that API returns correct response format
- Verify token is being stored correctly

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Restart your IDE/editor
- Check that all imported types exist

## File Structure

```
my-app/
├── app/
│   ├── dashboard/
│   │   └── page.tsx (protected)
│   ├── deposit/
│   │   └── page.tsx (protected)
│   ├── transfer/
│   │   └── page.tsx (protected)
│   ├── exchange/
│   │   └── page.tsx (protected)
│   ├── register/
│   │   └── page.tsx (public)
│   ├── page.tsx (login - public)
│   └── layout.tsx (with AuthProvider)
├── components/
│   ├── login-form.tsx (integrated)
│   ├── register-form.tsx (new)
│   ├── protected-route.tsx (new)
│   ├── dashboard-header.tsx (updated with user menu)
│   └── ui/
│       └── dropdown-menu.tsx (new)
├── contexts/
│   └── AuthContext.tsx (new)
├── lib/
│   └── api/
│       ├── client.ts (new)
│       └── auth.ts (new)
├── types/
│   └── auth.ts (new)
└── .env.local (new)
```

## Summary

Your CashOut frontend is now fully integrated with your OutSystems backend APIs. Users can:

✅ Register new accounts
✅ Log in with email/password
✅ Access protected pages when authenticated
✅ View their profile information
✅ Log out securely

The foundation is in place to integrate additional APIs for deposits, transfers, exchanges, and transaction history!
