import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Form, Input, Checkbox, Button, Card, Alert } from 'asterui'
import { useAuth } from '../contexts/AuthContext'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const REMEMBERED_EMAIL_KEY = 'adminRememberedEmail'

export default function Login() {
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const form = Form.useForm<LoginFormData>()

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (rememberedEmail) {
      form.setFieldsValue({
        email: rememberedEmail,
        rememberMe: true,
      })
    }
  }, [form])

  const onSubmit = async (data: LoginFormData) => {
    setServerError('')
    setIsSubmitting(true)

    try {
      // Save or clear email in localStorage based on rememberMe checkbox
      if (data.rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email)
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }

      await login(data.email, data.password)
      navigate('/')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('auth.loginFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-6">{t('nav.appName')}</h1>
        <Card className="shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">
              {t('auth.title')}
            </h2>
            <LanguageSwitcher />
          </div>

          {serverError && (
            <Alert color="error" className="mb-4">
              {serverError}
            </Alert>
          )}

          <Form
            form={form}
            onFinish={onSubmit}
            initialValues={{ rememberMe: false }}
          >
            <Form.Item
              name="email"
              label={t('auth.email')}
              rules={[
                { required: true, message: t('auth.emailRequired') },
                { type: 'email', message: t('auth.emailInvalid') },
              ]}
            >
              <Input className="w-full" placeholder="you@example.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('auth.password')}
              rules={[{ required: true, message: t('auth.passwordRequired') }]}
            >
              <Input type="password" className="w-full" />
            </Form.Item>

            <Form.Item name="rememberMe" valuePropName="checked">
              <Checkbox>{t('auth.rememberMe')}</Checkbox>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              className="w-full mt-4"
              loading={isSubmitting}
            >
              {t('auth.login')}
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  )
}
