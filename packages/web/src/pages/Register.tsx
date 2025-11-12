import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'

interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

interface PasswordRequirement {
  key: string
  test: (password: string) => boolean
}

function validatePassword(password: string, t: (key: string) => string): { isValid: boolean; errors: string[] } {
  const requirements: PasswordRequirement[] = [
    { key: 'auth.passwordRequirements.length', test: (p) => p.length >= 8 },
    { key: 'auth.passwordRequirements.lowercase', test: (p) => /[a-z]/.test(p) },
    { key: 'auth.passwordRequirements.uppercase', test: (p) => /[A-Z]/.test(p) },
    { key: 'auth.passwordRequirements.number', test: (p) => /[0-9]/.test(p) },
    { key: 'auth.passwordRequirements.special', test: (p) => /[^a-zA-Z0-9]/.test(p) },
  ]

  const errors = requirements.filter(req => !req.test(password)).map(req => t(req.key))

  return { isValid: errors.length === 0, errors }
}

function getPasswordStrength(password: string, t: (key: string) => string): { score: number; label: string; color: string } {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
    password.length >= 12,
  ]

  const score = checks.filter(Boolean).length

  if (score <= 2) return { score, label: t('auth.passwordStrength.weak'), color: 'error' }
  if (score <= 4) return { score, label: t('auth.passwordStrength.fair'), color: 'warning' }
  if (score === 5) return { score, label: t('auth.passwordStrength.good'), color: 'info' }
  return { score, label: t('auth.passwordStrength.strong'), color: 'success' }
}

export default function Register() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>()

  const password = watch('password', '')
  const passwordStrength = password ? getPasswordStrength(password, t) : null
  const passwordValidation = password ? validatePassword(password, t) : null

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('')

    try {
      const { confirmPassword, ...registerData } = data
      await api.auth.register(registerData)
      navigate('/login')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-8">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4 md:p-6">
          <h1 className="card-title text-2xl md:text-3xl mb-4">{t('auth.registerTitle')}</h1>

          {serverError && (
            <div className="alert alert-error mb-4">
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-control mb-1">
              <label className="label">
                <span className="label-text">{t('auth.firstName')}</span>
              </label>
              <input
                type="text"
                {...register('firstName', {
                  required: t('auth.errors.firstNameRequired'),
                  minLength: {
                    value: 2,
                    message: t('auth.errors.firstNameMin'),
                  },
                })}
                className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
              />
              <div className="h-6 mt-1">
                {errors.firstName && (
                  <span className="text-error text-sm">{errors.firstName.message}</span>
                )}
              </div>
            </div>

            <div className="form-control mb-1">
              <label className="label">
                <span className="label-text">{t('auth.lastName')}</span>
              </label>
              <input
                type="text"
                {...register('lastName', {
                  required: t('auth.errors.lastNameRequired'),
                  minLength: {
                    value: 2,
                    message: t('auth.errors.lastNameMin'),
                  },
                })}
                className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`}
              />
              <div className="h-6 mt-1">
                {errors.lastName && (
                  <span className="text-error text-sm">{errors.lastName.message}</span>
                )}
              </div>
            </div>

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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: t('auth.errors.passwordRequired'),
                    validate: (value) => {
                      const validation = validatePassword(value, t)
                      return validation.isValid || t('auth.errors.passwordRequirements')
                    },
                  })}
                  className={`input input-bordered w-full pe-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <div className="h-6 mt-1">
                {errors.password && (
                  <span className="text-error text-sm">{errors.password.message}</span>
                )}
              </div>

              {password && passwordStrength && (
                <div className="mb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <progress
                      className={`progress progress-${passwordStrength.color} w-full`}
                      value={passwordStrength.score}
                      max="6"
                    ></progress>
                    <span className={`text-${passwordStrength.color} text-sm font-medium min-w-[60px]`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  {passwordValidation && !passwordValidation.isValid && (
                    <div className="text-xs text-base-content/70 space-y-1 mt-2">
                      <div className="font-medium">{t('auth.passwordRequirements.title')}</div>
                      {passwordValidation.errors.map((err, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="text-error">✗</span>
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-control mb-1">
              <label className="label">
                <span className="label-text">{t('auth.confirmPassword')}</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: t('auth.errors.confirmPasswordRequired'),
                    validate: (value) => value === password || t('auth.errors.passwordsNotMatch'),
                  })}
                  className={`input input-bordered w-full pe-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <div className="h-6 mt-1">
                {errors.confirmPassword && (
                  <span className="text-error text-sm">{errors.confirmPassword.message}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-4"
              disabled={isSubmitting || (passwordValidation ? !passwordValidation.isValid : false)}
            >
              {isSubmitting ? <span className="loading loading-spinner"></span> : t('auth.registerButton')}
            </button>
          </form>

          <p className="text-center mt-4">
            {t('auth.hasAccount')} <Link to="/login" className="link link-primary">{t('auth.loginLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
