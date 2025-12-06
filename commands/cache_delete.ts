/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { args, BaseCommand } from '@adonisjs/core/ace'

import { type CacheService } from '../src/types.ts'
import { type CommandOptions } from '@adonisjs/core/types/ace'

export default class CacheDelete extends BaseCommand {
  static commandName = 'cache:delete'
  static description = 'Delete a specific cache entry by key'
  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * The cache key to delete
   */
  @args.string({ description: 'The cache key to delete' })
  declare key: string

  /**
   * Choose a custom cache store to delete from. Otherwise, we use the
   * default one
   */
  @args.string({ description: 'Define a custom cache store to delete from', required: false })
  declare store: string

  /**
   * Prompts to take consent when deleting cache entry in production
   */
  async #takeProductionConsent(): Promise<boolean> {
    const question = `You are in production environment. Want to continue deleting cache key "${this.key}"?`
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
     * Take consent when deleting cache entry in production
     */
    if (this.app.inProduction) {
      const shouldDelete = await this.#takeProductionConsent()
      if (!shouldDelete) return
    }

    /**
     * Finally delete the cache entry
     */
    const cacheHandler = cache.use(this.store)
    const deleted = await cacheHandler.delete({ key: this.key })

    if (deleted) {
      this.logger.success(`Deleted cache key "${this.key}" from "${this.store}" cache successfully`)
    } else {
      this.logger.warning(`Cache key "${this.key}" not found in "${this.store}" cache`)
    }
  }
}
