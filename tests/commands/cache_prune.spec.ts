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
import CachePrune from '../../commands/cache_prune.js'
import { getCacheService } from '../helpers.js'

test.group('CachePrune', () => {
  test('Prune default cache', async ({ fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    const command = await ace.create(CachePrune, [])
    await command.run()

    command.assertLog(
      `[ green(success) ] Pruned expired entries from "${cache.defaultStoreName}" cache successfully`
    )
  })

  test('Prune selected cache', async ({ fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const cache = getCacheService()
    ace.app.container.singleton('cache.manager', () => cache)
    ace.ui.switchMode('raw')

    const command = await ace.create(CachePrune, [])
    command.store = 'memory'
    await command.run()

    command.assertLog(`[ green(success) ] Pruned expired entries from "memory" cache successfully`)
  })

  test('ask for confirmation when pruning cache in production', async ({ fs, cleanup }) => {
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

    const command = await ace.create(CachePrune, [])
    command.prompt
      .trap('You are in production environment. Want to continue pruning expired cache entries?')
      .reject()

    await command.run()
  })
})
