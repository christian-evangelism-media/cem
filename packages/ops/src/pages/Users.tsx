import { useState, useDeferredValue } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { DateTime } from 'luxon'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import type { User, PaginatedResponse } from '../types'
import ConfirmModal from '../components/ConfirmModal'

interface CreateUserFormData {
  firstName: string
  lastName: string
  email: string
  role: string
}

interface EditUserFormData {
  firstName: string
  lastName: string
  email: string
}

export default function Users() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const { t, i18n } = useTranslation()

  // Defer search to avoid blocking input
  const search = useDeferredValue(searchInput)

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<CreateUserFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
    },
  })

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditing },
  } = useForm<EditUserFormData>()

  const { data, isLoading, error } = useQuery<PaginatedResponse<User>>({
    queryKey: ['users', page, search],
    queryFn: () => api.users.list({ page, limit: 20, search }),
    placeholderData: keepPreviousData,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateUserFormData) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreateModal(false)
      resetCreate()
      setCreateError('')
    },
    onError: (error: Error) => {
      setCreateError(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditUserFormData }) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowEditModal(false)
      setSelectedUser(null)
      resetEdit()
      setEditError('')
    },
    onError: (error: Error) => {
      setEditError(error.message)
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => api.users.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const toggleBlockMutation = useMutation({
    mutationFn: (id: number) => api.users.toggleBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      api.users.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingNotesId(null)
      setNotesValue('')
    },
    onError: (error: Error) => {
      alert(`Failed to update notes: ${error.message}`)
    },
  })

  const startEditNotes = (user: User) => {
    setEditingNotesId(user.id)
    setNotesValue(user.notes || '')
  }

  const saveNotes = (userId: number) => {
    updateNotesMutation.mutate({ id: userId, notes: notesValue })
  }

  const cancelEditNotes = () => {
    setEditingNotesId(null)
    setNotesValue('')
  }

  const canChangeRole = (user: User) => {
    if (user.role === 'super_admin') return false
    if (user.id === currentUser?.id) return false
    if (currentUser?.role === 'super_admin') return true
    if (currentUser?.role === 'admin') {
      return user.role !== 'admin'
    }
    return false
  }

  const canEditUser = (user: User) => {
    if (currentUser?.role === 'super_admin') return true
    if (currentUser?.role === 'admin') {
      if (user.role === 'super_admin') return false
      if (user.role === 'admin' && user.id !== currentUser.id) return false
      return true
    }
    return false
  }

  const handleCreateUser = (data: CreateUserFormData) => {
    setCreateError('')
    createMutation.mutate(data)
  }

  const handleEditUser = (data: EditUserFormData) => {
    setEditError('')
    if (selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        data,
      })
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    resetEdit({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    })
    setEditError('')
    setShowEditModal(true)
  }

  const openCreateModal = () => {
    resetCreate({
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
    })
    setCreateError('')
    setShowCreateModal(true)
  }

  const getRoleOptions = () => {
    if (currentUser?.role === 'super_admin') {
      return ['user', 'help', 'support', 'admin']
    }
    return ['user', 'help', 'support']
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
      <div className="p-8">
        <div className="alert alert-error">
          <span>{t('common.errorLoading', { resource: t('nav.users').toLowerCase() })}: {error instanceof Error ? error.message : t('common.unknownError')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('users.title')}</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          {t('users.addNew')}
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="mb-4">
            <input
              type="text"
              placeholder={t('users.searchPlaceholder')}
              className="input input-bordered w-full max-w-md"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-16">{t('users.id')}</th>
                  <th>{t('users.name')}</th>
                  <th className="w-56">{t('users.email')}</th>
                  <th className="w-40">{t('users.role')}</th>
                  <th className="w-28">{t('users.verified')}</th>
                  <th className="w-32">{t('users.languages')}</th>
                  <th className="w-64">{t('users.notes')}</th>
                  <th className="w-32">{t('users.joined')}</th>
                  <th className="w-80">{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{user.firstName} {user.lastName}</span>
                        {user.isBlocked && (
                          <span className="badge badge-sm badge-error">{t('users.blocked')}</span>
                        )}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {canChangeRole(user) ? (
                        <select
                          className="select select-bordered select-sm"
                          value={user.role}
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              id: user.id,
                              role: e.target.value,
                            })
                          }
                        >
                          {getRoleOptions().map((role) => (
                            <option key={role} value={role}>
                              {t(`users.roles.${role}`)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`badge ${
                          user.role === 'super_admin' ? 'badge-error' :
                          user.role === 'admin' ? 'badge-primary' :
                          user.role === 'support' ? 'badge-secondary' :
                          user.role === 'help' ? 'badge-accent' :
                          'badge-ghost'
                        }`}>
                          {t(`users.roles.${user.role}`)}
                        </span>
                      )}
                    </td>
                    <td>
                      {user.emailVerifiedAt ? (
                        <span className="badge badge-success">{t('users.verifiedStatus.verified')}</span>
                      ) : (
                        <span className="badge badge-warning">{t('users.verifiedStatus.unverified')}</span>
                      )}
                    </td>
                    <td>
                      {user.preferredLanguages ? (
                        <div className="flex gap-1 flex-wrap">
                          {user.preferredLanguages.map((lang) => (
                            <span key={lang} className="badge badge-sm badge-accent">
                              {lang}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">{t('users.none')}</span>
                      )}
                    </td>
                    <td>
                      {currentUser?.role === 'help' ? (
                        // Help role: read-only notes display
                        <div className="text-sm py-2">
                          {user.notes ? (
                            <span className="line-clamp-2">{user.notes}</span>
                          ) : (
                            <span className="text-gray-400 italic">{t('users.noNotes')}</span>
                          )}
                        </div>
                      ) : editingNotesId === user.id ? (
                        <div className="flex gap-1">
                          <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            className="textarea textarea-bordered textarea-sm w-48 min-h-16"
                            placeholder={t('users.notes')}
                            autoFocus
                            rows={2}
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => saveNotes(user.id)}
                              disabled={updateNotesMutation.isPending}
                            >
                              ✓
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={cancelEditNotes}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-ghost text-left justify-start w-full h-auto whitespace-normal py-2"
                          onClick={() => startEditNotes(user)}
                          title={user.notes ? t('users.editNotes') : t('users.addNotes')}
                        >
                          {user.notes ? (
                            <span className="text-sm line-clamp-2">{user.notes}</span>
                          ) : (
                            <span className="text-gray-400 italic text-sm">{t('users.noNotes')}</span>
                          )}
                        </button>
                      )}
                    </td>
                    <td>
                      {DateTime.fromISO(user.createdAt).setLocale(i18n.language).toLocaleString(DateTime.DATE_MED)}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {canEditUser(user) && (
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => openEditModal(user)}
                          >
                            {t('users.edit')}
                          </button>
                        )}
                        {canEditUser(user) && (
                          <button
                            className={`btn btn-sm ${user.isBlocked ? 'btn-success' : 'btn-warning'}`}
                            onClick={() => toggleBlockMutation.mutate(user.id)}
                            disabled={toggleBlockMutation.isPending}
                          >
                            {user.isBlocked ? t('users.unblock') : t('users.block')}
                          </button>
                        )}
                        {canEditUser(user) && (
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => setDeleteUserId(user.id)}
                          >
                            {t('users.delete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.meta.lastPage > 1 && (
            <div className="flex justify-center mt-4">
              <div className="join">
                <button
                  className="join-item btn"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  {t('common.previous')}
                </button>
                <button className="join-item btn">
                  {t('common.page', { current: page, total: data.meta.lastPage })}
                </button>
                <button
                  className="join-item btn"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.meta.lastPage}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{t('users.createTitle')}</h3>

            {createError && (
              <div className="alert alert-error mb-4">
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit(handleCreateUser)} noValidate>
              <div className="form-control mb-1">
                <label className="label">
                  <span className="label-text">{t('users.firstName')}</span>
                </label>
                <input
                  type="text"
                  {...registerCreate('firstName', {
                    required: t('users.validation.firstNameRequired'),
                    minLength: { value: 2, message: t('users.validation.firstNameMin') },
                  })}
                  className={`input input-bordered w-full ${createErrors.firstName ? 'input-error' : ''}`}
                />
                <div className="h-6 mt-1">
                  {createErrors.firstName && (
                    <span className="text-error text-sm">{createErrors.firstName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-control mb-1">
                <label className="label">
                  <span className="label-text">{t('users.lastName')}</span>
                </label>
                <input
                  type="text"
                  {...registerCreate('lastName', {
                    required: t('users.validation.lastNameRequired'),
                    minLength: { value: 2, message: t('users.validation.lastNameMin') },
                  })}
                  className={`input input-bordered w-full ${createErrors.lastName ? 'input-error' : ''}`}
                />
                <div className="h-6 mt-1">
                  {createErrors.lastName && (
                    <span className="text-error text-sm">{createErrors.lastName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-control mb-1">
                <label className="label">
                  <span className="label-text">{t('users.email')}</span>
                </label>
                <input
                  type="email"
                  {...registerCreate('email', {
                    required: t('users.validation.emailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('users.validation.emailInvalid'),
                    },
                  })}
                  className={`input input-bordered w-full ${createErrors.email ? 'input-error' : ''}`}
                />
                <div className="h-6 mt-1">
                  {createErrors.email && (
                    <span className="text-error text-sm">{createErrors.email.message}</span>
                  )}
                </div>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">{t('users.role')}</span>
                </label>
                <select
                  {...registerCreate('role')}
                  className="select select-bordered w-full"
                >
                  {getRoleOptions().map((role) => (
                    <option key={role} value={role}>
                      {t(`users.roles.${role}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="alert alert-info mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm">{t('users.userCreatedInfo')}</span>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('users.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      {t('users.creating')}
                    </>
                  ) : (
                    t('users.create')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{t('users.editTitle')}</h3>

            {editError && (
              <div className="alert alert-error mb-4">
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit(handleEditUser)} noValidate>
              <div className="form-control mb-1">
                <label className="label">
                  <span className="label-text">{t('users.firstName')}</span>
                </label>
                <input
                  type="text"
                  {...registerEdit('firstName', {
                    required: t('users.validation.firstNameRequired'),
                    minLength: { value: 2, message: t('users.validation.firstNameMin') },
                  })}
                  className={`input input-bordered w-full ${editErrors.firstName ? 'input-error' : ''}`}
                />
                <div className="h-6 mt-1">
                  {editErrors.firstName && (
                    <span className="text-error text-sm">{editErrors.firstName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-control mb-1">
                <label className="label">
                  <span className="label-text">{t('users.lastName')}</span>
                </label>
                <input
                  type="text"
                  {...registerEdit('lastName', {
                    required: t('users.validation.lastNameRequired'),
                    minLength: { value: 2, message: t('users.validation.lastNameMin') },
                  })}
                  className={`input input-bordered w-full ${editErrors.lastName ? 'input-error' : ''}`}
                />
                <div className="h-6 mt-1">
                  {editErrors.lastName && (
                    <span className="text-error text-sm">{editErrors.lastName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-control mb-1">
                <label className="label">
                  <span className="label-text">{t('users.email')}</span>
                </label>
                <input
                  type="email"
                  {...registerEdit('email', {
                    required: t('users.validation.emailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('users.validation.emailInvalid'),
                    },
                  })}
                  className={`input input-bordered w-full ${editErrors.email ? 'input-error' : ''}`}
                />
                <div className="h-6 mt-1">
                  {editErrors.email && (
                    <span className="text-error text-sm">{editErrors.email.message}</span>
                  )}
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                >
                  {t('users.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isEditing}
                >
                  {isEditing ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      {t('users.saving')}
                    </>
                  ) : (
                    t('users.save')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteUserId !== null}
        title={t('users.deleteConfirm')}
        message={t('users.deleteMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDangerous={true}
        onConfirm={() => {
          if (deleteUserId !== null) {
            deleteMutation.mutate(deleteUserId)
            setDeleteUserId(null)
          }
        }}
        onCancel={() => setDeleteUserId(null)}
      />
    </div>
  )
}
