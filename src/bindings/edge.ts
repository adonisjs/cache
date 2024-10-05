/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import debug from '../debug.js'
import { CacheService } from '../types.js'

export async function registerViewBindings(manager: CacheService) {
  const edge = await import('edge.js')
  debug('detected edge installation. Registering drive global helpers')

  edge.default.global('cache', manager)
}
