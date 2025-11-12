import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck, BaseCheck, Result } from '@adonisjs/core/health'
import type { HealthCheckResult } from '@adonisjs/core/types/health'
import db from '@adonisjs/lucid/services/db'

/**
 * Custom database health check
 */
class DatabaseCheck extends BaseCheck {
  name = 'database'

  async run(): Promise<HealthCheckResult> {
    try {
      // Test database connection with a simple query
      await db.rawQuery('SELECT 1')

      return Result.ok('Database connection is healthy')
    } catch (error) {
      return Result.failed('Database connection failed', error)
    }
  }
}

/**
 * Disk space check with custom name
 */
class CustomDiskSpaceCheck extends DiskSpaceCheck {
  name = 'diskSpace'
}

/**
 * Memory heap check with custom name
 */
class CustomMemoryHeapCheck extends MemoryHeapCheck {
  name = 'memoryHeap'
}

export const healthChecks = new HealthChecks().register([
  new CustomDiskSpaceCheck(),
  new CustomMemoryHeapCheck(),
  new DatabaseCheck(),
])