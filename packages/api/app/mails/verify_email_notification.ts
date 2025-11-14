import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

// Email subjects for all 30 languages
const EMAIL_SUBJECTS: Record<string, string> = {
  en: 'Verify your email address',
  es: 'Verifica tu dirección de correo electrónico',
  fr: 'Vérifiez votre adresse e-mail',
  de: 'Bestätigen Sie Ihre E-Mail-Adresse',
  it: 'Verifica il tuo indirizzo email',
  pt: 'Verifique seu endereço de e-mail',
  ru: 'Подтвердите свой адрес электронной почты',
  zh: '验证您的电子邮件地址',
  ja: 'メールアドレスを確認してください',
  ko: '이메일 주소를 확인하세요',
  ar: 'تحقق من عنوان بريدك الإلكتروني',
  hi: 'अपने ईमेल पते को सत्यापित करें',
  bn: 'আপনার ইমেল ঠিকানা যাচাই করুন',
  pa: 'ਆਪਣੇ ਈਮੇਲ ਪਤੇ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
  vi: 'Xác minh địa chỉ email của bạn',
  ta: 'உங்கள் மின்னஞ்சல் முகவரியை சரிபார்க்கவும்',
  te: 'మీ ఇమెయిల్ చిరునామాను ధృవీకరించండి',
  mr: 'तुमचा ईमेल पत्ता सत्यापित करा',
  tr: 'E-posta adresinizi doğrulayın',
  fa: 'آدرس ایمیل خود را تأیید کنید',
  he: 'אמת את כתובת האימייל שלך',
  ur: 'اپنے ای میل ایڈریس کی تصدیق کریں',
  id: 'Verifikasi alamat email Anda',
  sw: 'Thibitisha anwani yako ya barua pepe',
  tl: 'I-verify ang iyong email address',
  ro: 'Verificați adresa dvs. de e-mail',
  el: 'Επαληθεύστε τη διεύθυνση email σας',
  ht: 'Verifye adrès imel ou',
  ilo: 'Beripikaren ti email address mo',
  ha: 'Tabbatar da adireshin imel ɗinku',
}

export default class VerifyEmailNotification extends BaseMail {
  from = env.get('RESEND_FROM_EMAIL')
  subject = 'Verify your email address'

  constructor(
    private userEmail: string,
    private verificationToken: string,
    private language: string = 'en'
  ) {
    super()
    // Set subject based on language
    this.subject = EMAIL_SUBJECTS[this.language] || EMAIL_SUBJECTS['en']
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    const verificationUrl = `${env.get('FRONTEND_URL')}/verify-email?token=${this.verificationToken}`

    // Use language-specific template, fallback to English if not found
    const templatePath = `emails/verify_email_${this.language}`

    this.message.to(this.userEmail).htmlView(templatePath, {
      verificationUrl,
    })
  }
}