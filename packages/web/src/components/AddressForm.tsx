import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Alert, Form, Input, Checkbox, Button, Grid } from 'asterui'
import AddressAutocomplete from './AddressAutocomplete'

const { Row, Col } = Grid

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
  const form = Form.useForm<Omit<Address, 'id'>>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Update form when address prop changes
  useEffect(() => {
    if (address) {
      form.setFieldsValue({
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
      form.setFieldsValue({
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
  }, [address, defaultName, form])

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
    const currentValues = form.getFieldsValue()
    form.setFieldsValue({
      streetAddress: parsedAddress.streetAddress,
      city: parsedAddress.city || currentValues.city,
      province: parsedAddress.province || currentValues.province,
      postalCode: parsedAddress.postalCode || currentValues.postalCode,
      country: parsedAddress.countryCode || currentValues.country,
    })
  }

  const handleSubmit = async (values: Omit<Address, 'id'>) => {
    setError('')
    setIsSubmitting(true)

    try {
      await onSubmit(values)
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

      <Form
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          name: defaultName,
          label: '',
          streetAddress: '',
          streetAddress2: '',
          city: '',
          province: '',
          postalCode: '',
          country: '',
          isDefault: false,
        }}
      >
          {/* Name Field */}
          <Form.Item
            name="name"
            label={t('address.name') || 'Recipient Name'}
            rules={[{ required: true, message: t('address.errors.nameRequired') || 'Name is required' }]}
            className="mb-4"
          >
            <Input type="text" />
          </Form.Item>

          {/* Label Field (optional - e.g., "Home", "Work") */}
          <Form.Item
            name="label"
            label={t('address.label') || 'Label (Optional)'}
            className="mb-4"
          >
            <Input
              type="text"
              placeholder={t('address.labelPlaceholder') || 'e.g., Home, Work, Church'}
            />
          </Form.Item>

          {/* Address Autocomplete */}
          <Form.Item label={t('address.search') || 'Search Address'} className="mb-4">
            <AddressAutocomplete
              onSelect={handleAutocompleteSelect}
              placeholder={t('address.searchPlaceholder') || 'Start typing your address...'}
            />
          </Form.Item>

          {/* Street Address */}
          <Form.Item
            name="streetAddress"
            label={t('address.street') || 'Street Address'}
            rules={[{ required: true, message: t('address.errors.streetRequired') || 'Street address is required' }]}
            className="mb-4"
          >
            <Input type="text" />
          </Form.Item>

          {/* Street Address Line 2 */}
          <Form.Item
            name="streetAddress2"
            label={t('address.street2') || 'Apartment, suite, etc. (Optional)'}
            className="mb-4"
          >
            <Input type="text" />
          </Form.Item>

          {/* City and Province */}
          <Row gutter={16} className="mb-4">
            <Col xs={24} md={12}>
              <Form.Item
                name="city"
                label={t('address.city') || 'City'}
                rules={[{ required: true, message: t('address.errors.cityRequired') || 'City is required' }]}
              >
                <Input type="text" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="province"
                label={t('address.province') || 'Province / State'}
              >
                <Input type="text" />
              </Form.Item>
            </Col>
          </Row>

          {/* Postal Code and Country */}
          <Row gutter={16} className="mb-4">
            <Col xs={24} md={12}>
              <Form.Item
                name="postalCode"
                label={t('address.postalCode') || 'Postal Code'}
              >
                <Input type="text" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="country"
                label={t('address.country') || 'Country Code (e.g., CA, US)'}
                rules={[{ required: true, message: t('address.errors.countryRequired') || 'Country is required' }]}
              >
                <Input
                  type="text"
                  placeholder="CA"
                  maxLength={2}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    form.setFieldValue('country', value)
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Is Default */}
          <Form.Item name="isDefault" valuePropName="checked" className="mb-4">
            <Checkbox>
              {t('address.setDefault') || 'Set as default address'}
            </Checkbox>
          </Form.Item>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {address ? t('common.update') || 'Update' : t('common.add') || 'Add'}
            </Button>
          </div>
        </Form>
      </Modal>
  )
}
