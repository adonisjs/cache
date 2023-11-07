/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { IgnitorFactory } from '@adonisjs/core/factories'
import Configure from '@adonisjs/core/commands/configure'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Configure', (group) => {
  group.tap((t) => t.timeout(6000))

  group.each.setup(async ({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)

    await context.fs.create('.env', '')
    await context.fs.createJson('tsconfig.json', {})
    await context.fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
    await context.fs.create('adonisrc.ts', `export default defineConfig({})`)
  })

  test('add commands and provider', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(BASE_URL, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, BASE_URL).href)
          }

          return import(filePath)
        },
      })

    const app = ignitor.createApp('web')
    await app.init().then(() => app.boot())

    const ace = await app.container.make('ace')
    ace.prompt.trap('Select the cache driver you plan to use').chooseOption(0)

    const command = await ace.create(Configure, ['../../index.js'])
    await command.exec()

    await assert.fileExists('config/cache.ts')
    await assert.fileExists('adonisrc.ts')
    await assert.fileContains('adonisrc.ts', '@adonisjs/cache/commands')
    await assert.fileContains('adonisrc.ts', '@adonisjs/cache/cache_provider')
  })

  test('create redis cache', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(BASE_URL, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, BASE_URL).href)
          }

          return import(filePath)
        },
      })

    const app = ignitor.createApp('web')
    await app.init().then(() => app.boot())

    const ace = await app.container.make('ace')
    ace.prompt.trap('Select the cache driver you plan to use').chooseOption(0)

    const command = await ace.create(Configure, ['../../index.js'])
    await command.exec()

    await assert.fileContains('config/cache.ts', 'defineConfig({')

    await assert.fileContains('.env', 'REDIS_HOST')
    await assert.fileContains('.env', 'REDIS_PORT')
    await assert.fileContains('.env', 'REDIS_PASSWORD')

    await assert.fileContains('start/env.ts', `REDIS_HOST: Env.schema.string({ format: 'host' })`)
    await assert.fileContains('start/env.ts', 'REDIS_PORT: Env.schema.number()')
    await assert.fileContains('start/env.ts', 'REDIS_PASSWORD: Env.schema.string.optional()')
  })

  test('create dynamo cache', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(BASE_URL, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, BASE_URL).href)
          }

          return import(filePath)
        },
      })

    const app = ignitor.createApp('web')
    await app.init().then(() => app.boot())

    const ace = await app.container.make('ace')
    ace.prompt.trap('Select the cache driver you plan to use').chooseOption(4)

    const command = await ace.create(Configure, ['../../index.js'])
    await command.exec()

    await assert.fileContains('config/cache.ts', 'defineConfig({')

    await assert.fileContains('.env', 'AWS_ACCESS_KEY_ID')
    await assert.fileContains('.env', 'AWS_SECRET_ACCESS_KEY')
    await assert.fileContains('.env', 'AWS_REGION')
    await assert.fileContains('.env', 'DYNAMODB_ENDPOINT')

    await assert.fileContains('start/env.ts', 'AWS_ACCESS_KEY_ID: Env.schema.string()')
    await assert.fileContains('start/env.ts', 'AWS_SECRET_ACCESS_KEY: Env.schema.string()')
    await assert.fileContains('start/env.ts', 'AWS_REGION: Env.schema.string()')
    await assert.fileContains('start/env.ts', 'DYNAMODB_ENDPOINT: Env.schema.string()')
  })
})