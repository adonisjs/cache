/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Store } from './store.ts'
import { CacheOptions } from './types.ts'

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
