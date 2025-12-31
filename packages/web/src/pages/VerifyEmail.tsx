import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { Button, Card } from 'asterui'
import { CheckCircleIcon, XCircleIcon } from '@aster-ui/icons'

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
      <Card
        variant="shadow"
        className="w-full max-w-md"
        bodyClassName="items-center text-center"
        title={
          status === 'verifying' ? (
            <>
              <span className="loading loading-spinner loading-lg text-primary block mx-auto"></span>
              <span className="block mt-4">Verifying your email...</span>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircleIcon size={64} className="text-success mx-auto" />
              <span className="block text-success mt-4">Email Verified!</span>
            </>
          ) : (
            <>
              <XCircleIcon size={64} className="text-error mx-auto" />
              <span className="block text-error mt-4">Verification Failed</span>
            </>
          )
        }
        actions={
          status === 'error' ? (
            <Button
              type="primary"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          ) : undefined
        }
        actionsJustify="center"
      >
        {status === 'success' && (
          <>
            <p className="mt-2">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
          </>
        )}

        {status === 'error' && (
          <p className="mt-2">{message}</p>
        )}
      </Card>
    </div>
  )
}
