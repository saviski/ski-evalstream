const itself = Symbol('self')

export abstract class FunctionProxy<A extends any[], T extends object> {
  //
  constructor(protected fn: (...args: A) => T) {}

  abstract get(target: any, property: PropertyKey, receiver: any): unknown

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

  run(...args: A): T {
    let argsproxy = args.map(arg => this.wrap(arg)) as A
    return this.unwrap(this.fn(...argsproxy))
  }
}
