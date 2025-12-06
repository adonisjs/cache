/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { args, BaseCommand, flags } from '@adonisjs/core/ace'

import { CacheService } from '../src/types.ts'
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
  @args.string({ description: 'Define a custom cache store to clear', required: false })
  declare store: string

  /**
   * Optionally select a namespace to clear. Defaults to the whole cache.
   */
  @flags.string({ description: 'Select a cache namespace to clear', alias: 'n' })
  declare namespace: string

  /**
   * Optionally specify tags to invalidate. Can be used multiple times.
   */
  @flags.array({ description: 'Specify tags to invalidate', alias: 't' })
  declare tags: string[]

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
     * Validate that namespace and tags are not used together
     */
    if (this.namespace && this.tags && this.tags.length > 0) {
      this.logger.error(
        'Cannot use --namespace and --tags options together. Please choose one or the other.'
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
    const cacheHandler = cache.use(this.store)

    if (this.tags && this.tags.length > 0) {
      await cacheHandler.deleteByTag({ tags: this.tags })
      this.logger.success(
        `Invalidated tags [${this.tags.join(', ')}] for "${this.store}" cache successfully`
      )
    } else if (this.namespace) {
      await cacheHandler.namespace(this.namespace).clear()
      this.logger.success(
        `Cleared namespace "${this.namespace}" for "${this.store}" cache successfully`
      )
    } else {
      await cacheHandler.clear()
      this.logger.success(`Cleared "${this.store}" cache successfully`)
    }
  }
}
