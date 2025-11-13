import { useTranslation } from 'react-i18next'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDangerous?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const finalConfirmText = confirmText || t('common.confirm')
  const finalCancelText = cancelText || t('common.cancel')

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        <p className="mb-6">{message}</p>
        <div className="modal-action">
          <button className="btn" onClick={onCancel}>
            {finalCancelText}
          </button>
          <button
            className={`btn ${isDangerous ? 'btn-error' : 'btn-primary'}`}
            onClick={() => {
              onConfirm()
              onCancel()
            }}
          >
            {finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
