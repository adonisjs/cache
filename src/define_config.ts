/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Store } from './store.js'
import { CacheOptions } from './types.js'

/**
 * Define cache configuration
 */
export function defineConfig<KnownCaches extends Record<string, Store>>(
  config: CacheOptions & {
    default: keyof KnownCaches
    stores: KnownCaches
  }
) {
  return config
}
