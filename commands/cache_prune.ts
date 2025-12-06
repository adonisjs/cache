/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { args, BaseCommand } from '@adonisjs/core/ace'

import { CacheService } from '../src/types.ts'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class CachePrune extends BaseCommand {
  static commandName = 'cache:prune'
  static description =
    'Remove expired cache entries from the selected store. This command is only useful for stores without native TTL support, like Database or File drivers.'
  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * Choose a custom cache store to prune. Otherwise, we use the
   * default one
   */
  @args.string({ description: 'Define a custom cache store to prune', required: false })
  declare store: string

  /**
   * Prompts to take consent when pruning the cache in production
   */
  async #takeProductionConsent(): Promise<boolean> {
    const question =
      'You are in production environment. Want to continue pruning expired cache entries?'
    try {
      return await this.prompt.confirm(question)
    } catch (error) {
      return false
    }
  }

  /**
   * Check if the given cache exist
   */
  #cacheExists(cache: CacheService, cacheName: string) {
    try {
      cache.use(cacheName)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Handle command
   */
  async run() {
    const cache = await this.app.container.make('cache.manager')
    this.store = this.store || cache.defaultStoreName

    /**
     * Exit if cache store doesn't exist
     */
    if (!this.#cacheExists(cache, this.store)) {
      this.logger.error(
        `"${this.store}" is not a valid cache store. Double check config/cache.ts file`
      )
      this.exitCode = 1
      return
    }

    /**
     * Take consent when pruning the cache in production
     */
    if (this.app.inProduction) {
      const shouldPrune = await this.#takeProductionConsent()
      if (!shouldPrune) return
    }

    /**
     * Finally prune the cache
     */
    const cacheHandler = cache.use(this.store)
    await cacheHandler.prune()

    this.logger.success(`Pruned expired entries from "${this.store}" cache successfully`)
  }
}
