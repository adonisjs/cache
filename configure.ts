/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from '@adonisjs/core/commands/configure'

import { stubsRoot } from './stubs/main.ts'

const DRIVERS = ['redis', 'file', 'database', 'dynamodb'] as const
const DRIVERS_INFO: {
  [K in (typeof DRIVERS)[number]]: {
    envVars?: Record<string, number | string>
    envValidations?: Record<string, string>
  }
} = {
  file: {},
  redis: {},
  database: {},
  dynamodb: {
    envValidations: {
      AWS_ACCESS_KEY_ID: `Env.schema.string()`,
      AWS_SECRET_ACCESS_KEY: `Env.schema.string()`,
      AWS_REGION: `Env.schema.string()`,
      DYNAMODB_ENDPOINT: `Env.schema.string()`,
    },
    envVars: {
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
      AWS_REGION: '',
      DYNAMODB_ENDPOINT: '',
    },
  },
}

/**
 * Configures the package
 */
export async function configure(command: Configure) {
  const driver = await command.prompt.choice(
    'Select the cache driver you plan to use',
    ['redis', 'file', 'database', 'dynamodb'],
    {
      hint: 'You can always change it later',
    }
  )

  const codemods = await command.createCodemods()

  /**
   * Publish provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@adonisjs/cache/cache_provider').addCommand('@adonisjs/cache/commands')
  })

  const { envVars, envValidations } = DRIVERS_INFO[driver]

  /**
   * Define environment variables
   */
  if (envVars) {
    await codemods.defineEnvVariables(envVars)
  }

  /**
   * Define environment validations
   */
  if (envValidations) {
    await codemods.defineEnvValidations({ variables: envValidations })
  }

  /**
   * Publish config
   */
  await codemods.makeUsingStub(stubsRoot, 'config.stub', { driver: driver })

  /**
   * Create migration for database driver
   */
  if (driver === 'database') {
    await codemods.makeUsingStub(stubsRoot, 'migration.stub', {
      entity: command.app.generators.createEntity('cache'),
      migration: {
        folder: 'database/migrations',
        fileName: `${new Date().getTime()}_create_cache_table.ts`,
      },
    })
  }
}
