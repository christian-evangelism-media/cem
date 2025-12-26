import { useState, useMemo } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'
import { Form, Input, Button, Card, Flex, Progress, Typography, Alert } from 'asterui'

const { Paragraph, Text } = Typography

interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

function getPasswordStrength(password: string, t: (key: string) => string): { score: number; label: string; type: 'error' | 'warning' | 'info' | 'success' } {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*.?]/.test(password)

  // Count basic rules met
  const basicRules = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial]
  const basicRulesMet = basicRules.filter(Boolean).length

  // If not all basic rules are met, it's weak
  if (basicRulesMet < 5) {
    const score = Math.round((basicRulesMet / 5) * 50)
    return { score, label: t('auth.passwordStrength.weak'), type: 'error' }
  }

  // All basic rules met - check for extra strength
  if (password.length >= 16) return { score: 100, label: t('auth.passwordStrength.strong'), type: 'success' }
  if (password.length >= 12) return { score: 83, label: t('auth.passwordStrength.good'), type: 'info' }
  return { score: 67, label: t('auth.passwordStrength.fair'), type: 'warning' }
}

export default function Register() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [serverError, setServerError] = useState('')
  const [password, setPassword] = useState('')
  const strength = useMemo(() => password ? getPasswordStrength(password, t) : null, [password, t])

  const handleSubmit = async (values: RegisterFormData) => {
    setServerError('')

    try {
      const { confirmPassword, ...registerData } = values
      await api.auth.register({ ...registerData, language: i18n.language })
      navigate('/login')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('auth.errors.registerFailed'))
    }
  }

  return (
    <Flex justify="center" align="center" minHeight="screen" className="bg-base-200 p-4">
      <Card title={t('auth.registerTitle')} className="w-full max-w-md">
        {serverError && (
          <Alert type="error" className="mb-4">
            {serverError}
          </Alert>
        )}

        <Form onFinish={handleSubmit}>
          <Form.Item
            name="firstName"
            label={t('auth.firstName')}
            rules={[
              { required: true, message: t('auth.errors.firstNameRequired') },
              { min: 2, message: t('auth.errors.firstNameMin') },
            ]}
          >
            <Input className="w-full" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label={t('auth.lastName')}
            rules={[
              { required: true, message: t('auth.errors.lastNameRequired') },
              { min: 2, message: t('auth.errors.lastNameMin') },
            ]}
          >
            <Input className="w-full" />
          </Form.Item>

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
            rules={[
              { required: true, message: t('auth.errors.passwordRequired') },
              { min: 8, message: t('auth.passwordRequirements.length') },
              { pattern: /[A-Z]/, message: t('auth.passwordRequirements.uppercase') },
              { pattern: /[a-z]/, message: t('auth.passwordRequirements.lowercase') },
              { pattern: /[0-9]/, message: t('auth.passwordRequirements.number') },
              { pattern: /[!@#$%^&*.?]/, message: t('auth.passwordRequirements.special') },
            ]}
          >
            <Input
              className="w-full"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          {password && strength && (
            <div className="mb-4">
              <Progress value={strength.score} type={strength.type} className="h-1" />
              <Text className={`text-xs text-${strength.type}`}>
                {t('auth.passwordStrength.label')}: {strength.label}
              </Text>
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            label={t('auth.confirmPassword')}
            dependencies={['password']}
            rules={[
              { required: true, message: t('auth.errors.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(t('auth.errors.passwordsNotMatch'))
                },
              }),
            ]}
          >
            <Input className="w-full" type="password" />
          </Form.Item>

          <Button color="primary" htmlType="submit" shape="block">
            {t('auth.registerButton')}
          </Button>

          <Paragraph align="center" size="sm" className="mt-4">
            {t('auth.hasAccount')}{' '}
            <RouterLink to="/login" className="link link-primary">
              {t('auth.loginLink')}
            </RouterLink>
          </Paragraph>
        </Form>
      </Card>
    </Flex>
  )
}
