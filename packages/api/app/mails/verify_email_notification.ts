import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class VerifyEmailNotification extends BaseMail {
  from = 'onboarding@resend.dev'
  subject = 'Verify your email address'

  constructor(
    private userEmail: string,
    private verificationToken: string
  ) {
    super()
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    const verificationUrl = `${env.get('FRONTEND_URL')}/verify-email?token=${this.verificationToken}`

    this.message.to(this.userEmail).htmlView('emails/verify_email', {
      verificationUrl,
    })
  }
}