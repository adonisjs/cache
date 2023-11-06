/*
 * @adonisjs/cache
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { bentostore } from 'bentocache'
import { configProvider } from '@adonisjs/core'
import { ConfigProvider } from '@adonisjs/core/types'
import {
  RawCommonOptions,
  CreateDriverResult,
  L1CacheDriver,
  CreateBusDriverResult,
  L2CacheDriver,
} from 'bentocache/types'

/**
 * Create a new store
 */
export function store(options?: RawCommonOptions & { prefix?: string }) {
  return new Store(options)
}

export class Store {
  #baseOptions: RawCommonOptions & { prefix?: string } = {}
  #l1?: ConfigProvider<CreateDriverResult<L1CacheDriver>>
  #l2?: ConfigProvider<CreateDriverResult<L2CacheDriver>>
  #bus?: ConfigProvider<CreateBusDriverResult>

  constructor(baseOptions: RawCommonOptions & { prefix?: string } = {}) {
    this.#baseOptions = baseOptions
  }

  /**
   * Add a L1 layer to your store. This is usually a memory driver
   * for fast access purposes.
   */
  useL1Layer(driver: ConfigProvider<CreateDriverResult<L1CacheDriver>>) {
    this.#l1 = driver
    return this
  }

  /**
   * Add a L2 layer to your store. This is usually something
   * distributed like Redis, DynamoDB, Sql database, etc.
   */
  useL2Layer(driver: ConfigProvider<CreateDriverResult<L2CacheDriver>>) {
    this.#l2 = driver
    return this
  }

  /**
   * Add a bus to your store. It will be used to synchronize L1 layers between
   * different instances of your application.
   */
  useBus(bus: ConfigProvider<CreateBusDriverResult>) {
    this.#bus = bus
    return this
  }

  /**
   * Create a config provider for the store
   */
  entry() {
    return configProvider.create(async (app) => {
      const storeInstance = bentostore(this.#baseOptions)

      if (this.#l1) storeInstance.useL1Layer(await this.#l1?.resolver(app))
      if (this.#l2) storeInstance.useL2Layer(await this.#l2?.resolver(app))
      if (this.#bus) storeInstance.useBus(await this.#bus?.resolver(app))

      return storeInstance
    })
  }
}
