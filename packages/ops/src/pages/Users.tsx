import { useState, useDeferredValue } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import { Modal, Form, Input, Textarea, Button, Badge, Loading, Alert, Card, Select, Checkbox } from 'asterui'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { type User, type PaginatedResponse } from '../types'

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
  allowPickup: boolean
}

export default function Users() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const { t, i18n } = useTranslation()

  // Defer search to avoid blocking input
  const search = useDeferredValue(searchInput)

  const createForm = Form.useForm<CreateUserFormData>()
  const editForm = Form.useForm<EditUserFormData>()

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
      createForm.resetFields()
      setCreateError('')
      setIsCreating(false)
    },
    onError: (error: Error) => {
      setCreateError(error.message)
      setIsCreating(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditUserFormData }) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowEditModal(false)
      setSelectedUser(null)
      editForm.resetFields()
      setEditError('')
      setIsEditing(false)
    },
    onError: (error: Error) => {
      setEditError(error.message)
      setIsEditing(false)
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
    setIsCreating(true)
    createMutation.mutate(data)
  }

  const handleEditUser = (data: EditUserFormData) => {
    setEditError('')
    setIsEditing(true)
    if (selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        data,
      })
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    editForm.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      allowPickup: user.allowPickup,
    })
    setEditError('')
    setShowEditModal(true)
  }

  const openCreateModal = () => {
    createForm.setFieldsValue({
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
        <Loading size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert color="error">
          {t('common.errorLoading', { resource: t('nav.users').toLowerCase() })}: {error instanceof Error ? error.message : t('common.unknownError')}
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('users.title')}</h1>
        <Button type="primary" onClick={openCreateModal}>
          {t('users.addNew')}
        </Button>
      </div>

      <Card className="shadow-xl">
        <div className="mb-4">
          <Input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            className="w-full max-w-md"
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
                          <Badge size="sm" color="error">{t('users.blocked')}</Badge>
                        )}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {canChangeRole(user) ? (
                        <Select
                          size="sm"
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
                        </Select>
                      ) : (
                        <Badge color={
                          user.role === 'super_admin' ? 'error' :
                          user.role === 'admin' ? 'primary' :
                          user.role === 'support' ? 'secondary' :
                          user.role === 'help' ? 'accent' :
                          'default'
                        }>
                          {t(`users.roles.${user.role}`)}
                        </Badge>
                      )}
                    </td>
                    <td>
                      {user.emailVerifiedAt ? (
                        <Badge color="success">{t('users.verifiedStatus.verified')}</Badge>
                      ) : (
                        <Badge color="warning">{t('users.verifiedStatus.unverified')}</Badge>
                      )}
                    </td>
                    <td>
                      {user.preferredLanguages ? (
                        <div className="flex gap-1 flex-wrap">
                          {user.preferredLanguages.map((lang) => (
                            <Badge key={lang} size="sm" color="accent">
                              {lang}
                            </Badge>
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
                          <Textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            className="w-48 min-h-16"
                            placeholder={t('users.notes')}
                            autoFocus
                            rows={2}
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              color="success"
                              onClick={() => saveNotes(user.id)}
                              disabled={updateNotesMutation.isPending}
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              ghost
                              onClick={cancelEditNotes}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          ghost
                          className="text-left justify-start w-full h-auto whitespace-normal py-2"
                          onClick={() => startEditNotes(user)}
                          title={user.notes ? t('users.editNotes') : t('users.addNotes')}
                        >
                          {user.notes ? (
                            <span className="text-sm line-clamp-2">{user.notes}</span>
                          ) : (
                            <span className="text-gray-400 italic text-sm">{t('users.noNotes')}</span>
                          )}
                        </Button>
                      )}
                    </td>
                    <td>
                      {DateTime.fromISO(user.createdAt).setLocale(i18n.language).toLocaleString(DateTime.DATE_MED)}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {canEditUser(user) && (
                          <Button
                            size="sm"
                            color="info"
                            onClick={() => openEditModal(user)}
                          >
                            {t('users.edit')}
                          </Button>
                        )}
                        {canEditUser(user) && (
                          <Button
                            size="sm"
                            color={user.isBlocked ? 'success' : 'warning'}
                            onClick={() => toggleBlockMutation.mutate(user.id)}
                            disabled={toggleBlockMutation.isPending}
                          >
                            {user.isBlocked ? t('users.unblock') : t('users.block')}
                          </Button>
                        )}
                        {canEditUser(user) && (
                          <Button
                            size="sm"
                            color="error"
                            onClick={() => {
                              Modal.confirm({
                                title: t('users.deleteConfirm'),
                                content: t('users.deleteMessage'),
                                okText: t('common.delete'),
                                cancelText: t('common.cancel'),
                                type: 'error',
                                onOk: () => {
                                  deleteMutation.mutate(user.id)
                                },
                              })
                            }}
                          >
                            {t('users.delete')}
                          </Button>
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
                <Button
                  className="join-item"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  {t('common.previous')}
                </Button>
                <Button className="join-item">
                  {t('common.page', { current: page, total: data.meta.lastPage })}
                </Button>
                <Button
                  className="join-item"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.meta.lastPage}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
      </Card>

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        title={t('users.createTitle')}
        footer={null}
      >
        {createError && (
          <Alert color="error" className="mb-4">
            {createError}
          </Alert>
        )}

        <Form
          form={createForm}
          onFinish={handleCreateUser}
          initialValues={{
            firstName: '',
            lastName: '',
            email: '',
            role: 'user',
          }}
        >
          <Form.Item
            name="firstName"
            label={t('users.firstName')}
            rules={[
              { required: true, message: t('users.validation.firstNameRequired') },
              { min: 2, message: t('users.validation.firstNameMin') },
            ]}
          >
            <Input className="w-full" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label={t('users.lastName')}
            rules={[
              { required: true, message: t('users.validation.lastNameRequired') },
              { min: 2, message: t('users.validation.lastNameMin') },
            ]}
          >
            <Input className="w-full" />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('users.email')}
            rules={[
              { required: true, message: t('users.validation.emailRequired') },
              { type: 'email', message: t('users.validation.emailInvalid') },
            ]}
          >
            <Input type="email" className="w-full" />
          </Form.Item>

          <Form.Item name="role" label={t('users.role')}>
            <Select>
              {getRoleOptions().map((role) => (
                <option key={role} value={role}>
                  {t(`users.roles.${role}`)}
                </option>
              ))}
            </Select>
          </Form.Item>

          <Alert color="info" className="mb-4">
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-sm">{t('users.userCreatedInfo')}</span>
            </div>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowCreateModal(false)}>
              {t('users.cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating}
            >
              {t('users.create')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={showEditModal && selectedUser !== null}
        onCancel={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        title={t('users.editTitle')}
        footer={null}
      >
        {editError && (
          <Alert color="error" className="mb-4">
            {editError}
          </Alert>
        )}

        <Form
          form={editForm}
          onFinish={handleEditUser}
        >
          <Form.Item
            name="firstName"
            label={t('users.firstName')}
            rules={[
              { required: true, message: t('users.validation.firstNameRequired') },
              { min: 2, message: t('users.validation.firstNameMin') },
            ]}
          >
            <Input className="w-full" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label={t('users.lastName')}
            rules={[
              { required: true, message: t('users.validation.lastNameRequired') },
              { min: 2, message: t('users.validation.lastNameMin') },
            ]}
          >
            <Input className="w-full" />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('users.email')}
            rules={[
              { required: true, message: t('users.validation.emailRequired') },
              { type: 'email', message: t('users.validation.emailInvalid') },
            ]}
          >
            <Input type="email" className="w-full" />
          </Form.Item>

          <Form.Item name="allowPickup" valuePropName="checked">
            <Checkbox>{t('users.allowPickup')}</Checkbox>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setShowEditModal(false)
                setSelectedUser(null)
              }}
            >
              {t('users.cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isEditing}
            >
              {t('users.save')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
