import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'

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
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          {status === 'verifying' && (
            <>
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <h2 className="card-title mt-4">Verifying your email...</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <svg
                className="w-16 h-16 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="card-title text-success mt-4">Email Verified!</h2>
              <p className="mt-2">{message}</p>
              <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <svg
                className="w-16 h-16 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="card-title text-error mt-4">Verification Failed</h2>
              <p className="mt-2">{message}</p>
              <div className="card-actions mt-4">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
