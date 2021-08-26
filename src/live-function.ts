import { stream, isAsyncIterable, Memoized, UNINITIALIZED } from '@ski/streams/streams.js'
import { FunctionProxy } from './function-proxy.js'

export class LiveFunction<A extends any[], R> extends FunctionProxy<A, AsyncGenerator<R>> {
  //
  private dependencies = new Map<AsyncIterable<any>, Memoized<any>>()
  private promises = new Set<Promise<IteratorResult<any, any>>>()

  enabled = true

  constructor(fn: (...args: A) => R) {
    super(<any>fn)
  }

  private async next(generator: AsyncIterator<any>) {
    let promise = generator.next()
    this.promises.add(promise)
    let { done } = await promise
    this.promises.delete(promise)
    !done && this.next(generator)
    this.enabled = this.promises.size > 0
  }

  private addDependency(dependency: AsyncIterable<any>) {
    let memo = stream(dependency).memoize()
    this.dependencies.set(dependency, memo)
    this.next(memo[Symbol.asyncIterator]())
    return memo
  }

  get(target: any, property: PropertyKey) {
    let value: unknown = target[property]
    return isAsyncIterable(value) ? (this.dependencies.get(value) || this.addDependency(value)).value : value
  }

  async *run(...args: A): AsyncGenerator<R> {
    let argsproxy = args.map(arg => this.wrap(arg)) as A

    while (this.enabled) {
      try {
        if (!done) yield this.unwrap(this.fn(...argsproxy) as unknown as R)
      } catch (e) {
        if (e != UNINITIALIZED) throw e
      }

      if (this.promises.size == 0) return
      var { done } = await Promise.race(this.promises)
    }
  }
}
