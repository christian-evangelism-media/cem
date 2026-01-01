import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Button, Typography, Flex, Hero } from 'asterui'

const { Title, Paragraph } = Typography

export default function Landing() {
  const { t } = useTranslation()

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Hero className="min-h-[300px] md:min-h-[400px] bg-base-200 rounded-lg mb-6 md:mb-8" contentClassName="text-center px-4">
        <div className="max-w-md">
          <Title level={1} className="text-3xl md:text-5xl mb-4">{t('landing.title')}</Title>
          <Paragraph className="text-base md:text-lg">{t('landing.subtitle')}</Paragraph>
        </div>
      </Hero>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <Card title={t('landing.browseTitle')} className="shadow-xl">
          <Paragraph className="text-sm md:text-base mb-4">{t('landing.browseDescription')}</Paragraph>
          <Flex justify="end">
            <RouterLink to="/media">
              <Button type="primary">{t('landing.browseButton')}</Button>
            </RouterLink>
          </Flex>
        </Card>

        <Card title={t('landing.ordersTitle')} className="shadow-xl">
          <Paragraph className="text-sm md:text-base mb-4">{t('landing.ordersDescription')}</Paragraph>
          <Flex justify="end" gap="sm">
            <RouterLink to="/register">
              <Button color="secondary">{t('nav.register')}</Button>
            </RouterLink>
            <RouterLink to="/login">
              <Button variant="outline">{t('nav.login')}</Button>
            </RouterLink>
          </Flex>
        </Card>
      </div>
    </div>
  )
}
