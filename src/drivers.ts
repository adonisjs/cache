/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference types="@adonisjs/redis/redis_provider" />
/// <reference types="@adonisjs/lucid/database_provider" />

import { configProvider } from '@adonisjs/core'
import type { RedisConnection } from '@adonisjs/redis'
import type { ConfigProvider } from '@adonisjs/core/types'
import type { RedisConnections } from '@adonisjs/redis/types'
import {
  MemoryConfig,
  CreateDriverResult,
  L1CacheDriver,
  L2CacheDriver,
  DialectName,
  CreateBusDriverResult,
  DynamoDBConfig,
  FileConfig,
} from 'bentocache/types'

/**
 * Different drivers supported by the cache module
 */
export const drivers: {
  memory: (config: MemoryConfig) => ConfigProvider<CreateDriverResult<L1CacheDriver>>
  redis: (config: {
    connectionName?: keyof RedisConnections
  }) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
  redisBus: (config: {
    connectionName?: keyof RedisConnections
  }) => ConfigProvider<CreateBusDriverResult>
  database: (config?: {
    connectionName?: string
  }) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
  dynamodb: (config: DynamoDBConfig) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
  file: (config: FileConfig) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
} = {
  /**
   * Redis driver for L2 layer
   * You must install @adonisjs/redis to use this driver
   */
  redis(config) {
    return configProvider.create(async (app) => {
      const redis = await app.container.make('redis')
      const { redisDriver } = await import('bentocache/drivers/redis')

      const redisConnection = redis.connection(config.connectionName) as any as RedisConnection
      return redisDriver({ connection: redisConnection.ioConnection })
    })
  },

  /**
   * Redis driver for the sync bus
   * You must install @adonisjs/redis to use this driver
   */
  redisBus(config) {
    return configProvider.create(async (app) => {
      const redis = await app.container.make('redis')
      const { redisBusDriver } = await import('bentocache/drivers/redis')

      const redisConnection = redis.connection(config.connectionName) as any as RedisConnection
      return redisBusDriver({ connection: redisConnection.ioConnection.options })
    })
  },

  /**
   * Memory driver for L1 layer
   */
  memory(config) {
    return configProvider.create(async () => {
      const { memoryDriver } = await import('bentocache/drivers/memory')
      return memoryDriver(config)
    })
  },

  /**
   * Database driver for L2 layer
   * You must install @adonisjs/lucid to use this driver
   */
  database(config) {
    return configProvider.create(async (app) => {
      const db = await app.container.make('lucid.db')
      const connectionName = config?.connectionName || db.primaryConnectionName
      const dialect = db.connection(connectionName).dialect.name

      /**
       * We only support pg, mysql, better-sqlite3 and sqlite3 dialects for now
       */
      const supportedDialects = ['pg', 'mysql', 'better-sqlite3', 'sqlite3']
      if (!supportedDialects.includes(dialect)) {
        throw new Error(`Unsupported dialect "${dialect}"`)
      }

      /**
       * Get the knex connection for the given connection name
       */
      const rawConnection = db.getRawConnection(connectionName)
      if (!rawConnection?.connection?.client) {
        throw new Error(`Unable to get raw connection for "${connectionName}"`)
      }

      /**
       * Create the driver
       */
      const { knexDriver } = await import('bentocache/drivers/sql')
      return knexDriver({
        connection: rawConnection.connection.client,
        dialect: dialect === 'postgres' ? 'pg' : (dialect as DialectName),
      })
    })
  },

  /**
   * DynamoDB driver for L2 layer
   * You must install @aws-sdk/client-dynamodb to use this driver
   */
  dynamodb(config) {
    return configProvider.create(async () => {
      const { dynamoDbDriver } = await import('bentocache/drivers/dynamodb')
      return dynamoDbDriver(config)
    })
  },

  /**
   * File driver for L2 layer
   */
  file(config) {
    return configProvider.create(async () => {
      const { fileDriver } = await import('bentocache/drivers/file')
      return fileDriver(config)
    })
  },
}
