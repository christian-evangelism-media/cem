import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts/UserContext'
import { api } from '../services/api'
import { Form, Input, Checkbox, Button, Card, Flex, Space, Typography, Alert } from 'asterui'

const { Link, Paragraph } = Typography

interface LoginFormData {
  email: string
  password: string
  remember: boolean
}

const REMEMBERED_EMAIL_KEY = 'rememberedEmail'

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setUser } = useUser()
  const [serverError, setServerError] = useState('')
  const form = Form.useForm()

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (rememberedEmail) {
      form.setFieldsValue({
        email: rememberedEmail,
        remember: true,
      })
    }
  }, [form])

  const handleSubmit = async (values: LoginFormData) => {
    setServerError('')

    try {
      // Save or clear email in localStorage based on remember checkbox
      if (values.remember) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email)
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }

      const response = await api.auth.login(values)
      setUser(response.user)
      navigate('/media')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('auth.errors.loginFailed'))
    }
  }

  return (
    <Flex justify="center" align="center" minHeight="screen" className="bg-base-200 p-4">
      <Card title={t('auth.loginTitle')} className="w-full max-w-sm">
        {serverError && (
          <Alert type="error" className="mb-4">
            {serverError}
          </Alert>
        )}

        <Form
          form={form}
          onFinish={handleSubmit}
          initialValues={{ remember: false }}
        >
          <Form.Item
            name="email"
            label={t('auth.email')}
            rules={[
              { required: true, message: t('auth.errors.emailRequired') },
              { type: 'email', message: t('auth.errors.emailInvalid') },
            ]}
          >
            <Input className="w-full" placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('auth.password')}
            rules={[{ required: true, message: t('auth.errors.passwordRequired') }]}
          >
            <Input className="w-full" type="password" />
          </Form.Item>

          <Space justify="between" align="center" className="mb-4">
            <Form.Item name="remember" valuePropName="checked" inline>
              <Checkbox>{t('auth.rememberMe')}</Checkbox>
            </Form.Item>
          </Space>

          <Button color="primary" htmlType="submit" shape="block">
            {t('auth.loginButton')}
          </Button>

          <Paragraph align="center" size="sm" className="mt-4">
            {t('auth.noAccount')}{' '}
            <RouterLink to="/register" className="link link-primary">
              {t('auth.registerLink')}
            </RouterLink>
          </Paragraph>
        </Form>
      </Card>
    </Flex>
  )
}
