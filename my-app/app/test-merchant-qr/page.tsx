"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Store } from "lucide-react"
import { generateMerchantQRData, generateQRCodeDataURL } from "@/lib/qr-code"

export default function TestMerchantQRPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  // TBank merchant details
  const merchantId = "0000002578" // TBank account ID from your API
  const merchantName = "TBank Store"

  useEffect(() => {
    const generateQR = async () => {
      const qrData = generateMerchantQRData(merchantId, merchantName)
      const qrUrl = await generateQRCodeDataURL(qrData)
      setQrCodeUrl(qrUrl)
    }

    generateQR()
  }, [])

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = `${merchantName.replace(/\s+/g, '_')}_QRCode.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const qrDataPreview = generateMerchantQRData(merchantId, merchantName)

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            Test Merchant QR Code
          </CardTitle>
          <CardDescription>
            Use this QR code to test external merchant payments (TBank)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Display */}
          <div className="bg-muted/50 p-6 rounded-lg">
            <div className="flex flex-col items-center gap-4">
              {qrCodeUrl ? (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <img
                      src={qrCodeUrl}
                      alt="TBank Merchant QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-primary">{merchantName}</p>
                    <p className="text-sm text-muted-foreground">
                      Account ID: {merchantId}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadQR}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 w-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </div>

          {/* QR Data Preview */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">QR Code Data (JSON)</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {qrDataPreview}
              </pre>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
              How to Test
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
              <li>Download this QR code or display it on another device</li>
              <li>Go to the Transfer page in your app</li>
              <li>Select the "QR Code" tab</li>
              <li>Scan this merchant QR code</li>
              <li>Enter an amount and complete the transfer</li>
              <li>The payment will be sent to TBank's external account</li>
            </ol>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Note:</strong> This uses real API credentials. Ensure you have sufficient
              balance in your selected currency before testing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
