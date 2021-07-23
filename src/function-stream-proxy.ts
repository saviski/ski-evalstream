import { stream } from '@ski/streams/streams.js'

const itself = Symbol('self')

export abstract class FunctionStreamProxy<A extends any[], T extends object> {
  //
  constructor(private fn: (...args: A) => T) {}

  abstract get(target: any, property: PropertyKey, receiver: any): unknown

  protected abstract onchange(): AsyncIterable<void>

  private proxyhandler: ProxyHandler<any> = {
    //
    get: (target: any, property: PropertyKey, receiver: any) => {
      if (property === itself) return target
      const value = this.get(target, property, receiver)
      return value && typeof value === 'object' ? this.wrap(value) : value
    },

    defineProperty: () => false,

    deleteProperty: () => false,

    set: () => false,

    setPrototypeOf: () => false,
  }

  protected wrap<V>(value: V): V {
    return typeof value == 'object' ? new Proxy(value, this.proxyhandler) : value
  }

  protected unwrap<V>(value: V): V {
    return (value && value[itself]) || value
  }

  async *run(...args: A): AsyncGenerator<T> {
    let argsproxy = args.map(arg => this.wrap(arg)) as A

    async function* run(this: FunctionStreamProxy<A, T>) {
      yield this.unwrap(this.fn(...argsproxy))
    }

    yield* run.call(this)

    yield* stream(this.onchange()).trigger(run, this)
  }
}
