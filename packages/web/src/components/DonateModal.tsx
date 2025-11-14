import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { $api } from '../services/tuyau'

interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  const presetAmounts = [10, 25, 50, 100, 250, 500]

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const createCheckout = useMutation({
    mutationFn: async (donationAmount: number) => {
      const response = await $api.donations.checkout.$post({
        amount: donationAmount,
        currency: 'CAD',
        message: message || undefined,
      })
      return response
    },
    onSuccess: (data: any) => {
      // Tuyau might wrap the response differently
      const url = data?.url || data?.data?.url
      if (url) {
        window.location.href = url
      }
    },
    onError: (error) => {
      console.error('Checkout error:', error)
      alert('Error creating checkout session')
    },
  })

  const handleDonate = () => {
    const donationAmount = isCustom ? parseFloat(customAmount) : parseFloat(amount)

    if (!donationAmount || donationAmount <= 0) {
      return
    }

    createCheckout.mutate(donationAmount)
  }

  const handlePresetClick = (preset: number) => {
    setAmount(preset.toString())
    setIsCustom(false)
    setCustomAmount('')
  }

  const handleCustomClick = () => {
    setIsCustom(true)
    setAmount('')
  }

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{t('donate.title') || 'Support Our Mission'}</h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="Close"
          >
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
          </button>
        </div>

        <p className="mb-6 text-sm opacity-70">
          {t('donate.description') ||
            'Support our mission to support evangelists worldwide'}
        </p>

        <div className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">{t('donate.selectAmount') || 'Select Amount'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`btn ${amount === preset.toString() && !isCustom ? 'btn-primary' : 'btn-outline'}`}
                >
                  ${preset}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCustomClick}
              className={`btn btn-block ${isCustom ? 'btn-primary' : 'btn-outline'}`}
            >
              {t('donate.customAmount') || 'Custom Amount'}
            </button>
          </div>

          {isCustom && (
            <div>
              <label className="label">
                <span className="label-text">{t('donate.enterAmount') || 'Enter Amount'}</span>
              </label>
              <div className="join w-full">
                <span className="join-item btn btn-disabled">$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  className="input input-bordered join-item flex-1"
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">
              <span className="label-text">
                {t('donate.message') || 'Message (Optional)'}
              </span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('donate.messagePlaceholder') || 'Leave a message...'}
              className="textarea textarea-bordered w-full"
              rows={3}
            />
          </div>

          <div className="modal-action">
            <button onClick={onClose} className="btn btn-ghost">
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleDonate}
              disabled={
                createCheckout.isPending ||
                (!isCustom && !amount) ||
                (isCustom && (!customAmount || parseFloat(customAmount) <= 0))
              }
              className="btn btn-primary"
            >
              {createCheckout.isPending
                ? t('donate.processing') || 'Processing...'
                : t('donate.proceed') || 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
