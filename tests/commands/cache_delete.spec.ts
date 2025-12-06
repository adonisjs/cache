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
import CacheDelete from '../../commands/cache_delete.ts'
import { getCacheService } from '../helpers.ts'

test.group('CacheDelete', () => {
  test('Delete existing cache key from default cache', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    await cache.set({ key: 'foo', value: 'bar' })
    await cache.set({ key: 'baz', value: 'qux' })
    assert.equal(await cache.get({ key: 'foo' }), 'bar')
    assert.equal(await cache.get({ key: 'baz' }), 'qux')

    const command = await ace.create(CacheDelete, ['foo'])
    await command.run()

    assert.isUndefined(await cache.get({ key: 'foo' }))
    assert.equal(await cache.get({ key: 'baz' }), 'qux')

    command.assertLog(
      `[ green(success) ] Deleted cache key "foo" from "${cache.defaultStoreName}" cache successfully`
    )
  })

  test('Delete existing cache key from selected cache', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    const memoryStore = cache.use('memory')
    await memoryStore.set({ key: 'foo', value: 'bar' })
    await memoryStore.set({ key: 'baz', value: 'qux' })
    assert.equal(await memoryStore.get({ key: 'foo' }), 'bar')
    assert.equal(await memoryStore.get({ key: 'baz' }), 'qux')

    const command = await ace.create(CacheDelete, ['foo', 'memory'])
    await command.run()

    assert.isUndefined(await memoryStore.get({ key: 'foo' }))
    assert.equal(await memoryStore.get({ key: 'baz' }), 'qux')

    command.assertLog(`[ green(success) ] Deleted cache key "foo" from "memory" cache successfully`)
  })

  test('ask for confirmation when deleting cache key in production', async ({
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
    ace.app.container.singleton('cache.manager', () => cache)

    await cache.set({ key: 'foo', value: 'bar' })
    cleanup(() => cache.clear())

    const command = await ace.create(CacheDelete, ['foo'])
    command.prompt
      .trap('You are in production environment. Want to continue deleting cache key "foo"?')
      .reject()

    await command.run()

    assert.equal(await cache.get({ key: 'foo' }), 'bar')
  })

  test('delete cache key when user confirms production prompt', async ({ fs, assert, cleanup }) => {
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
    ace.app.container.singleton('cache.manager', () => cache)

    await cache.set({ key: 'foo', value: 'bar' })
    cleanup(() => cache.clear())

    const command = await ace.create(CacheDelete, ['foo'])
    command.prompt
      .trap('You are in production environment. Want to continue deleting cache key "foo"?')
      .accept()

    await command.run()

    assert.isUndefined(await cache.get({ key: 'foo' }))
  })

  test('exit when user specify a non-existing cache store', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (path) => import(path),
    })

    await ace.app.init().then(() => ace.app.boot())
    ace.ui.switchMode('raw')

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)

    const command = await ace.create(CacheDelete, ['foo', 'non-existing'])
    await command.run()

    command.assertLog(
      `[ red(error) ] "non-existing" is not a valid cache store. Double check config/cache.ts file`
    )
    assert.equal(command.exitCode, 1)
  })

  test('delete cache key with special characters', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    const specialKey = 'user:123:profile'
    await cache.set({ key: specialKey, value: 'profile data' })
    assert.equal(await cache.get({ key: specialKey }), 'profile data')

    const command = await ace.create(CacheDelete, [specialKey])
    await command.run()

    assert.isUndefined(await cache.get({ key: specialKey }))

    command.assertLog(
      `[ green(success) ] Deleted cache key "${specialKey}" from "${cache.defaultStoreName}" cache successfully`
    )
  })
})
