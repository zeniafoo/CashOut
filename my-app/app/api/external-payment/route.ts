import { NextRequest, NextResponse } from "next/server"

interface PaymentRequest {
  accountId: string
  amount: number
  narrative: string
  transactionId: string
  userId: string
  currencyCode: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()
    const { accountId, amount, narrative, transactionId, userId, currencyCode } = body

    // Validate required fields
    if (!accountId || !amount || !transactionId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    const walletApiUrl = process.env.NEXT_PUBLIC_WALLET_API_BASE_URL || ""

    // Step 1: Get all user wallets and find the one for the selected currency
    console.log(`[Payment] Step 1: Fetching all wallets for user ${userId}`)
    console.log(`[Payment] Wallet API URL: ${walletApiUrl}/GetAllWalletByUserId?UserId=${userId}`)

    try {
      const walletCheckResponse = await fetch(
        `${walletApiUrl}/GetAllWalletByUserId?UserId=${userId}`
      )

      console.log(`[Payment] Wallet check response status: ${walletCheckResponse.status}`)

      const walletResponseText = await walletCheckResponse.text()
      console.log(`[Payment] Wallet check raw response:`, walletResponseText)

      let walletData
      try {
        walletData = JSON.parse(walletResponseText)
      } catch (parseError) {
        console.error("[Payment] Failed to parse wallet response:", parseError)
        return NextResponse.json(
          { error: "Invalid wallet API response", details: walletResponseText },
          { status: 500 }
        )
      }

      console.log(`[Payment] Wallet data:`, walletData)

      if (!walletCheckResponse.ok) {
        return NextResponse.json(
          { error: "Failed to check wallet balance", details: walletData },
          { status: 500 }
        )
      }

      if (!walletData.Success || !walletData.Wallets) {
        console.error("[Payment] No wallets found for user:", walletData)
        return NextResponse.json(
          { error: "No wallets found", details: walletData.Message || "User has no wallets" },
          { status: 404 }
        )
      }

      // Find the wallet for the selected currency
      const userWallet = walletData.Wallets.find((w: any) => w.CurrencyCode === currencyCode)

      if (!userWallet) {
        console.error(`[Payment] No ${currencyCode} wallet found for user`)
        return NextResponse.json(
          { error: "Wallet not found", details: `No ${currencyCode} wallet found for this user` },
          { status: 404 }
        )
      }

      const currentBalance = userWallet.Balance

      console.log(`[Payment] Current ${currencyCode} balance: ${currentBalance}`)

      // Check if user has sufficient balance
      if (currentBalance < amount) {
        return NextResponse.json(
          {
            error: "Insufficient balance",
            currentBalance,
            requiredAmount: amount,
          },
          { status: 400 }
        )
      }

      // Step 2: Deduct from user's wallet
      console.log(`[Payment] Step 2: Deducting ${amount} ${currencyCode} from user wallet`)

      const walletUpdateResponse = await fetch(`${walletApiUrl}/UpdateWallet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          UserId: userId,
          CurrencyCode: currencyCode,
          Amount: -amount, // Negative amount for deduction
        }),
      })

      if (!walletUpdateResponse.ok) {
        const walletError = await walletUpdateResponse.text()
        console.error("[Payment] Wallet deduction failed:", walletError)
        return NextResponse.json(
          { error: "Failed to deduct from wallet", details: walletError },
          { status: 500 }
        )
      }

      const walletUpdateData = await walletUpdateResponse.json()

      if (!walletUpdateData.Success) {
        return NextResponse.json(
          { error: walletUpdateData.Message || "Wallet deduction failed" },
          { status: 500 }
        )
      }

      console.log(`[Payment] ✓ Wallet deducted successfully. New balance: ${walletUpdateData.NewBalance}`)

    } catch (walletError) {
      console.error("[Payment] Wallet operation error:", walletError)
      return NextResponse.json(
        { error: "Wallet operation failed", details: walletError instanceof Error ? walletError.message : "Unknown error" },
        { status: 500 }
      )
    }

    // Step 3: Transfer to external TBank account
    console.log("[Payment] Step 3: Transferring to TBank external account")

    // Get credentials from environment variables for TBank API
    const username = process.env.TBANK_USERNAME
    const password = process.env.TBANK_API_PASSWORD
    const targetAccountId = process.env.TBANK_TARGET_ACCOUNT_ID || "0000002578"

    if (!username || !password) {
      console.error("Missing TBank API credentials")
      // Note: Wallet has already been deducted at this point
      // In production, you should implement a refund mechanism here
      return NextResponse.json(
        { error: "Server configuration error - Missing TBank credentials" },
        { status: 500 }
      )
    }

    // Create Basic Auth header
    const credentials = Buffer.from(`${username}:${password}`).toString("base64")

    // Prepare the request body for TBank API
    const tbankPayload = {
      consumerId: "0",
      transactionId,
      accountId,
      amount,
      narrative: narrative || "QR Payment",
    }

    // Call TBank API
    const apiUrl = `https://smuedu-dev.outsystemsenterprise.com/gateway/rest/account/${targetAccountId}/DepositCash`

    console.log("[Payment] Calling TBank API:", apiUrl)
    console.log("[Payment] Payload:", tbankPayload)

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tbankPayload),
    })

    const responseData = await response.text()

    if (!response.ok) {
      console.error("[Payment] TBank API error:", response.status, responseData)
      // Note: Wallet has been deducted but TBank transfer failed
      // In production, implement refund logic here
      return NextResponse.json(
        {
          error: "TBank transfer failed",
          details: responseData,
          status: response.status,
          note: "Amount has been deducted from your wallet but transfer failed. Please contact support.",
        },
        { status: response.status }
      )
    }

    console.log("[Payment] ✓ TBank transfer successful:", responseData)

    return NextResponse.json({
      success: true,
      transactionId,
      message: "Payment processed successfully",
      tbankResponse: responseData,
    })
  } catch (error) {
    console.error("Payment API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
