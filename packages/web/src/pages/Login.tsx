import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts/UserContext'
import { api } from '../services/api'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const REMEMBERED_EMAIL_KEY = 'rememberedEmail'

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setUser } = useUser()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      rememberMe: false,
    },
  })

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (rememberedEmail) {
      setValue('email', rememberedEmail)
      setValue('rememberMe', true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    setServerError('')

    try {
      // Save or clear email in localStorage based on rememberMe checkbox
      if (data.rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email)
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }

      const response = await api.auth.login(data)
      setUser(response.user)
      navigate('/media')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-8">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4 md:p-6">
          <h1 className="card-title text-2xl md:text-3xl mb-4">{t('auth.loginTitle')}</h1>

          {serverError && (
            <div className="alert alert-error mb-4">
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-control mb-1">
              <label className="label">
                <span className="label-text">{t('auth.email')}</span>
              </label>
              <input
                type="email"
                {...register('email', {
                  required: t('auth.errors.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('auth.errors.emailInvalid'),
                  },
                })}
                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
              />
              <div className="h-6 mt-1">
                {errors.email && (
                  <span className="text-error text-sm">{errors.email.message}</span>
                )}
              </div>
            </div>

            <div className="form-control mb-1">
              <label className="label">
                <span className="label-text">{t('auth.password')}</span>
              </label>
              <input
                type="password"
                {...register('password', {
                  required: t('auth.errors.passwordRequired'),
                })}
                className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
              />
              <div className="h-6 mt-1">
                {errors.password && (
                  <span className="text-error text-sm">{errors.password.message}</span>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  defaultChecked={false}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">{t('auth.rememberMe')}</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={isSubmitting}>
              {isSubmitting ? <span className="loading loading-spinner"></span> : t('auth.loginButton')}
            </button>
          </form>

          <p className="text-center mt-4">
            {t('auth.noAccount')} <Link to="/register" className="link link-primary">{t('auth.registerLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
