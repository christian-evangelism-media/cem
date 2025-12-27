import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts/UserContext'
import AddressForm from '../components/AddressForm'
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, type Address } from '../hooks/useAddressQueries'
import { Alert, Badge, Button, Card, Loading, Modal, Typography } from 'asterui'

const { Title, Paragraph } = Typography

export default function Addresses() {
  const { t } = useTranslation()
  const { user } = useUser()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  // Fetch addresses
  const {
    data: addresses = [],
    isLoading,
    error,
  } = useAddresses(!!user)

  // Mutations
  const createAddressMutation = useCreateAddress()
  const updateAddressMutation = useUpdateAddress()
  const deleteAddressMutation = useDeleteAddress()

  const handleAddAddress = () => {
    setEditingAddress(null)
    setIsFormOpen(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setIsFormOpen(true)
  }

  const handleDeleteAddress = (id: number) => {
    Modal.confirm({
      title: t('address.confirmDelete'),
      content: t('address.confirmDeleteMessage'),
      okText: t('common.delete'),
      type: 'error',
      cancelText: t('common.cancel'),
      onOk: () => {
        deleteAddressMutation.mutate(id)
      },
    })
  }

  const handleFormSubmit = async (addressData: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingAddress) {
      await updateAddressMutation.mutateAsync({ id: editingAddress.id, data: addressData })
    } else {
      await createAddressMutation.mutateAsync(addressData)
    }
    setIsFormOpen(false)
    setEditingAddress(null)
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingAddress(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-8">
        <Alert color="error">
          {error instanceof Error ? error.message : t('address.loadError')}
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Title level={1} className="text-3xl md:text-4xl">{t('address.title')}</Title>
        <Button type="primary" onClick={handleAddAddress}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('address.addNew')}
        </Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <Alert color="info">{t('address.noAddresses')}</Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={`shadow-xl ${address.isDefault ? 'ring-2 ring-primary' : ''}`}
            >
              {address.isDefault && (
                <Badge type="primary" className="mb-2">{t('address.default')}</Badge>
              )}
              <Title level={2}>
                {address.name}
                {address.label && <span className="text-sm font-normal text-base-content/70">({address.label})</span>}
              </Title>
              <div className="text-sm space-y-1">
                <Paragraph size="sm">{address.streetAddress}</Paragraph>
                {address.streetAddress2 && <Paragraph size="sm">{address.streetAddress2}</Paragraph>}
                <Paragraph size="sm">
                  {address.city}
                  {address.province && `, ${address.province}`}
                </Paragraph>
                {address.postalCode && <Paragraph size="sm">{address.postalCode}</Paragraph>}
                <Paragraph size="sm">{address.country}</Paragraph>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  size="sm"
                  ghost
                  onClick={() => handleEditAddress(address)}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  size="sm"
                  ghost
                  className="text-error"
                  onClick={() => handleDeleteAddress(address.id)}
                  loading={deleteAddressMutation.isPending}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddressForm
        isOpen={isFormOpen}
        address={editingAddress || undefined}
        defaultName={user ? `${user.firstName} ${user.lastName}` : ''}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
