import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">
          {address ? t('address.editTitle') || 'Edit Address' : t('address.addTitle') || 'Add New Address'}
        </h3>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">{t('address.name') || 'Recipient Name'}</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Label Field (optional - e.g., "Home", "Work") */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">{t('address.label') || 'Label (Optional)'}</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder={t('address.labelPlaceholder') || 'e.g., Home, Work, Church'}
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />
          </div>

          {/* Address Autocomplete */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">{t('address.search') || 'Search Address'}</span>
            </label>
            <AddressAutocomplete
              onSelect={handleAutocompleteSelect}
              defaultValue={formData.streetAddress}
              placeholder={t('address.searchPlaceholder') || 'Start typing your address...'}
            />
          </div>

          {/* Street Address */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">{t('address.street') || 'Street Address'}</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              required
            />
          </div>

          {/* Street Address Line 2 */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">{t('address.street2') || 'Apartment, suite, etc. (Optional)'}</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.streetAddress2}
              onChange={(e) => setFormData({ ...formData, streetAddress2: e.target.value })}
            />
          </div>

          {/* City and Province */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('address.city') || 'City'}</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('address.province') || 'Province / State'}</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              />
            </div>
          </div>

          {/* Postal Code and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('address.postalCode') || 'Postal Code'}</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('address.country') || 'Country Code (e.g., CA, US)'}</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="CA"
                maxLength={2}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          {/* Is Default */}
          <div className="form-control mb-4">
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              />
              <span className="label-text">{t('address.setDefault') || 'Set as default address'}</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="modal-action">
            <button type="button" className="btn" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel') || 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="loading loading-spinner"></span>
              ) : address ? (
                t('common.update') || 'Update'
              ) : (
                t('common.add') || 'Add'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
