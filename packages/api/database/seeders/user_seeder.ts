import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Address from '#models/address'
import { DateTime } from 'luxon'
import env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    // Clear existing users and addresses to make this seeder idempotent
    await Address.query().delete()
    await User.query().delete()

    // Super Admin - configured via environment variables
    const superAdmin = await User.create({
      email: env.get('SUPER_ADMIN_EMAIL'),
      password: env.get('SUPER_ADMIN_PASSWORD'),
      firstName: env.get('SUPER_ADMIN_FIRST_NAME'),
      lastName: env.get('SUPER_ADMIN_LAST_NAME'),
      role: 'super_admin',
      emailVerifiedAt: DateTime.now(),
    })

    await Address.create({
      userId: superAdmin.id,
      name: env.get('SUPER_ADMIN_ADDRESS_NAME'),
      label: env.get('SUPER_ADMIN_ADDRESS_LABEL'),
      streetAddress: env.get('SUPER_ADMIN_ADDRESS_STREET'),
      streetAddress2: env.get('SUPER_ADMIN_ADDRESS_STREET2') || undefined,
      city: env.get('SUPER_ADMIN_ADDRESS_CITY'),
      province: env.get('SUPER_ADMIN_ADDRESS_PROVINCE'),
      postalCode: env.get('SUPER_ADMIN_ADDRESS_POSTAL_CODE'),
      country: env.get('SUPER_ADMIN_ADDRESS_COUNTRY'),
      isDefault: true,
    })

    // Optional Test Admin (only created if env vars are set)
    if (env.get('TEST_ADMIN_EMAIL')) {
      const admin = await User.create({
        email: env.get('TEST_ADMIN_EMAIL'),
        password: env.get('TEST_ADMIN_PASSWORD'),
        firstName: env.get('TEST_ADMIN_FIRST_NAME'),
        lastName: env.get('TEST_ADMIN_LAST_NAME'),
        role: 'admin',
        emailVerifiedAt: DateTime.now(),
      })

      await Address.create({
        userId: admin.id,
        name: env.get('TEST_ADMIN_ADDRESS_NAME'),
        label: env.get('TEST_ADMIN_ADDRESS_LABEL'),
        streetAddress: env.get('TEST_ADMIN_ADDRESS_STREET'),
        streetAddress2: env.get('TEST_ADMIN_ADDRESS_STREET2') || undefined,
        city: env.get('TEST_ADMIN_ADDRESS_CITY'),
        province: env.get('TEST_ADMIN_ADDRESS_PROVINCE'),
        postalCode: env.get('TEST_ADMIN_ADDRESS_POSTAL_CODE'),
        country: env.get('TEST_ADMIN_ADDRESS_COUNTRY'),
        isDefault: true,
      })
    }

    // Optional Test Support (customer service role)
    if (env.get('TEST_SUPPORT_EMAIL')) {
      const support = await User.create({
        email: env.get('TEST_SUPPORT_EMAIL'),
        password: env.get('TEST_SUPPORT_PASSWORD'),
        firstName: env.get('TEST_SUPPORT_FIRST_NAME'),
        lastName: env.get('TEST_SUPPORT_LAST_NAME'),
        role: 'support',
        emailVerifiedAt: DateTime.now(),
      })

      await Address.create({
        userId: support.id,
        name: env.get('TEST_SUPPORT_ADDRESS_NAME'),
        label: env.get('TEST_SUPPORT_ADDRESS_LABEL'),
        streetAddress: env.get('TEST_SUPPORT_ADDRESS_STREET'),
        streetAddress2: env.get('TEST_SUPPORT_ADDRESS_STREET2') || undefined,
        city: env.get('TEST_SUPPORT_ADDRESS_CITY'),
        province: env.get('TEST_SUPPORT_ADDRESS_PROVINCE'),
        postalCode: env.get('TEST_SUPPORT_ADDRESS_POSTAL_CODE'),
        country: env.get('TEST_SUPPORT_ADDRESS_COUNTRY'),
        isDefault: true,
      })
    }

    // Optional Test Help (warehouse/fulfillment role)
    if (env.get('TEST_HELP_EMAIL')) {
      const help = await User.create({
        email: env.get('TEST_HELP_EMAIL'),
        password: env.get('TEST_HELP_PASSWORD'),
        firstName: env.get('TEST_HELP_FIRST_NAME'),
        lastName: env.get('TEST_HELP_LAST_NAME'),
        role: 'help',
        emailVerifiedAt: DateTime.now(),
      })

      await Address.create({
        userId: help.id,
        name: env.get('TEST_HELP_ADDRESS_NAME'),
        label: env.get('TEST_HELP_ADDRESS_LABEL'),
        streetAddress: env.get('TEST_HELP_ADDRESS_STREET'),
        streetAddress2: env.get('TEST_HELP_ADDRESS_STREET2') || undefined,
        city: env.get('TEST_HELP_ADDRESS_CITY'),
        province: env.get('TEST_HELP_ADDRESS_PROVINCE'),
        postalCode: env.get('TEST_HELP_ADDRESS_POSTAL_CODE'),
        country: env.get('TEST_HELP_ADDRESS_COUNTRY'),
        isDefault: true,
      })
    }

    // Optional Test User (only created if env vars are set)
    if (env.get('TEST_USER_EMAIL')) {
      const regularUser = await User.create({
        email: env.get('TEST_USER_EMAIL'),
        password: env.get('TEST_USER_PASSWORD'),
        firstName: env.get('TEST_USER_FIRST_NAME'),
        lastName: env.get('TEST_USER_LAST_NAME'),
        role: 'user',
        emailVerifiedAt: DateTime.now(),
      })

      await Address.create({
        userId: regularUser.id,
        name: env.get('TEST_USER_ADDRESS_NAME'),
        label: env.get('TEST_USER_ADDRESS_LABEL'),
        streetAddress: env.get('TEST_USER_ADDRESS_STREET'),
        streetAddress2: env.get('TEST_USER_ADDRESS_STREET2') || undefined,
        city: env.get('TEST_USER_ADDRESS_CITY'),
        province: env.get('TEST_USER_ADDRESS_PROVINCE'),
        postalCode: env.get('TEST_USER_ADDRESS_POSTAL_CODE'),
        country: env.get('TEST_USER_ADDRESS_COUNTRY'),
        isDefault: true,
      })
    }
  }
}