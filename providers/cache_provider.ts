/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationService } from '@adonisjs/core/types'

import { defineConfig } from '../index.js'
import type { CacheEvents } from 'bentocache/types'
import type { CacheService } from '../src/types.js'
import { defineReplBindings } from '../src/bindings/repl.js'
import { registerViewBindings } from '../src/bindings/edge.js'

/**
 * Extend Adonis.js types to include cache
 */
declare module '@adonisjs/core/types' {
  /**
   * Adding cache type to the application container
   */
  export interface ContainerBindings {
    'cache.manager': CacheService
  }

  /**
   * Add cache events to the application events list
   */
  export interface EventsList {
    'cache:cleared': CacheEvents['cache:cleared']
    'cache:deleted': CacheEvents['cache:deleted']
    'cache:hit': CacheEvents['cache:hit']
    'cache:miss': CacheEvents['cache:miss']
    'cache:written': CacheEvents['cache:written']
    'bus:message:published': CacheEvents['bus:message:published']
    'bus:message:received': CacheEvents['bus:message:received']
  }
}

/**
 * Cache provider to register cache specific bindings
 */
export default class CacheProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register the cache manager to the container
   */
  async #registerCacheManager() {
    const cacheConfig = this.app.config.get<ReturnType<typeof defineConfig>>('cache')

    this.app.container.singleton('cache.manager', async () => {
      const { BentoCache } = await import('bentocache')
      const emitter = await this.app.container.make('emitter')

      /**
       * Resolve all store config providers
       */
      const resolvedStores = Object.entries(cacheConfig.stores).map(async ([name, store]) => {
        return [name, await store.entry().resolver(this.app)]
      })

      return new BentoCache({
        ...cacheConfig,
        emitter: emitter as any,
        default: cacheConfig.default,
        stores: Object.fromEntries(await Promise.all(resolvedStores)),
      })
    })
  }

  /**
   * Register REPL bindings
   */
  async #registerReplBindings() {
    if (this.app.getEnvironment() !== 'repl') {
      return
    }

    const repl = await this.app.container.make('repl')
    defineReplBindings(this.app, repl)
  }

  /**
   * Register edge bindings
   */
  async #registerEdgeBindings() {
    if (!this.app.usingEdgeJS) return

    const manager = await this.app.container.make('cache.manager')
    registerViewBindings(manager)
  }

  /**
   * Register bindings
   */
  async register() {
    this.#registerCacheManager()
    this.#registerReplBindings()
    this.#registerEdgeBindings()
  }
}
