/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { pEvent } from 'p-event'
import { test } from '@japa/runner'

import { setupApp } from '../test_helpers/index.js'

test.group('Provider', () => {
  test('app emitter should be binded to bentocache', async ({ assert }) => {
    const app = await setupApp()

    const cache = await app.container.make('cache')
    const emitter = await app.container.make('emitter')

    cache.set('foo', 'bar')

    const event = await pEvent(emitter, 'cache:written')
    assert.deepEqual(event, { key: 'foo', value: 'bar', store: 'memory' })
  })

  test('app emitter should be extended with events types', async ({ expectTypeOf }) => {
    const app = await setupApp()
    const emitter = await app.container.make('emitter')

    const onProperty = expectTypeOf(emitter).toHaveProperty('on')
    onProperty.toBeCallableWith('cache:cleared', () => {})
    onProperty.toBeCallableWith('cache:written', () => {})
    onProperty.toBeCallableWith('cache:deleted', () => {})
  })

  test('should disconnect stores when shutting down the app', async () => {
    const app = await setupApp()
    const cache = await app.container.make('cache')

    await cache.use('redis').get('foo')

    await app.terminate()
  })

  test('register repl bindings', async ({ assert }) => {
    const app = await setupApp('repl')

    const repl = await app.container.make('repl')
    const replMethods = repl.getMethods()

    assert.property(replMethods, 'loadCache')
    assert.isFunction(replMethods.loadCache.handler)
  })
})
