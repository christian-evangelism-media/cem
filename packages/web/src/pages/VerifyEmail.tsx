import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { Button, Result } from 'asterui'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const hasVerified = useRef(false)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    if (hasVerified.current) {
      return
    }

    hasVerified.current = true

    const verifyEmail = async () => {
      try {
        const response = await api.get(`/verify-email?token=${token}`)
        setStatus('success')
        setMessage(response.message)

        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } catch (error: any) {
        setStatus('error')
        setMessage(error.message || 'Verification failed')
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="w-full max-w-md">
        {status === 'verifying' && (
          <Result
            icon={<span className="loading loading-spinner loading-lg text-primary"></span>}
            title="Verifying your email..."
          />
        )}

        {status === 'success' && (
          <Result
            status="success"
            title="Email Verified!"
            subTitle={message}
          >
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </Result>
        )}

        {status === 'error' && (
          <Result
            status="error"
            title="Verification Failed"
            subTitle={message}
            extra={
              <Button type="primary" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
