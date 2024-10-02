/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { test } from '@japa/runner'
import { defineConfig as defineLucidConfig } from '@adonisjs/lucid'

import { setupApp } from './helpers.js'
import { defineConfig, drivers, store } from '../index.js'

test.group('Database', () => {
  test('use database defined connection', async ({ assert, fs }) => {
    await fs.create('foo', '') // create a file to make sure directory exists

    const app = await setupApp('web', {
      database: defineLucidConfig({
        connection: 'sqlite',
        connections: {
          sqlite: {
            client: 'better-sqlite3',
            connection: { filename: join(fs.basePath, 'db.sqlite3') },
            useNullAsDefault: true,
          },
          sqlite2: {
            client: 'better-sqlite3',
            connection: { filename: join(fs.basePath, 'db2.sqlite3') },
            useNullAsDefault: true,
          },
        },
      }),
      cache: defineConfig({
        default: 'sqlite',
        stores: {
          sqlite: store().useL2Layer(drivers.database({ connectionName: 'sqlite2' })),
        },
      }),
    })

    const db = await app.container.make('lucid.db')
    const cache = await app.container.make('cache.manager')

    await cache.set('foo', 'bar')

    const r1 = await db
      .connection('sqlite2')
      .from('bentocache')
      .select('*')
      .where('key', 'bentocache:foo')
      .firstOrFail()

    const r2 = await cache.get('foo')

    assert.deepEqual(JSON.parse(r1.value).value, 'bar')
    assert.equal(r2, 'bar')
  })

  test('use default database connection if not defined', async ({ assert, fs }) => {
    await fs.create('foo', '') // create a file to make sure directory exists

    const app = await setupApp('web', {
      database: defineLucidConfig({
        connection: 'sqlite',
        connections: {
          sqlite: {
            client: 'better-sqlite3',
            connection: { filename: join(fs.basePath, 'db.sqlite3') },
            useNullAsDefault: true,
          },
          sqlite2: {
            client: 'better-sqlite3',
            connection: { filename: join(fs.basePath, 'db2.sqlite3') },
            useNullAsDefault: true,
          },
        },
      }),
      cache: defineConfig({
        default: 'sqlite',
        stores: {
          sqlite: store().useL2Layer(drivers.database()),
        },
      }),
    })

    const db = await app.container.make('lucid.db')
    const cache = await app.container.make('cache.manager')

    await cache.set('foo', 'bar')

    const r1 = await db
      .connection('sqlite')
      .from('bentocache')
      .select('*')
      .where('key', 'bentocache:foo')
      .firstOrFail()

    assert.deepEqual(JSON.parse(r1.value).value, 'bar')
  })
})
