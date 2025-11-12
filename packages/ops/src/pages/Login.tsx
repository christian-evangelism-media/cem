import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const REMEMBERED_EMAIL_KEY = 'adminRememberedEmail'

export default function Login() {
  const [serverError, setServerError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
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

      await login(data.email, data.password)
      navigate('/')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('auth.loginFailed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-6">{t('nav.appName')}</h1>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start mb-4">
              <h2 className="card-title text-2xl font-bold">
                {t('auth.title')}
              </h2>
              <LanguageSwitcher />
            </div>

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
                  required: t('auth.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('auth.emailInvalid'),
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
                  required: t('auth.passwordRequired'),
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
              {isSubmitting ? <span className="loading loading-spinner"></span> : t('auth.login')}
            </button>
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}
