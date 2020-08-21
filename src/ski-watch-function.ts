import SkiProxyFunction from './ski-proxy-function.js'

const watching = Symbol('watching')

export default class SkiWatchFunction extends SkiProxyFunction<any> {
  getValue(target: any, property: PropertyKey, receiver: any) {
    target[watching]?.includes(property) || this.watch(target, property)
    return Reflect.get(target, property, receiver)
  }

  watch(target, property) {
    const descriptor =
      Object.getOwnPropertyDescriptor(target, property) ??
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), property)

    let value = !descriptor && target[property]
    Object.defineProperty(target, property, {
      get: () => descriptor?.get?.call(target) ?? value,

      set: newvalue => {
        descriptor?.set?.call(target, value) ?? (value = newvalue)
        this.changed()
      },

      enumerable: descriptor?.enumerable,
    })
    ;(target[watching] || (target[watching] = [])).push(property)
  }
}
