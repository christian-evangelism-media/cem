import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react'
import { Preferences } from '@capacitor/preferences'
import { api } from '../services/api'

interface LoginProps {
  onLoginSuccess: () => void
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.login(email, password)

      // Store user info
      await Preferences.set({
        key: 'user',
        value: JSON.stringify(response.user),
      })

      onLoginSuccess()

      // Navigate to scanner
      history.push('/scanner')
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>CEM Scanner</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Login</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  type="email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value!)}
                  placeholder="Enter email"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Password</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                  placeholder="Enter password"
                />
              </IonItem>

              <IonButton
                expand="block"
                onClick={handleLogin}
                disabled={loading}
                style={{ marginTop: '20px' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={!!error}
          message={error}
          duration={3000}
          onDidDismiss={() => setError('')}
          color="danger"
        />
      </IonContent>
    </IonPage>
  )
}

export default Login
