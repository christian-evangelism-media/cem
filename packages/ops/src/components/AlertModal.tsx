import { useTranslation } from 'react-i18next'

interface AlertModalProps {
  isOpen: boolean
  title: string
  message: string
  buttonText?: string
  onClose: () => void
  type?: 'info' | 'success' | 'warning' | 'error'
}

export default function AlertModal({
  isOpen,
  title,
  message,
  buttonText,
  onClose,
  type = 'info',
}: AlertModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const finalButtonText = buttonText || t('common.ok')

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'btn-success'
      case 'warning':
        return 'btn-warning'
      case 'error':
        return 'btn-error'
      default:
        return 'btn-primary'
    }
  }

  const getIconClasses = () => {
    switch (type) {
      case 'success':
        return 'text-success'
      case 'warning':
        return 'text-warning'
      case 'error':
        return 'text-error'
      default:
        return 'text-info'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )
      case 'warning':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )
      case 'error':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${getIconClasses()}`}>{getIcon()}</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="mb-6">{message}</p>
          </div>
        </div>
        <div className="modal-action">
          <button className={`btn ${getTypeClasses()}`} onClick={onClose}>
            {finalButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}
