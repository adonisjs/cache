/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { CacheService } from '../src/types.js'
import app from '@adonisjs/core/services/app'

let cache: CacheService

/**
 * Returns a singleton instance of the Cache manager
 */
await app.booted(async () => {
  cache = await app.container.make('cache')
})

export { cache as default }
