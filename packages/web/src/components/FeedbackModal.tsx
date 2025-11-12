import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSendMessage } from '../hooks/useMessageQueries'

interface FeedbackModalProps {
  orderId: number
  orderNumber: number
  onClose: () => void
}

export default function FeedbackModal({ orderId, orderNumber, onClose }: FeedbackModalProps) {
  const { t } = useTranslation()
  const sendMessage = useSendMessage()
  const [feedback, setFeedback] = useState('')
  const [subject, setSubject] = useState(t('feedback.defaultSubject', { orderNumber }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    sendMessage.mutate(
      {
        subject,
        body: feedback,
        orderId,
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-xl mb-6">
          {t('feedback.title', { orderNumber })}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('feedback.subjectLabel')}</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('feedback.feedbackLabel')}</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full h-40 resize-none"
              placeholder={t('feedback.placeholder')}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </div>

          {sendMessage.isError && (
            <div className="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {sendMessage.error instanceof Error
                  ? sendMessage.error.message
                  : t('feedback.error')}
              </span>
            </div>
          )}

          <div className="modal-action mt-6">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={sendMessage.isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sendMessage.isPending || !feedback.trim()}
            >
              {sendMessage.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t('feedback.sending')}
                </>
              ) : (
                t('feedback.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
