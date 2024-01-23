/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const stubsRoot = dirname(fileURLToPath(import.meta.url))
