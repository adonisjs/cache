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
  CreateBusDriverResult,
  DynamoDBConfig,
  FileConfig,
  RedisConfig,
  BusOptions,
  KyselyConfig,
  OrchidConfig,
  DatabaseConfig,
} from 'bentocache/types'
import { RuntimeException } from '@adonisjs/core/exceptions'

/**
 * Different drivers supported by the cache module
 */
export const drivers: {
  memory: (config?: MemoryConfig) => ConfigProvider<CreateDriverResult<L1CacheDriver>>
  redis: (
    config: Omit<RedisConfig, 'connection'> & { connectionName?: keyof RedisConnections }
  ) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
  redisBus: (
    config: BusOptions & { connectionName?: keyof RedisConnections }
  ) => ConfigProvider<CreateBusDriverResult>
  database: (
    config?: DatabaseConfig & { connectionName?: string }
  ) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
  dynamodb: (config: DynamoDBConfig) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
  file: (config: FileConfig) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
  kysely: (config: KyselyConfig) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
  orchid: (config: OrchidConfig) => ConfigProvider<CreateDriverResult<L2CacheDriver>>
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
      return redisDriver({ connection: redisConnection.ioConnection, prefix: config.prefix })
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
      return redisBusDriver({
        connection: redisConnection.ioConnection.options,
        retryQueue: config.retryQueue,
      })
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
      const connection = db.manager.get(connectionName)

      /**
       * Throw error when mentioned connection is not specified
       * in the database file
       */
      if (!connection) {
        throw new RuntimeException(
          `Invalid connection name "${connectionName}" referenced by "config/cache.ts" file. First register the connection inside "config/database.ts" file`
        )
      }

      const { knexDriver } = await import('bentocache/drivers/knex')
      return knexDriver({
        connection: db.connection(connectionName).getWriteClient(),
        autoCreateTable: config?.autoCreateTable ?? true,
        tableName: config?.tableName || 'bentocache',
        pruneInterval: config?.pruneInterval ?? false,
        prefix: config?.prefix,
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

  /**
   * Kysely driver for L2 layer
   */
  kysely(config) {
    return configProvider.create(async () => {
      const { kyselyDriver } = await import('bentocache/drivers/kysely')
      return kyselyDriver(config)
    })
  },

  /**
   * Orchid driver for L2 layer
   */
  orchid(config) {
    return configProvider.create(async () => {
      const { orchidDriver } = await import('bentocache/drivers/orchid')
      return orchidDriver(config)
    })
  },
}
