import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts/UserContext'
import AddressForm from '../components/AddressForm'
import ConfirmModal from '../components/ConfirmModal'
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, type Address } from '../hooks/useAddressQueries'

export default function Addresses() {
  const { t } = useTranslation()
  const { user } = useUser()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null)

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
    setDeleteAddressId(id)
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
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error m-8">
        <span>{error instanceof Error ? error.message : t('address.loadError')}</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">{t('address.title') || 'My Addresses'}</h1>
        <button className="btn btn-primary" onClick={handleAddAddress}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('address.addNew') || 'Add New Address'}
        </button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <div className="alert alert-info">
          <span>{t('address.noAddresses') || 'No addresses saved yet.'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className={`card bg-base-100 shadow-xl ${address.isDefault ? 'ring-2 ring-primary' : ''}`}>
              <div className="card-body">
                {address.isDefault && (
                  <div className="badge badge-primary mb-2">{t('address.default') || 'Default'}</div>
                )}
                <h2 className="card-title">
                  {address.name}
                  {address.label && <span className="text-sm font-normal text-base-content/70">({address.label})</span>}
                </h2>
                <div className="text-sm space-y-1">
                  <p>{address.streetAddress}</p>
                  {address.streetAddress2 && <p>{address.streetAddress2}</p>}
                  <p>
                    {address.city}
                    {address.province && `, ${address.province}`}
                  </p>
                  {address.postalCode && <p>{address.postalCode}</p>}
                  <p>{address.country}</p>
                </div>
                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleEditAddress(address)}
                  >
                    {t('common.edit') || 'Edit'}
                  </button>
                  <button
                    className="btn btn-sm btn-ghost text-error"
                    onClick={() => handleDeleteAddress(address.id)}
                    disabled={deleteAddressMutation.isPending}
                  >
                    {t('common.delete') || 'Delete'}
                  </button>
                </div>
              </div>
            </div>
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

      <ConfirmModal
        isOpen={deleteAddressId !== null}
        title={t('address.confirmDelete')}
        message={t('address.confirmDeleteMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDangerous={true}
        onConfirm={() => {
          if (deleteAddressId !== null) {
            deleteAddressMutation.mutate(deleteAddressId)
            setDeleteAddressId(null)
          }
        }}
        onCancel={() => setDeleteAddressId(null)}
      />
    </div>
  )
}
