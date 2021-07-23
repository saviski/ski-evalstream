import { stream, isAsyncIterable, MemoizedStream } from '@ski/streams/streams.js'
import { FunctionStreamProxy } from './function-stream-proxy.js'

export class LiveFunction<A extends any[], R extends object> extends FunctionStreamProxy<A, R | Error> {
  //
  private dependencies = new Map<AsyncIterable<any>, MemoizedStream<any>>()
  enabled = true

  constructor(fn: (...args: A) => R) {
    super((...args) => {
      try {
        return fn(...args)
      } catch (error) {
        console.error(fn.toString(), error)
        return error
      }
    })
  }

  async *onchange() {
    while (this.enabled) {
      let v = await Promise.race(
        Array.from(this.dependencies.values()).map(value => value[Symbol.asyncIterator]().next())
      )
      console.log('onchange', v)
      yield
    }
  }

  get(target: any, property: PropertyKey) {
    let value: unknown = target[property]

    console.log('get', property)

    if (isAsyncIterable(value)) {
      if (!this.dependencies.has(value)) this.dependencies.set(value, stream(value).memoize())

      return this.dependencies.get(value)!.value
    }

    return value
  }

  async *run(...args: A): AsyncGenerator<R> {
    yield* stream(super.run(...args)).filter<R>(value => !(value instanceof Error))
  }
}
