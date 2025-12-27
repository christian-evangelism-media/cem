import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts/UserContext'
import { api } from '../services/api'
import { Button, Card, Form, Input, Typography, message } from 'asterui'

const { Title } = Typography

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function Account() {
  const { t } = useTranslation()
  const { user, setUser } = useUser()
  const profileForm = Form.useForm<ProfileFormData>()
  const passwordForm = Form.useForm<PasswordFormData>()

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const response = await api.auth.updateProfile(data)
      setUser(response.user)
      message.success(t('account.profileUpdated'))
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('account.profileUpdateFailed'))
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await api.auth.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      message.success(t('account.passwordChanged'))
      passwordForm.resetFields()
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('account.passwordChangeFailed'))
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-4 md:pt-8">
      <Title level={1} className="text-3xl md:text-4xl mb-6">{t('account.title')}</Title>

      {/* Profile Section */}
      <Card className="shadow-xl mb-6">
        <Title level={2} className="text-2xl mb-4">{t('account.profileInfo')}</Title>

        <Form
          form={profileForm}
          onFinish={onProfileSubmit}
          initialValues={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="firstName"
              label={t('account.firstName')}
              rules={[
                { required: true, message: t('account.firstNameRequired') },
                { min: 2, message: t('account.firstNameMinLength') },
              ]}
            >
              <Input className="w-full" />
            </Form.Item>

            <Form.Item
              name="lastName"
              label={t('account.lastName')}
              rules={[
                { required: true, message: t('account.lastNameRequired') },
                { min: 2, message: t('account.lastNameMinLength') },
              ]}
            >
              <Input className="w-full" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label={t('account.email')}
            rules={[
              { required: true, message: t('account.emailRequired') },
              { type: 'email', message: t('account.emailInvalid') },
            ]}
          >
            <Input className="w-full" />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            className="w-full md:w-auto mt-4"
          >
            {t('account.updateProfile')}
          </Button>
        </Form>
      </Card>

      {/* Password Section */}
      <Card className="shadow-xl">
        <Title level={2} className="text-2xl mb-4">{t('account.changePassword')}</Title>

        <Form
          form={passwordForm}
          onFinish={onPasswordSubmit}
        >
          <Form.Item
            name="currentPassword"
            label={t('account.currentPassword')}
            rules={[
              { required: true, message: t('account.currentPasswordRequired') },
            ]}
          >
            <Input type="password" className="w-full" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={t('account.newPassword')}
            rules={[
              { required: true, message: t('account.newPasswordRequired') },
              { min: 8, message: t('account.passwordMinLength') },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
                message: t('account.passwordPattern'),
              },
            ]}
          >
            <Input type="password" className="w-full" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={t('account.confirmPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('account.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(t('account.passwordsNoMatch'))
                },
              }),
            ]}
          >
            <Input type="password" className="w-full" />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            className="w-full md:w-auto mt-4"
          >
            {t('account.changePasswordButton')}
          </Button>
        </Form>
      </Card>
    </div>
  )
}
