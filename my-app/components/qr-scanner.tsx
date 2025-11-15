"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Camera, CheckCircle2 } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanned, setScanned] = useState(false)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const hasScannedRef = useRef(false) // Prevent multiple scans

  const stopCamera = () => {
    console.log("[QR Scanner] Stopping camera...")

    // Stop the ZXing controls
    if (controlsRef.current) {
      try {
        controlsRef.current.stop()
        console.log("[QR Scanner] ZXing controls stopped")
      } catch (e) {
        console.error("[QR Scanner] Error stopping ZXing controls:", e)
      }
      controlsRef.current = null
    }

    // Also manually stop all video tracks to ensure camera turns off
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => {
          track.stop()
          console.log("[QR Scanner] Video track stopped:", track.kind)
        })
        videoRef.current.srcObject = null
        console.log("[QR Scanner] Video srcObject cleared")
      } catch (e) {
        console.error("[QR Scanner] Error stopping video tracks:", e)
      }
    }
  }

  useEffect(() => {
    let mounted = true
    hasScannedRef.current = false // Reset on mount

    const initScanner = async () => {
      try {
        setIsScanning(true)
        setError(null)

        // Create reader instance
        const codeReader = new BrowserMultiFormatReader()
        readerRef.current = codeReader

        // Get video input devices
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()

        if (videoInputDevices.length === 0) {
          throw new Error("No camera found on this device")
        }

        // Use the first camera (usually back camera on mobile, any camera on desktop)
        const selectedDeviceId = videoInputDevices[0].deviceId

        if (!videoRef.current || !mounted) return

        // Start decoding from video device
        const controls = await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            // Only process if we haven't scanned yet and component is still mounted
            if (result && !hasScannedRef.current && mounted) {
              hasScannedRef.current = true // Mark as scanned immediately
              const scannedText = result.getText()

              console.log("[QR Scanner] QR code detected:", scannedText)

              setScanned(true)
              onScan(scannedText)

              // Stop camera after successful scan
              stopCamera()
            }

            // Ignore NotFoundException as it just means no QR code in frame yet
            if (error && error.name !== "NotFoundException") {
              console.error("QR Scan error:", error)
            }
          }
        )

        // Store controls in ref
        if (mounted) {
          controlsRef.current = controls
          setIsScanning(false)
        }
      } catch (err) {
        if (!mounted) return

        const errorMessage = err instanceof Error ? err.message : "Failed to initialize camera"
        setError(errorMessage)
        setIsScanning(false)
        onError?.(errorMessage)
      }
    }

    initScanner()

    // Cleanup function - stop camera when component unmounts
    return () => {
      mounted = false
      stopCamera()
    }
  }, [onScan, onError])

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Initializing camera...</p>
            </div>
          </div>
        )}

        {scanned && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-10">
            <div className="text-center text-white">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm font-semibold">QR Code Scanned!</p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanning frame overlay */}
        {!scanned && !isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-primary rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}. Please check your camera permissions and try again.
          </AlertDescription>
        </Alert>
      )}

      {!error && !scanned && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
          <Camera className="h-4 w-4" />
          <span>Position the QR code within the frame</span>
        </div>
      )}
    </div>
  )
}
