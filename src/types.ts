/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BentoCache, bentostore } from 'bentocache'
import type { RawBentoCacheOptions } from 'bentocache/types'

/**
 * The options accepted by the cache module
 */
export type CacheOptions = Omit<RawBentoCacheOptions, 'logger' | 'emitter'>

/**
 * A list of known caches stores inferred from the user config
 */
export interface CacheStores {}

/**
 * The cache service interface registered with the container
 */
export interface CacheService
  extends BentoCache<
    CacheStores extends Record<string, ReturnType<typeof bentostore>> ? CacheStores : never
  > {}
