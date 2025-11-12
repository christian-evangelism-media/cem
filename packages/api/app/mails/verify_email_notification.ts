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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Verify your email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4a5568; margin-bottom: 20px;">Verify your email address</h1>

        <p>Thank you for registering! Please verify your email address by clicking the button below:</p>

        <div style="margin: 30px 0;">
          <a href="${verificationUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email
          </a>
        </div>

        <p style="color: #718096; font-size: 14px;">
          If the button doesn't work, you can copy and paste this link into your browser:
        </p>
        <p style="color: #718096; font-size: 14px; word-break: break-all;">
          ${verificationUrl}
        </p>

        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          This link will expire in 24 hours.
        </p>
      </body>
      </html>
    `

    this.message.to(this.userEmail).html(html)
  }
}