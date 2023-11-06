/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from '@adonisjs/core/commands/configure'

const DRIVERS = ['redis', 'file', 'memory', 'database', 'dynamodb'] as const
const DRIVERS_INFO: {
  [K in (typeof DRIVERS)[number]]: {
    envVars?: Record<string, number | string>
    envValidations?: Record<string, string>
  }
} = {
  redis: {
    envValidations: {
      REDIS_HOST: `Env.schema.string({ format: 'host' })`,
      REDIS_PORT: `Env.schema.number()`,
      REDIS_PASSWORD: `Env.schema.string.optional()`,
    },
    envVars: {
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: '',
    },
  },
  file: {},
  database: {},
  memory: {},
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
    ['redis', 'file', 'memory', 'database', 'dynamodb'],
    {
      hint: 'You can always change it later',
    }
  )
  const { envVars, envValidations } = DRIVERS_INFO[driver]

  const codemods = await command.createCodemods()

  /**
   * Publish provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@adonisjs/cache/cache_provider').addCommand('@adonisjs/cache/commands')
  })

  /**
   * Define environment variables
   */
  if (envVars) {
    codemods.defineEnvVariables({
      ...envVars,
      CACHE_STORE: `Env.schema.enum(['${driver}'] as const)`,
    })
  }

  /**
   * Define environment validations
   */
  if (envValidations) {
    codemods.defineEnvValidations({ variables: envValidations })
  }

  /**
   * Publish config
   */
  await command.publishStub('config.stub', { driver: driver })
}
