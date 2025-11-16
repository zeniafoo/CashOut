// QR Code Generation Utilities

/**
 * Generate QR code data for a user
 * This creates a JSON string that can be encoded into a QR code
 */
export function generateUserQRData(userId: string, name: string): string {
  const qrData = {
    type: "user_payment",
    userId: userId,
    name: name,
    timestamp: Date.now(),
  }

  return JSON.stringify(qrData)
}

/**
 * Parse QR code data scanned from another user
 */
export function parseUserQRData(qrString: string): { type: string; userId: string; name: string } | null {
  try {
    const data = JSON.parse(qrString)

    // Validate it's a user payment QR code
    if (data.type === "user_payment" && data.userId && data.name) {
      return {
        type: data.type,
        userId: data.userId,
        name: data.name,
      }
    }

    return null
  } catch (error) {
    console.error("Error parsing QR code data:", error)
    return null
  }
}

/**
 * Generate QR code data for an external merchant (e.g., TBank)
 */
export function generateMerchantQRData(merchantId: string, merchantName: string): string {
  const qrData = {
    type: "external_payment",
    merchantId: merchantId,
    merchantName: merchantName,
    timestamp: Date.now(),
  }

  return JSON.stringify(qrData)
}

/**
 * Parse external merchant QR code data
 */
export function parseMerchantQRData(qrString: string): { type: string; merchantId: string; merchantName: string } | null {
  try {
    const data = JSON.parse(qrString)

    // Validate it's an external payment QR code
    if (data.type === "external_payment" && data.merchantId && data.merchantName) {
      return {
        type: data.type,
        merchantId: data.merchantId,
        merchantName: data.merchantName,
      }
    }

    return null
  } catch (error) {
    console.error("Error parsing merchant QR code data:", error)
    return null
  }
}

/**
 * Generate a QR code as a data URL using a simple QR code library
 * For now, we'll use a placeholder approach - you can replace this with a proper QR library
 */
export async function generateQRCodeDataURL(data: string): Promise<string> {
  // We'll use the qrcode library if available
  // For now, return a placeholder that will be replaced by an actual QR code

  // Using the public QR code API as a fallback
  const encodedData = encodeURIComponent(data)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`
}
