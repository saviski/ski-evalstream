import SkiReactiveFunction from './ski-reactive-function.js'
import { map } from '@ski/streams/streams.js'

export default abstract class SkiProxyFunction<T extends object>
  extends SkiReactiveFunction<any>
  implements Partial<ProxyHandler<T>> {
  //
  private proxyTarget = new Map<object, object>()

  constructor(wrappedFunction: (scope: T, ...args) => any) {
    super(wrappedFunction)
  }

  wrap(data: object) {
    let result = new Proxy(data, this)
    this.proxyTarget.set(result, data)
    return result
  }

  unwrap(value: any) {
    const result = this.proxyTarget.get(value) || value
    this.proxyTarget.clear()
    return result
  }

  run(scope: T, ...args): AsyncGenerator<any, void> {
    const scopeproxy = this.wrap(scope)
    return map(super.run(scopeproxy, ...args), value => this.unwrap(value))
  }

  abstract getValue(target: any, property: PropertyKey, receiver: any): any

  get(target: any, property: PropertyKey, receiver: any) {
    const value = this.getValue(target, property, receiver)
    return value && typeof value === 'object' ? this.wrap(value) : value
  }

  set = this.error
  deleteProperty = this.error
  defineProperty = this.error

  error(target, property): any {
    throw Error(
      `Can't modify properties in computed expressions.
      Failed trying to modify property: ${property} of ${target}`
    )
  }
}
