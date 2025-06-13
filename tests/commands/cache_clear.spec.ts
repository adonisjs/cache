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
import { getCacheService } from '../helpers.js'

test.group('CacheClear', () => {
  test('Clear default cache', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    await cache.set({ key: 'foo', value: 'bar' })
    assert.equal(await cache.get({ key: 'foo' }), 'bar')

    const command = await ace.create(CacheClear, [])
    await command.run()

    assert.isUndefined(await cache.get({ key: 'foo' }))

    command.assertLog(`[ green(success) ] Cleared "${cache.defaultStoreName}" cache successfully`)
  })

  test('Clear selected cache', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    const memoryStore = cache.use('memory')
    await memoryStore.set({ key: 'foo', value: 'bar' })
    assert.equal(await memoryStore.get({ key: 'foo' }), 'bar')

    const command = await ace.create(CacheClear, [])
    command.store = 'memory'
    await command.run()

    assert.isUndefined(await memoryStore.get({ key: 'foo' }))

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
    ace.app.container.singleton('cache.manager', () => cache)

    await cache.set({ key: 'foo', value: 'bar' })
    cleanup(() => cache.clear())

    const command = await ace.create(CacheClear, [])
    command.prompt
      .trap('You are in production environment. Want to continue clearing the cache?')
      .reject()

    await command.run()

    assert.equal(await cache.get({ key: 'foo' }), 'bar')
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
    ace.app.container.singleton('cache.manager', () => cache)

    await cache.set({ key: 'foo', value: 'bar' })
    cleanup(() => cache.clear())

    const command = await ace.create(CacheClear, [])
    command.prompt
      .trap('You are in production environment. Want to continue clearing the cache?')
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

    const command = await ace.create(CacheClear, [])
    command.store = 'foo'

    await command.run()

    command.assertLog(
      `[ red(error) ] "foo" is not a valid cache store. Double check config/cache.ts file`
    )
    assert.equal(command.exitCode, 1)
  })

  test('Clear a specific namespace in the default cache', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    await cache.set({ key: 'foo', value: 'bar' })
    assert.equal(await cache.get({ key: 'foo' }), 'bar')

    await cache.namespace('users').set({ key: 'foo', value: 'bar' })
    assert.equal(await cache.namespace('users').get({ key: 'foo' }), 'bar')

    const command = await ace.create(CacheClear, [])
    command.namespace = 'users'
    await command.run()

    assert.equal(await cache.get({ key: 'foo' }), 'bar')
    assert.isUndefined(await cache.namespace('users').get({ key: 'foo' }))

    command.assertLog(
      `[ green(success) ] Cleared namespace "users" for "${cache.defaultStoreName}" cache successfully`
    )
  })

  test('Clear cache by tags', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    await cache.set({ key: 'user:1', value: 'john', tags: ['users', 'active'] })
    await cache.set({ key: 'user:2', value: 'jane', tags: ['users', 'inactive'] })
    await cache.set({ key: 'product:1', value: 'laptop', tags: ['products', 'electronics'] })

    assert.equal(await cache.get({ key: 'user:1' }), 'john')
    assert.equal(await cache.get({ key: 'user:2' }), 'jane')
    assert.equal(await cache.get({ key: 'product:1' }), 'laptop')

    const command = await ace.create(CacheClear, [])
    command.tags = ['users']
    await command.run()

    // Entries with 'users' tag should be invalidated
    assert.isUndefined(await cache.get({ key: 'user:1' }))
    assert.isUndefined(await cache.get({ key: 'user:2' }))
    // Entry with different tag should remain
    assert.equal(await cache.get({ key: 'product:1' }), 'laptop')

    command.assertLog(
      `[ green(success) ] Invalidated tags [users] for "${cache.defaultStoreName}" cache successfully`
    )
  })

  test('Clear cache by multiple tags', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    // Set entries with different tags
    await cache.set({ key: 'user:1', value: 'john', tags: ['users', 'active'] })
    await cache.set({ key: 'user:2', value: 'jane', tags: ['users', 'inactive'] })
    await cache.set({ key: 'product:1', value: 'laptop', tags: ['products', 'electronics'] })
    await cache.set({ key: 'category:1', value: 'tech', tags: ['categories'] })

    const command = await ace.create(CacheClear, [])
    command.tags = ['users', 'products']
    await command.run()

    // Entries with 'users' or 'products' tags should be invalidated
    assert.isUndefined(await cache.get({ key: 'user:1' }))
    assert.isUndefined(await cache.get({ key: 'user:2' }))
    assert.isUndefined(await cache.get({ key: 'product:1' }))
    // Entry with different tag should remain
    assert.equal(await cache.get({ key: 'category:1' }), 'tech')

    command.assertLog(
      `[ green(success) ] Invalidated tags [users, products] for "${cache.defaultStoreName}" cache successfully`
    )
  })

  test('should error when both namespace and tags are specified', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    const command = await ace.create(CacheClear, [])
    command.namespace = 'users'
    command.tags = ['active']

    await command.run()

    command.assertLog(
      '[ red(error) ] Cannot use --namespace and --tags options together. Please choose one or the other.'
    )
    assert.equal(command.exitCode, 1)
  })
})
