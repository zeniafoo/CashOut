# Debugging API Integration

## The Issue You Encountered

**Error:** "Failed to execute 'json' on 'Response': Unexpected end of JSON input"

**Cause:** Your OutSystems API was returning an empty response or invalid JSON.

## What Was Fixed

### 1. Request Body Format
Your OutSystems API expects the request body to be wrapped in a `RequestData` object:

**Before (Incorrect):**
```json
{
  "Email": "user@example.com",
  "Password": "password123"
}
```

**After (Correct):**
```json
{
  "RequestData": {
    "Email": "user@example.com",
    "Password": "password123"
  }
}
```

### 2. Enhanced Error Handling
The API client now:
- Reads response as text first, then parses JSON
- Handles empty responses gracefully
- Provides detailed error messages
- Logs all requests and responses to console

### 3. CORS Configuration
Added proper CORS mode and Accept headers for cross-origin requests.

## How to Debug API Issues

### Step 1: Open Browser Console
1. Open your browser's Developer Tools (F12 or Cmd+Option+I on Mac)
2. Go to the Console tab
3. Try logging in or registering

### Step 2: Check API Logs
You should see logs like:
```
[API Request] { url: "...", method: "POST", body: "..." }
[API Response] { status: 200, statusText: "OK", contentType: "application/json" }
[API Response Text] { "Success": true, ... }
```

### Step 3: Verify OutSystems API Response

Your OutSystems API **MUST** return a response in this exact format:

#### Success Response:
```json
{
  "Success": true,
  "Message": "Login successful",
  "Token": "your-jwt-token-here",
  "User": {
    "UserId": "123",
    "Name": "John Doe",
    "Email": "john@example.com",
    "PhoneNumber": "+1234567890"
  }
}
```

#### Error Response:
```json
{
  "Success": false,
  "Message": "Invalid credentials"
}
```

### Step 4: Common Issues and Solutions

#### Issue: Empty Response
**Symptom:** API returns 200 but no body
**Solution:** Check your OutSystems REST API action to ensure it's returning a JSON response

#### Issue: CORS Error
**Symptom:** "Access-Control-Allow-Origin" error in console
**Solution:** Enable CORS in your OutSystems API:
1. Go to your REST API in OutSystems
2. Enable CORS in the API settings
3. Allow your frontend domain (http://localhost:3000 for development)

#### Issue: 404 Not Found
**Symptom:** Cannot find the endpoint
**Solution:** Verify the API URL in `.env.local` matches your OutSystems API exactly

#### Issue: 500 Internal Server Error
**Symptom:** Server error in OutSystems
**Solution:** Check OutSystems logs for the specific error

## Testing Your OutSystems API

### Using curl (Terminal/Command Line)

**Test Register:**
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

**Test Login:**
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

**Test GetUser:**
```bash
curl "https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/GetUser?UserId=123"
```

### Using Postman or Insomnia

1. Create a new POST request
2. URL: `https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/Login`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "RequestData": {
    "Email": "test@example.com",
    "Password": "password123"
  }
}
```
5. Send and verify the response

## OutSystems API Checklist

Make sure your OutSystems REST API has:

- [ ] Proper HTTP Method (POST for Login/Register, GET for GetUser)
- [ ] Correct input parameter structure (`RequestData` object)
- [ ] JSON response output
- [ ] CORS enabled for development (localhost:3000)
- [ ] Proper HTTP status codes (200 for success, 400/401 for errors)
- [ ] Response includes `Success`, `Message`, `Token`, and `User` fields

## Expected Response Structures

### Login Response
```typescript
{
  Success: boolean
  Message: string
  Token?: string          // JWT or session token
  UserId?: string        // User ID (optional)
  User?: {
    UserId: string
    Name: string
    Email: string
    PhoneNumber: string
  }
}
```

### Register Response
```typescript
{
  Success: boolean
  Message: string
  Token?: string          // JWT or session token
  UserId?: string        // User ID (optional)
  User?: {
    UserId: string
    Name: string
    Email: string
    PhoneNumber: string
  }
}
```

### GetUser Response
```typescript
{
  Success: boolean
  Message: string
  User?: {
    UserId: string
    Name: string
    Email: string
    PhoneNumber: string
  }
}
```

## Next Steps

1. **Try logging in again** - The RequestData wrapper should fix the issue
2. **Check browser console** - Look for the detailed API logs
3. **Verify API response** - Make sure OutSystems returns the correct JSON format
4. **Test with curl** - Verify the API works outside the frontend
5. **Check CORS** - Ensure your OutSystems API allows requests from localhost:3000

## If Still Having Issues

1. Share the console logs showing:
   - `[API Request]`
   - `[API Response]`
   - `[API Response Text]`

2. Test your OutSystems API directly using curl or Postman

3. Verify your OutSystems REST API action returns the correct structure

4. Check OutSystems error logs for any backend issues
