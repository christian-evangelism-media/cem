import User from '#models/user'
import VerificationToken from '#models/verification_token'
import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email_notification'
import app from '@adonisjs/core/services/app'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    // Build email validator - normalize only in production to allow + trick in dev
    let emailValidator = vine.string().email()
    if (app.inProduction) {
      emailValidator = emailValidator.normalizeEmail()
    }

    const schema = vine.compile(
      vine.object({
        email: emailValidator.unique(async (db, value) => {
          const user = await db.from('users').where('email', value).first()
          return !user
        }),
        password: vine
          .string()
          .minLength(8)
          .maxLength(128)
          .regex(/[a-z]/) // At least one lowercase
          .regex(/[A-Z]/) // At least one uppercase
          .regex(/[0-9]/) // At least one number
          .regex(/[^a-zA-Z0-9]/), // At least one special character
        firstName: vine.string().trim().minLength(2).maxLength(50),
        lastName: vine.string().trim().minLength(2).maxLength(50),
      })
    )

    const data = await request.validateUsing(schema)

    const user = await User.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    })

    // Generate verification token
    const token = randomBytes(32).toString('hex')
    const expiresAt = DateTime.now().plus({ hours: 24 })

    await VerificationToken.create({
      userId: user.id,
      token,
      expiresAt,
    })

    // Send verification email
    await mail.send(new VerifyEmailNotification(user.email, token))

    return response.created({
      message: 'User created. Please check your email to verify your account.',
      user,
    })
  }

  async login({ request, auth, response }: HttpContext) {
    // Build email validator - normalize only in production
    let emailValidator = vine.string().email()
    if (app.inProduction) {
      emailValidator = emailValidator.normalizeEmail()
    }

    const schema = vine.compile(
      vine.object({
        email: emailValidator,
        password: vine.string(),
      })
    )

    const data = await request.validateUsing(schema)

    // This handles everything - finding user, verifying password, timing attack protection
    const user = await User.verifyCredentials(data.email, data.password)

    // Check if user is blocked
    if (user.isBlocked) {
      return response.forbidden({ message: 'Your account has been blocked. Please contact support.' })
    }

    await auth.use('web').login(user)

    return { message: 'Logged in', user }
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()

    return response.ok({ message: 'Logged out' })
  }

  async me({ auth }: HttpContext) {
    await auth.check()

    return { user: auth.user }
  }

  async updatePreferences({ auth, request }: HttpContext) {
    await auth.check()

    const schema = vine.compile(
      vine.object({
        preferredLanguages: vine.array(vine.string()).minLength(1).nullable(),
      })
    )

    const data = await request.validateUsing(schema)

    const user = auth.user!
    user.preferredLanguages = data.preferredLanguages
    await user.save()

    return { user }
  }

  async updateProfile({ auth, request, response }: HttpContext) {
    await auth.check()

    // Build email validator - normalize only in production
    let emailValidator = vine.string().email()
    if (app.inProduction) {
      emailValidator = emailValidator.normalizeEmail()
    }

    const schema = vine.compile(
      vine.object({
        firstName: vine.string().trim().minLength(2).maxLength(50),
        lastName: vine.string().trim().minLength(2).maxLength(50),
        email: emailValidator.unique(async (db, value) => {
          const user = await db
            .from('users')
            .where('email', value)
            .whereNot('id', auth.user!.id)
            .first()
          return !user
        }),
      })
    )

    const data = await request.validateUsing(schema)

    const user = auth.user!
    user.firstName = data.firstName
    user.lastName = data.lastName
    user.email = data.email
    await user.save()

    return response.ok({ user })
  }

  async changePassword({ auth, request, response }: HttpContext) {
    await auth.check()

    const schema = vine.compile(
      vine.object({
        currentPassword: vine.string(),
        newPassword: vine
          .string()
          .minLength(8)
          .maxLength(128)
          .regex(/[a-z]/) // At least one lowercase
          .regex(/[A-Z]/) // At least one uppercase
          .regex(/[0-9]/) // At least one number
          .regex(/[^a-zA-Z0-9]/), // At least one special character
      })
    )

    const data = await request.validateUsing(schema)

    const user = auth.user!

    // Verify current password
    const isValid = await User.verifyCredentials(user.email, data.currentPassword)
    if (!isValid) {
      return response.badRequest({ message: 'Current password is incorrect' })
    }

    user.password = data.newPassword
    await user.save()

    return response.ok({ message: 'Password changed successfully' })
  }

  async verifyEmail({ request, response }: HttpContext) {
    const schema = vine.compile(
      vine.object({
        token: vine.string(),
      })
    )

    const data = await request.validateUsing(schema, {
      data: request.qs(),
    })

    const verificationToken = await VerificationToken.query()
      .where('token', data.token)
      .preload('user')
      .first()

    if (!verificationToken) {
      return response.notFound({ message: 'Invalid verification token' })
    }

    if (verificationToken.expiresAt < DateTime.now()) {
      return response.badRequest({ message: 'Verification token has expired' })
    }

    // Update user's email_verified_at
    verificationToken.user.emailVerifiedAt = DateTime.now()
    await verificationToken.user.save()

    // Delete the used token
    await verificationToken.delete()

    return response.ok({ message: 'Email verified successfully' })
  }

  async resendVerification({ request, response }: HttpContext) {
    // Build email validator - normalize only in production
    let emailValidator = vine.string().email()
    if (app.inProduction) {
      emailValidator = emailValidator.normalizeEmail()
    }

    const schema = vine.compile(
      vine.object({
        email: emailValidator,
      })
    )

    const data = await request.validateUsing(schema)

    const user = await User.findBy('email', data.email)

    if (!user) {
      // Don't reveal if user exists or not for security
      return response.ok({
        message: 'If the email exists, a verification link has been sent.',
      })
    }

    if (user.emailVerifiedAt) {
      return response.badRequest({ message: 'Email is already verified' })
    }

    // Delete any existing tokens for this user
    await VerificationToken.query().where('user_id', user.id).delete()

    // Generate new token
    const token = randomBytes(32).toString('hex')
    const expiresAt = DateTime.now().plus({ hours: 24 })

    await VerificationToken.create({
      userId: user.id,
      token,
      expiresAt,
    })

    // Send verification email
    await mail.send(new VerifyEmailNotification(user.email, token))

    return response.ok({
      message: 'Verification email sent. Please check your inbox.',
    })
  }
}
