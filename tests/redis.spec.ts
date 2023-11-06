/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { setTimeout } from 'node:timers/promises'
import { defineConfig as defineRedisConfig } from '@adonisjs/redis'

import { setupApp } from '../test_helpers/index.js'
import { defineConfig, drivers, store } from '../index.js'

test.group('Redis', () => {
  test('re-use adonisjs/redis connection instance', async ({ assert }) => {
    const app = await setupApp('web', {
      redis: defineRedisConfig({
        connection: 'local',
        connections: { local: { host: '127.0.0.1', port: 6379 } },
      }),
      cache: defineConfig({
        default: 'redis',
        stores: {
          redis: store().useL2Layer(drivers.redis({ connectionName: 'local' as any })),
        },
      }),
    })

    const redis = await app.container.make('redis')
    const cache = await app.container.make('cache')

    await cache.set('foo', 'bar')
    await redis.set('bentocache:foo', 'bar')

    const result = await redis.info('clients')
    const connectedClients = result.split('\n')[1].split(':')[1].trim()

    assert.equal(connectedClients, '1')
  })

  test('by default it should prefix the keys', async ({ assert }) => {
    const app = await setupApp('web', {
      redis: defineRedisConfig({
        connection: 'local',
        connections: { local: { host: '127.0.0.1', port: 6379 } },
      }),
      cache: defineConfig({
        default: 'redis',
        stores: {
          redis: store().useL2Layer(drivers.redis({ connectionName: 'local' as any })),
        },
      }),
    })

    const redis = await app.container.make('redis')
    const cache = await app.container.make('cache')

    await cache.set('foo', 'bar')

    const result = await redis.get('bentocache:foo')

    assert.isDefined(result)
    assert.equal(JSON.parse(result!).value, 'bar')
  })

  test('bus should works fine', async ({ assert }) => {
    assert.plan(2)

    const config = {
      redis: defineRedisConfig({
        connection: 'local',
        connections: { local: { host: '127.0.0.1', port: 6379 } },
      }),
      cache: defineConfig({
        default: 'redis',
        stores: {
          redis: store()
            .useL1Layer(drivers.memory({}))
            .useL2Layer(drivers.redis({ connectionName: 'local' as any }))
            .useBus(drivers.redisBus({ connectionName: 'local' as any })),
        },
      }),
    }
    const app = await setupApp('web', config)

    const redis = await app.container.make('redis')
    const cache = await app.container.make('cache')

    redis.subscribe('bentocache.notifications', () => assert.isTrue(true))

    await setTimeout(200)
    await cache.set('foo', 'bar')
    await cache.delete('foo')
    await setTimeout(200)
  })
})
