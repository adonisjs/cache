/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { AceFactory } from '@adonisjs/core/factories'
import CacheClear from '../../commands/cache_clear.js'
import { getCacheService } from '../../test_helpers/index.js'

test.group('DbSeed', () => {
  test('Clear default cache', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache', () => cache)
    ace.ui.switchMode('raw')

    await cache.set('foo', 'bar')
    assert.equal(await cache.get('foo'), 'bar')

    const command = await ace.create(CacheClear, [])
    await command.run()

    assert.isUndefined(await cache.get('foo'))

    command.assertLog(`[ green(success) ] Cleared "${cache.defaultStoreName}" cache successfully`)
  })

  test('Clear selected cache', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache', () => cache)
    ace.ui.switchMode('raw')

    const memoryStore = cache.use('memory')
    await memoryStore.set('foo', 'bar')
    assert.equal(await memoryStore.get('foo'), 'bar')

    const command = await ace.create(CacheClear, [])
    command.store = 'memory'
    await command.run()

    assert.isUndefined(await memoryStore.get('foo'))

    command.assertLog(`[ green(success) ] Cleared "memory" cache successfully`)
  })

  test('ask for confirmation when clearing cache in production', async ({
    fs,
    assert,
    cleanup,
  }) => {
    process.env.NODE_ENV = 'production'
    cleanup(() => {
      delete process.env.NODE_ENV
    })

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (path) => import(path),
    })

    await ace.app.init().then(() => ace.app.boot())
    ace.ui.switchMode('raw')

    const cache = getCacheService()
    ace.app.container.singleton('cache', () => cache)

    await cache.set('foo', 'bar')
    cleanup(() => cache.clear())

    const command = await ace.create(CacheClear, [])
    command.prompt
      .trap('You are in production environment. Want to continue clearing the cache?')
      .reject()

    await command.run()

    assert.equal(await cache.get('foo'), 'bar')
  })

  test('clear cache when user confirms production prompt', async ({ fs, assert, cleanup }) => {
    process.env.NODE_ENV = 'production'
    cleanup(() => {
      delete process.env.NODE_ENV
    })

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (path) => import(path),
    })

    await ace.app.init().then(() => ace.app.boot())
    ace.ui.switchMode('raw')

    const cache = getCacheService()
    ace.app.container.singleton('cache', () => cache)

    await cache.set('foo', 'bar')
    cleanup(() => cache.clear())

    const command = await ace.create(CacheClear, [])
    command.prompt
      .trap('You are in production environment. Want to continue clearing the cache?')
      .accept()

    await command.run()

    assert.isUndefined(await cache.get('foo'))
  })

  test('exit when user specify a non-existing cache store', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (path) => import(path),
    })

    await ace.app.init().then(() => ace.app.boot())
    ace.ui.switchMode('raw')

    const cache = getCacheService()
    ace.app.container.singleton('cache', () => cache)

    const command = await ace.create(CacheClear, [])
    command.store = 'foo'

    await command.run()

    command.assertLog(
      `[ red(error) ] "foo" is not a valid cache store. Double check config/cache.ts file`
    )
    assert.equal(command.exitCode, 1)
  })
})
