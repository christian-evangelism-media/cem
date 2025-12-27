import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Alert, Form, Input, Checkbox, Button } from 'asterui'
import AddressAutocomplete from './AddressAutocomplete'

interface Address {
  id?: number
  name: string
  label?: string
  streetAddress: string
  streetAddress2?: string
  city: string
  province?: string
  postalCode?: string
  country: string
  isDefault: boolean
}

interface AddressFormProps {
  address?: Address
  defaultName?: string
  onSubmit: (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCancel: () => void
  isOpen: boolean
}

export default function AddressForm({
  address,
  defaultName = '',
  onSubmit,
  onCancel,
  isOpen,
}: AddressFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    name: defaultName,
    label: '',
    streetAddress: '',
    streetAddress2: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    isDefault: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Update form when address prop changes
  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name,
        label: address.label || '',
        streetAddress: address.streetAddress,
        streetAddress2: address.streetAddress2 || '',
        city: address.city,
        province: address.province || '',
        postalCode: address.postalCode || '',
        country: address.country,
        isDefault: address.isDefault || false,
      })
    } else {
      // Reset form for new address, but keep default name
      setFormData({
        name: defaultName,
        label: '',
        streetAddress: '',
        streetAddress2: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
        isDefault: false,
      })
    }
  }, [address, defaultName])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  const handleAutocompleteSelect = (parsedAddress: any) => {
    setFormData((prev) => ({
      ...prev,
      streetAddress: parsedAddress.streetAddress,
      city: parsedAddress.city || prev.city,
      province: parsedAddress.province || prev.province,
      postalCode: parsedAddress.postalCode || prev.postalCode,
      country: parsedAddress.countryCode || prev.country,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError(t('address.errors.nameRequired') || 'Name is required')
      return
    }
    if (!formData.streetAddress.trim()) {
      setError(t('address.errors.streetRequired') || 'Street address is required')
      return
    }
    if (!formData.city.trim()) {
      setError(t('address.errors.cityRequired') || 'City is required')
      return
    }
    if (!formData.country.trim()) {
      setError(t('address.errors.countryRequired') || 'Country is required')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onCancel}
      title={address ? t('address.editTitle') || 'Edit Address' : t('address.addTitle') || 'Add New Address'}
      width={800}
      footer={null}
    >
      {error && (
        <Alert type="error" className="mb-4">
          <span>{error}</span>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <Form.Item label={t('address.name') || 'Recipient Name'} required className="mb-4">
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </Form.Item>

          {/* Label Field (optional - e.g., "Home", "Work") */}
          <Form.Item label={t('address.label') || 'Label (Optional)'} className="mb-4">
            <Input
              type="text"
              placeholder={t('address.labelPlaceholder') || 'e.g., Home, Work, Church'}
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />
          </Form.Item>

          {/* Address Autocomplete */}
          <Form.Item label={t('address.search') || 'Search Address'} className="mb-4">
            <AddressAutocomplete
              onSelect={handleAutocompleteSelect}
              defaultValue={formData.streetAddress}
              placeholder={t('address.searchPlaceholder') || 'Start typing your address...'}
            />
          </Form.Item>

          {/* Street Address */}
          <Form.Item label={t('address.street') || 'Street Address'} required className="mb-4">
            <Input
              type="text"
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              required
            />
          </Form.Item>

          {/* Street Address Line 2 */}
          <Form.Item label={t('address.street2') || 'Apartment, suite, etc. (Optional)'} className="mb-4">
            <Input
              type="text"
              value={formData.streetAddress2}
              onChange={(e) => setFormData({ ...formData, streetAddress2: e.target.value })}
            />
          </Form.Item>

          {/* City and Province */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Form.Item label={t('address.city') || 'City'} required>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </Form.Item>

            <Form.Item label={t('address.province') || 'Province / State'}>
              <Input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              />
            </Form.Item>
          </div>

          {/* Postal Code and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Form.Item label={t('address.postalCode') || 'Postal Code'}>
              <Input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </Form.Item>

            <Form.Item label={t('address.country') || 'Country Code (e.g., CA, US)'} required>
              <Input
                type="text"
                placeholder="CA"
                maxLength={2}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                required
              />
            </Form.Item>
          </div>

          {/* Is Default */}
          <div className="mb-4">
            <Checkbox
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            >
              {t('address.setDefault') || 'Set as default address'}
            </Checkbox>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {address ? t('common.update') || 'Update' : t('common.add') || 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
  )
}
