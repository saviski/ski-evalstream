import { LiveFunction } from './live-function.js'

export class LiveExpression<U, T extends object> extends LiveFunction<[scope: object], T> {
  constructor(expression: string, context: U, name?: string) {
    super(
      Object.assign(new Function('__scope__', `with (__scope__) return (${expression || undefined})`).bind(context), {
        toString: () => `${name}() => ${expression}`,
      })
    )
  }

  get(target: any, property: PropertyKey) {
    if (property === Symbol.unscopables) return target[property]
    return super.get(target, property)
  }
}
