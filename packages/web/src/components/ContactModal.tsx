import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const sendMessageMutation = useMutation({
    mutationFn: (data: { subject: string; body: string }) =>
      api.post('/messages', data),
    onSuccess: () => {
      showToast(t('contact.messageSent'), 'success')
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      setSubject('')
      setBody('')
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (subject.trim() && body.trim()) {
      sendMessageMutation.mutate({ subject: subject.trim(), body: body.trim() })
    }
  }

  const handleClose = () => {
    setSubject('')
    setBody('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-xl mb-6">{t('contact.title')}</h3>

        <div className="alert alert-info mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{t('contact.responseTime')}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('contact.subject')}</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('contact.subjectPlaceholder')}
              maxLength={200}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('contact.message')}</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full h-40 resize-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('contact.messagePlaceholder')}
              required
            />
          </div>

          {sendMessageMutation.isError && (
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
                {sendMessageMutation.error instanceof Error
                  ? sendMessageMutation.error.message
                  : t('contact.messageError')}
              </span>
            </div>
          )}

          <div className="modal-action mt-6">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={sendMessageMutation.isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!subject.trim() || !body.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t('contact.sending')}
                </>
              ) : (
                t('contact.send')
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  )
}
