# CORS Error Fix Guide

## The Problem

Your friends are getting this error:
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This means OutSystems is returning an **HTML error page** instead of JSON. This is almost always a **CORS (Cross-Origin Resource Sharing)** issue.

## Why It Works for You But Not Your Friends

Possible reasons:
1. **Browser cache** - Your browser cached a successful response
2. **Different network** - Your friends might be on a different network
3. **CORS not fully enabled** - OutSystems CORS settings aren't configured correctly
4. **Browser differences** - Different browsers handle CORS differently

## What is CORS?

CORS is a security feature that prevents websites from making requests to different domains unless explicitly allowed.

- Your frontend: `http://localhost:3000` (or your computer's IP)
- Your API: `https://personal-fxfq0mme.outsystemscloud.com`

These are **different origins**, so CORS must be enabled.

## Solution: Enable CORS in OutSystems

### Option 1: Using OutSystems Service Studio (Recommended)

1. **Open Service Studio**
2. **Open your UserAuth_API module**
3. **Go to Logic → Integrations → REST → UserAuthAPI**
4. **Select the REST API (UserAuthAPI)**
5. **In the Properties panel**, find **Advanced** section
6. **Enable "CORS"** or add to **"Allowed Origins"**:
   - Add: `http://localhost:3000`
   - Add: `http://127.0.0.1:3000`
   - For production: Add your actual domain

7. **Set these CORS headers**:
   - Access-Control-Allow-Origin: `*` (for development) or your specific domain
   - Access-Control-Allow-Methods: `GET, POST, PUT, DELETE, OPTIONS`
   - Access-Control-Allow-Headers: `Content-Type, Accept, Authorization`

8. **Publish your module** (1-Click Publish)

### Option 2: Using OutSystems Service Center

1. **Go to Service Center** (https://personal-fxfq0mme.outsystemscloud.com/ServiceCenter)
2. **Navigate to Factory → Modules**
3. **Find and open UserAuth_API**
4. **Go to the Integrations tab**
5. **Find your REST API**
6. **Enable CORS** and add allowed origins

### Option 3: Add Custom Headers in REST Methods

For each REST method (Login, Register, GetUser):

1. **Add an "OnBeforeResponse" callback**
2. **Set these headers**:
   ```
   SetResponseHeader("Access-Control-Allow-Origin", "*")
   SetResponseHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
   SetResponseHeader("Access-Control-Allow-Headers", "Content-Type, Accept")
   ```

3. **Handle OPTIONS preflight requests**:
   - Add logic to return 200 OK for OPTIONS method
   - Browser sends OPTIONS before actual request

## Testing CORS Configuration

### Test 1: Browser Console

Ask your friends to:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for errors containing "CORS" or "Access-Control-Allow-Origin"

### Test 2: Using curl (No CORS restrictions)

```bash
curl -X POST "https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/Login" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -v \
  -d '{
    "RequestData": {
      "Email": "test@example.com",
      "Password": "password123"
    }
  }'
```

**Look for these headers in the response:**
```
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET, POST, OPTIONS
< Access-Control-Allow-Headers: Content-Type
```

If you **don't see** these headers, CORS is **not enabled**.

### Test 3: Online CORS Tester

Use this tool: https://www.test-cors.org/

1. **Remote URL**: `https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/Login`
2. **Method**: POST
3. **Click "Send Request"**

It will tell you if CORS is configured correctly.

## Common CORS Error Messages

### Error 1: "No 'Access-Control-Allow-Origin' header is present"
**Cause:** CORS not enabled at all
**Fix:** Enable CORS in OutSystems (see solutions above)

### Error 2: "The 'Access-Control-Allow-Origin' header has a value that is not equal to the supplied origin"
**Cause:** Your domain is not in the allowed origins list
**Fix:** Add `http://localhost:3000` to allowed origins

### Error 3: "CORS preflight channel did not succeed"
**Cause:** OutSystems not handling OPTIONS requests
**Fix:** Add OPTIONS method handler to your REST API

## Quick Fix for Development

If you just want to test quickly without fixing CORS in OutSystems:

### Option A: Disable CORS in Browser (TEMPORARY - Dev Only)

**Chrome:**
```bash
# Mac
open -na Google\ Chrome --args --user-data-dir=/tmp/chrome-cors --disable-web-security

# Windows
chrome.exe --user-data-dir=/tmp/chrome-cors --disable-web-security

# Linux
google-chrome --user-data-dir=/tmp/chrome-cors --disable-web-security
```

**⚠️ WARNING:** Only use this for development testing! Never for production!

### Option B: Use a CORS Proxy (TEMPORARY)

Add this to your `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=https://cors-anywhere.herokuapp.com/https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI
```

**⚠️ WARNING:** This is only for testing! Don't use in production!

## Verify CORS is Fixed

After enabling CORS in OutSystems:

1. **Clear browser cache** (Important!)
   - Chrome: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
   - Check "Cached images and files"
   - Clear data

2. **Hard refresh** the page
   - Mac: Cmd+Shift+R
   - Windows: Ctrl+F5

3. **Try logging in again**

4. **Check browser console** - should see:
   ```
   [API Response] { status: 200, contentType: "application/json" }
   [API Response Text] {"Success":true,...}
   ```

5. **Ask your friends to try** - they should be able to log in now

## For Your Friends Testing from Different Computers

If your friends are accessing from their own computers (not localhost):

### Option 1: Use ngrok (Tunnel localhost)

1. **Install ngrok**: https://ngrok.com/download

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **In a new terminal, run:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Add this URL to OutSystems CORS allowed origins**

6. **Share the ngrok URL with your friends**

### Option 2: Use your computer's local IP

1. **Find your local IP:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. **Start dev server on network:**
   ```bash
   npm run dev -- -H 0.0.0.0
   ```

3. **Add your IP to OutSystems CORS:**
   - Example: `http://192.168.1.100:3000`

4. **Friends access via:** `http://YOUR_IP:3000`

## Production Deployment

For production, you'll need to:

1. **Deploy frontend** to a hosting service (Vercel, Netlify, etc.)
2. **Get your production domain** (e.g., `https://cashout-app.vercel.app`)
3. **Add production domain to OutSystems CORS** allowed origins
4. **Update `.env.local` → `.env.production`** with production API URL
5. **Remove `*` from CORS** - only allow specific domains

## Checklist

Before asking your friends to test again:

- [ ] CORS enabled in OutSystems REST API
- [ ] Allowed origins includes `http://localhost:3000`
- [ ] Allowed origins includes `http://127.0.0.1:3000`
- [ ] Allowed methods include `POST, GET, OPTIONS`
- [ ] Allowed headers include `Content-Type, Accept`
- [ ] Module published in OutSystems
- [ ] Tested with curl and see CORS headers
- [ ] Cleared browser cache
- [ ] Tested in incognito/private window

## Still Not Working?

If CORS is still not working after all this:

1. **Check OutSystems error logs:**
   - Service Center → Monitoring → Errors
   - Look for errors in the last few minutes

2. **Check if API endpoint exists:**
   - Visit the API documentation page
   - Should be available at: https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI

3. **Verify API is published:**
   - Service Center → Factory → Modules
   - Check UserAuth_API status

4. **Contact OutSystems support:**
   - CORS configuration might be restricted
   - Enterprise features might require different setup

## Summary

The HTML error your friends are seeing is **definitely a CORS issue**. The fix is:

1. ✅ Enable CORS in your OutSystems REST API
2. ✅ Add allowed origins (localhost:3000 for development)
3. ✅ Publish the module
4. ✅ Clear browser cache and test again

After fixing CORS in OutSystems, **everyone** should be able to use the app! 🚀
