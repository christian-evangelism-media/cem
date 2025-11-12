import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Landing() {
  const { t } = useTranslation()

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="hero min-h-[300px] md:min-h-[400px] bg-base-200 rounded-lg mb-6 md:mb-8">
        <div className="hero-content text-center px-4">
          <div className="max-w-md">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('landing.title')}</h1>
            <p className="text-base md:text-lg">{t('landing.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 md:p-6">
            <h2 className="card-title text-lg md:text-xl">{t('landing.browseTitle')}</h2>
            <p className="text-sm md:text-base">{t('landing.browseDescription')}</p>
            <div className="card-actions justify-end">
              <Link to="/media" className="btn btn-primary btn-sm md:btn-md">{t('landing.browseButton')}</Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 md:p-6">
            <h2 className="card-title text-lg md:text-xl">{t('landing.ordersTitle')}</h2>
            <p className="text-sm md:text-base">{t('landing.ordersDescription')}</p>
            <div className="card-actions justify-end gap-2">
              <Link to="/register" className="btn btn-secondary btn-sm md:btn-md">{t('nav.register')}</Link>
              <Link to="/login" className="btn btn-outline btn-sm md:btn-md">{t('nav.login')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
