# Quick Fix for "<!DOCTYPE" Error

## The Problem
Your friends get: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

## The Cause
**CORS is not enabled** in your OutSystems API.

## The Fix (5 Steps)

### 1. Open OutSystems Service Studio
- Open your `UserAuth_API` module

### 2. Enable CORS
- Go to **Logic → Integrations → REST → UserAuthAPI**
- Select the **UserAuthAPI** REST service
- In **Properties** panel → **Advanced** section
- Enable **CORS**

### 3. Add Allowed Origins
Add these to the allowed origins list:
```
http://localhost:3000
http://127.0.0.1:3000
*
```
(The `*` allows all origins - for development only!)

### 4. Publish
- Click **1-Click Publish**
- Wait for it to finish

### 5. Test
Ask your friends to:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. Try logging in again

## Verify CORS is Enabled

Run this command:
```bash
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/Login
```

You should see in the response:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
```

If you **don't see** these headers, CORS is **not enabled correctly**.

## Alternative: Test Without CORS (Temporary)

If you can't enable CORS in OutSystems right now, use this temporary workaround:

### Use a CORS Proxy (Dev Only)
Update `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://corsproxy.io/?https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI
```

**⚠️ Only for testing! Must fix CORS in OutSystems for production!**

## Need More Help?

See [CORS_FIX_GUIDE.md](CORS_FIX_GUIDE.md) for detailed instructions.
