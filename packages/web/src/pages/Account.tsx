import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts/UserContext'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function Account() {
  const { t } = useTranslation()
  const { user, setUser } = useUser()
  const { showToast } = useToast()

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormData>()

  const newPassword = watch('newPassword')

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const response = await api.auth.updateProfile(data)
      setUser(response.user)
      showToast(t('account.profileUpdated'), 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('account.profileUpdateFailed'), 'error')
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await api.auth.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      showToast(t('account.passwordChanged'), 'success')
      resetPassword()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('account.passwordChangeFailed'), 'error')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-4 md:pt-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">{t('account.title')}</h1>

      {/* Profile Section */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">{t('account.profileInfo')}</h2>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control mb-1">
                <label className="label">
                  <span className="label-text">{t('account.firstName')}</span>
                </label>
                <input
                  type="text"
                  {...registerProfile('firstName', {
                    required: t('account.firstNameRequired'),
                    minLength: { value: 2, message: t('account.firstNameMinLength') },
                  })}
                  className={`input input-bordered w-full ${profileErrors.firstName ? 'input-error' : ''}`}
                />
                <div className="h-6 mt-1">
                  {profileErrors.firstName && (
                    <span className="text-error text-sm">{profileErrors.firstName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-control mb-1">
                <label className="label">
                  <span className="label-text">{t('account.lastName')}</span>
                </label>
                <input
                  type="text"
                  {...registerProfile('lastName', {
                    required: t('account.lastNameRequired'),
                    minLength: { value: 2, message: t('account.lastNameMinLength') },
                  })}
                  className={`input input-bordered w-full ${profileErrors.lastName ? 'input-error' : ''}`}
                />
                <div className="h-6 mt-1">
                  {profileErrors.lastName && (
                    <span className="text-error text-sm">{profileErrors.lastName.message}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-control mb-1">
              <label className="label">
                <span className="label-text">{t('account.email')}</span>
              </label>
              <input
                type="email"
                {...registerProfile('email', {
                  required: t('account.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('account.emailInvalid'),
                  },
                })}
                className={`input input-bordered w-full ${profileErrors.email ? 'input-error' : ''}`}
              />
              <div className="h-6 mt-1">
                {profileErrors.email && (
                  <span className="text-error text-sm">{profileErrors.email.message}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full md:w-auto mt-4"
              disabled={isProfileSubmitting}
            >
              {isProfileSubmitting ? <span className="loading loading-spinner"></span> : t('account.updateProfile')}
            </button>
          </form>
        </div>
      </div>

      {/* Password Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">{t('account.changePassword')}</h2>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
            <div className="form-control mb-1">
              <label className="label">
                <span className="label-text">{t('account.currentPassword')}</span>
              </label>
              <input
                type="password"
                {...registerPassword('currentPassword', {
                  required: t('account.currentPasswordRequired'),
                })}
                className={`input input-bordered w-full ${passwordErrors.currentPassword ? 'input-error' : ''}`}
              />
              <div className="h-6 mt-1">
                {passwordErrors.currentPassword && (
                  <span className="text-error text-sm">{passwordErrors.currentPassword.message}</span>
                )}
              </div>
            </div>

            <div className="form-control mb-1">
              <label className="label">
                <span className="label-text">{t('account.newPassword')}</span>
              </label>
              <input
                type="password"
                {...registerPassword('newPassword', {
                  required: t('account.newPasswordRequired'),
                  minLength: { value: 8, message: t('account.passwordMinLength') },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
                    message: t('account.passwordPattern'),
                  },
                })}
                className={`input input-bordered w-full ${passwordErrors.newPassword ? 'input-error' : ''}`}
              />
              <div className="h-6 mt-1">
                {passwordErrors.newPassword && (
                  <span className="text-error text-sm">{passwordErrors.newPassword.message}</span>
                )}
              </div>
            </div>

            <div className="form-control mb-1">
              <label className="label">
                <span className="label-text">{t('account.confirmPassword')}</span>
              </label>
              <input
                type="password"
                {...registerPassword('confirmPassword', {
                  required: t('account.confirmPasswordRequired'),
                  validate: (value) => value === newPassword || t('account.passwordsNoMatch'),
                })}
                className={`input input-bordered w-full ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
              />
              <div className="h-6 mt-1">
                {passwordErrors.confirmPassword && (
                  <span className="text-error text-sm">{passwordErrors.confirmPassword.message}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full md:w-auto mt-4"
              disabled={isPasswordSubmitting}
            >
              {isPasswordSubmitting ? <span className="loading loading-spinner"></span> : t('account.changePasswordButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
