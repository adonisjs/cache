/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, flags } from '@adonisjs/core/ace'

import { CacheService } from '../src/types.js'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class CacheClear extends BaseCommand {
  static commandName = 'cache:clear'
  static description = 'Clear the application cache'
  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * Choose a custom cache store to clear. Otherwise, we use the
   * default one
   */
  @flags.string({ description: 'Define a custom cache store to clear', alias: 's' })
  declare store: string

  /**
   * Prompts to take consent when clearing the cache in production
   */
  async #takeProductionConsent(): Promise<boolean> {
    const question = 'You are in production environment. Want to continue clearing the cache?'
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
     * Exit if cache store doesn't exists
     */
    if (!this.#cacheExists(cache, this.store)) {
      this.logger.error(
        `"${this.store}" is not a valid cache store. Double check config/cache.ts file`
      )
      this.exitCode = 1
      return
    }

    /**
     * Take consent when clearing the cache in production
     */
    if (this.app.inProduction) {
      const shouldClear = await this.#takeProductionConsent()
      if (!shouldClear) return
    }

    /**
     * Finally clear the cache
     */
    await cache.use(this.store).clear()
    this.logger.success(`Cleared "${this.store}" cache successfully`)
  }
}
