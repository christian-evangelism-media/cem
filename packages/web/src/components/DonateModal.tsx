import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { $api } from '../services/tuyau'
import { Grid, Modal, Button, Form, Input, Textarea } from 'asterui'

const { Row, Col } = Grid

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

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={t('donate.title') || 'Support Our Mission'}
      width={512}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel') || 'Cancel'}
        </Button>,
        <Button
          key="donate"
          type="primary"
          onClick={handleDonate}
          disabled={
            createCheckout.isPending ||
            (!isCustom && !amount) ||
            (isCustom && (!customAmount || parseFloat(customAmount) <= 0))
          }
          loading={createCheckout.isPending}
        >
          {createCheckout.isPending
            ? t('donate.processing') || 'Processing...'
            : t('donate.proceed') || 'Proceed to Payment'}
        </Button>,
      ]}
    >
      <p className="mb-6 text-sm opacity-70">
        {t('donate.description') ||
          'Support our mission to support evangelists worldwide'}
      </p>

      <div className="space-y-4">
        <Form.Item label={t('donate.selectAmount') || 'Select Amount'}>
          <Row gutter={8} className="mb-2">
            {presetAmounts.map((preset) => (
              <Col span={8} key={preset}>
                <Button
                  onClick={() => handlePresetClick(preset)}
                  type={amount === preset.toString() && !isCustom ? 'primary' : 'default'}
                  block
                >
                  ${preset}
                </Button>
              </Col>
            ))}
          </Row>
          <Button
            onClick={handleCustomClick}
            type={isCustom ? 'primary' : 'default'}
            block
          >
            {t('donate.customAmount') || 'Custom Amount'}
          </Button>
        </Form.Item>

        {isCustom && (
          <Form.Item label={t('donate.enterAmount') || 'Enter Amount'}>
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              addonBefore="$"
              className="w-full"
            />
          </Form.Item>
        )}

        <Form.Item label={t('donate.message') || 'Message (Optional)'}>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('donate.messagePlaceholder') || 'Leave a message...'}
            rows={3}
          />
        </Form.Item>
      </div>
    </Modal>
  )
}
