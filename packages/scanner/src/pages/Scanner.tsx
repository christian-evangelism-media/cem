import { useEffect, useState } from 'react'
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonToast,
  IonFab,
  IonFabButton,
} from '@ionic/react'
import { checkmarkCircle, trash, send, logOut } from 'ionicons/icons'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Html5Qrcode } from 'html5-qrcode'
import { Preferences } from '@capacitor/preferences'
import { api } from '../services/api'
import { useHistory } from 'react-router-dom'

interface ScannerProps {
  onLogout: () => void
}

const Scanner: React.FC<ScannerProps> = ({ onLogout }) => {
  const history = useHistory()
  const [scannedOrders, setScannedOrders] = useState<number[]>([])
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [message, setMessage] = useState('')
  const [messageColor, setMessageColor] = useState<'success' | 'danger' | 'warning'>('success')
  const [lastScannedId, setLastScannedId] = useState<number | null>(null)
  const [lastScannedTime, setLastScannedTime] = useState<number>(0)
  const [detectedCode, setDetectedCode] = useState<number | null>(null)
  const [shippedOrders, setShippedOrders] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Reset all state on mount
    setScannedOrders([])
    setIsCameraOn(false)
    setIsScanning(false)
    setMessage('')
    setLastScannedId(null)
    setLastScannedTime(0)
    setDetectedCode(null)
    setShippedOrders(new Set())

    const html5QrCode = new Html5Qrcode('reader')
    setScanner(html5QrCode)

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error)
      }
      setIsCameraOn(false)
      setIsScanning(false)
      setDetectedCode(null)
    }
  }, [])

  const startCamera = async () => {
    if (!scanner) return

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScan(decodedText)
        },
        () => {
          // Ignore errors (scanning continuously)
        }
      )
      setIsCameraOn(true)
    } catch (err) {
      console.error('Failed to start camera:', err)
      setMessage('Failed to start camera')
      setMessageColor('danger')
    }
  }

  const stopCamera = async () => {
    if (scanner && scanner.isScanning) {
      await scanner.stop()
      setIsCameraOn(false)
      setIsScanning(false)
      setDetectedCode(null)
    }
  }

  const beginScanning = async () => {
    setIsScanning(true)

    // If a code was detected during preview, process it immediately
    if (detectedCode) {
      const orderId = detectedCode
      setDetectedCode(null)

      // Check if already shipped
      if (shippedOrders.has(orderId)) {
        setMessage(`Order #${orderId} already shipped`)
        setMessageColor('warning')
        return
      }

      // Check if already in current batch
      if (scannedOrders.includes(orderId)) {
        setMessage(`Order #${orderId} already in batch`)
        setMessageColor('warning')
        return
      }

      setMessage(`Scanning Order #${orderId}...`)
      setMessageColor('success')

      try {
        await api.shipOrder(orderId)
        setScannedOrders([...scannedOrders, orderId])
        const newShippedOrders = new Set(shippedOrders)
        newShippedOrders.add(orderId)
        setShippedOrders(newShippedOrders)
        await Haptics.impact({ style: ImpactStyle.Medium })
        playBeep()
        setMessage(`✓ Order #${orderId} ready for shipping`)
        setMessageColor('success')
      } catch (err) {
        setMessage(`✗ Failed to ship Order #${orderId}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setMessageColor('danger')
      }
    } else {
      setMessage('Scanning active - point at QR codes')
      setMessageColor('success')
    }

    // Reset last scanned to allow new scans
    setLastScannedId(null)
    setLastScannedTime(0)
  }

  const pauseScanning = () => {
    setIsScanning(false)
    setDetectedCode(null)
    setMessage('Scanning paused')
    setMessageColor('success')
  }

  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  }

  const handleScan = async (decodedText: string) => {
    // Try to extract order ID from QR code
    const orderIdMatch = decodedText.match(/\d+/)
    if (!orderIdMatch) return

    const orderId = parseInt(orderIdMatch[0])
    const now = Date.now()

    // Always show what's detected
    setDetectedCode(orderId)

    // Only process scans when actively scanning
    if (!isScanning) return

    // Prevent duplicate scans within 2 seconds of the same item
    if (orderId === lastScannedId && now - lastScannedTime < 2000) {
      return
    }

    // Check if already shipped
    if (shippedOrders.has(orderId)) {
      setMessage(`Order #${orderId} already shipped`)
      setMessageColor('warning')
      setLastScannedId(orderId)
      setLastScannedTime(now)
      return
    }

    // Check if already in the current batch
    if (scannedOrders.includes(orderId)) {
      setMessage(`Order #${orderId} already in batch`)
      setMessageColor('warning')
      setLastScannedId(orderId)
      setLastScannedTime(now)
      return
    }

    setLastScannedId(orderId)
    setLastScannedTime(now)

    // Show scanning message
    setMessage(`Scanning Order #${orderId}...`)
    setMessageColor('success')

    try {
      // Immediately update order status to shipped
      await api.shipOrder(orderId)

      // Add to scanned list and shipped tracking
      setScannedOrders([...scannedOrders, orderId])
      const newShippedOrders = new Set(shippedOrders)
      newShippedOrders.add(orderId)
      setShippedOrders(newShippedOrders)

      // Haptic feedback and beep
      await Haptics.impact({ style: ImpactStyle.Medium })
      playBeep()

      setMessage(`✓ Order #${orderId} ready for shipping`)
      setMessageColor('success')
    } catch (err) {
      setMessage(`✗ Failed to ship Order #${orderId}`)
      setMessageColor('danger')
    }
  }


  const undoAll = async () => {
    if (scannedOrders.length === 0) {
      setMessage('No orders to undo')
      setMessageColor('danger')
      return
    }

    setMessage(`Reverting ${scannedOrders.length} order${scannedOrders.length !== 1 ? 's' : ''} back to ready...`)
    setMessageColor('success')

    try {
      await api.batchUnshipOrders(scannedOrders)
      await Haptics.impact({ style: ImpactStyle.Medium })

      // Remove from shipped orders tracking
      const newShippedOrders = new Set(shippedOrders)
      scannedOrders.forEach(id => newShippedOrders.delete(id))
      setShippedOrders(newShippedOrders)

      setMessage(`✓ ${scannedOrders.length} order${scannedOrders.length !== 1 ? 's' : ''} reverted to READY`)
      setMessageColor('success')
      setScannedOrders([])
    } catch (err) {
      setMessage('Failed to undo orders')
      setMessageColor('danger')
    }
  }

  const handleLogout = async () => {
    try {
      // Stop camera if running
      if (scanner && scanner.isScanning) {
        await scanner.stop()
      }

      // Clear preferences
      await Preferences.remove({ key: 'user' })

      // Logout from API
      await api.logout()

      // Update app state
      onLogout()

      // Navigate to login
      history.push('/login')
    } catch (err) {
      // Still update state and navigate even if API call fails
      onLogout()
      history.push('/login')
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Scan Orders</IonTitle>
          <IonButtons slot="end">
            {scannedOrders.length > 0 && (
              <IonButton onClick={undoAll} color="warning">
                Undo All ({scannedOrders.length})
              </IonButton>
            )}
            <IonButton onClick={handleLogout}>
              <IonIcon icon={logOut} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Scanner View */}
        <div style={{ padding: '16px' }}>
          <div id="reader" style={{ width: '100%' }}></div>

          {/* Detection Preview - Only show when camera is on but NOT actively scanning */}
          {isCameraOn && !isScanning && detectedCode && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                background: 'var(--ion-color-light)',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                Detected:
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
                Order #{detectedCode}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '8px' }}>
                Click "Begin Scanning" to start adding orders
              </div>
            </div>
          )}


          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            {!isCameraOn ? (
              <IonButton expand="block" onClick={startCamera}>
                Start Camera
              </IonButton>
            ) : (
              <>
                {!isScanning ? (
                  <IonButton expand="block" onClick={beginScanning} color="success">
                    Begin Scanning
                  </IonButton>
                ) : (
                  <IonButton expand="block" onClick={pauseScanning} color="warning">
                    Pause Scanning
                  </IonButton>
                )}
                <IonButton
                  expand="block"
                  onClick={stopCamera}
                  color="danger"
                  style={{ marginTop: '8px' }}
                >
                  Stop Camera
                </IonButton>
              </>
            )}
          </div>
        </div>

        {/* Scanned Orders List */}
        {scannedOrders.length > 0 && (
          <div style={{ padding: '0 16px', marginTop: '16px' }}>
            <div
              style={{
                background: 'var(--ion-color-success)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px 8px 0 0',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              ✓ Shipped This Session ({scannedOrders.length})
            </div>
            <IonList style={{ marginTop: 0, border: '2px solid var(--ion-color-success)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
              {scannedOrders.map((orderId) => (
                <IonItem key={orderId}>
                  <IonLabel>
                    <h2 style={{ fontWeight: '600' }}>Order #{orderId}</h2>
                    <p style={{ fontSize: '12px', color: 'var(--ion-color-success)' }}>
                      ✓ Ready for shipping
                    </p>
                  </IonLabel>
                  <IonBadge color="success" slot="end">
                    <IonIcon icon={checkmarkCircle} style={{ marginRight: '4px' }} />
                    Shipping
                  </IonBadge>
                </IonItem>
              ))}
            </IonList>
          </div>
        )}


        <IonToast
          isOpen={!!message}
          message={message}
          duration={5000}
          onDidDismiss={() => setMessage('')}
          color={messageColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  )
}

export default Scanner
