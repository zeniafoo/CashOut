# Vercel Deployment Guide

## Step 1: Configure Root Directory

1. Go to your Vercel project: https://vercel.com/
2. Select your **CashOut** project
3. Click **Settings** (top navigation)
4. Click **General** (left sidebar)
5. Scroll to **"Build & Development Settings"**
6. Find **"Root Directory"** section
7. Click **"Edit"**
8. Enter: `my-app`
9. Click **"Save"**

## Step 2: Add Environment Variables

Go to **Settings** → **Environment Variables** and add the following:

### Required Environment Variables:

```
NEXT_PUBLIC_API_BASE_URL=https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI

NEXT_PUBLIC_WALLET_API_BASE_URL=https://personal-v44qxubl.outsystemscloud.com/Deposit/rest/WalletAPI

TBANK_USERNAME=12173e30ec556fe4a951

TBANK_API_PASSWORD=2fbbd75fd60a8389b82719d2dbc37f1eb9ed226f3eb43cfa7d9240c72fd5

TBANK_TENANT_ID=bfc89ad4-c17f-4fe9-82c2-918d29d59fe0

TBANK_TARGET_ACCOUNT_ID=0000002578

NEXT_PUBLIC_EXCHANGE_API_URL=https://personal-whg1577v.outsystemscloud.com/ExchangeMS/rest/CurrencyExchangeAPI/

NEXT_PUBLIC_REFERRAL_API_BASE_URL=https://personal-fxfq0mme.outsystemscloud.com/ReferralService/rest/ReferralAPI

NEXT_PUBLIC_TRANSFER_API_BASE_URL=https://personal-pbshdii3.outsystemscloud.com/TransferService/rest/TransferAPI
```

### How to Add Each Variable:

1. Click **"Add New"**
2. Enter **Key** (e.g., `NEXT_PUBLIC_API_BASE_URL`)
3. Enter **Value** (copy from above)
4. Select environments: **Production**, **Preview**, **Development** (all three)
5. Click **"Save"**
6. Repeat for all variables

## Step 3: Redeploy

After setting the root directory and environment variables:

1. Go to **Deployments** tab
2. Click on the failed deployment
3. Click **"Redeploy"** button
4. OR push a new commit to trigger a new deployment

## Step 4: Verify Deployment

Once deployed successfully:

1. Visit your deployment URL
2. Test login/register
3. Test deposits, transfers, exchanges
4. Test QR code scanning
5. Test referral system

## Common Issues

### Issue: "cd my-app: No such file or directory"
**Solution**: Set Root Directory to `my-app` in project settings

### Issue: Environment variables not working
**Solution**: Make sure to:
- Add all required variables
- Select all 3 environments (Production, Preview, Development)
- Redeploy after adding variables

### Issue: API calls failing with CORS errors
**Solution**: 
- This is an OutSystems backend configuration issue
- Contact OutSystems admin to enable CORS for your Vercel domain
- Add your Vercel URL to allowed origins

### Issue: Build fails with module not found
**Solution**:
- Check that all dependencies are in `my-app/package.json`
- Run `npm install` locally to verify
- Commit `package-lock.json`

## Deployment Checklist

- [ ] Root Directory set to `my-app`
- [ ] All 8 environment variables added
- [ ] Environment variables set for all 3 environments
- [ ] Redeployed after configuration
- [ ] Tested login functionality
- [ ] Tested wallet operations
- [ ] Tested QR code features
- [ ] Tested referral system

## Need Help?

If deployment still fails:
1. Check the deployment logs in Vercel
2. Look for specific error messages
3. Verify all environment variables are correct
4. Ensure `my-app/package.json` has all dependencies
