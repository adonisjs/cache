/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Repl } from '@adonisjs/core/repl'
import type { ApplicationService } from '@adonisjs/core/types'

/**
 * Helper to define REPL state
 */
function setupReplState(repl: any, key: string, value: any) {
  repl.server.context[key] = value
  repl.notify(
    `Loaded ${key} module. You can access it using the "${repl.colors.underline(key)}" variable`
  )
}

/**
 * Define REPL bindings
 */
export function defineReplBindings(app: ApplicationService, Repl: Repl) {
  /**
   * Load cache provider to the cache property
   */
  Repl.addMethod(
    'loadCache',
    async (repl) => setupReplState(repl, 'cache', await app.container.make('cache.manager')),
    { description: 'Load cache provider to the "cache" property' }
  )
}
