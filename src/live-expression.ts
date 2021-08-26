import { LiveFunction } from './live-function.js'

export class LiveExpression<T, U = any> extends LiveFunction<[scope: object], T> {
  constructor(expression: string, context?: U, name?: string) {
    super(
      Object.assign(new Function('__scope__', `with (__scope__) return (${expression || undefined})`).bind(context), {
        toString: () => `function ${name}() { return ${expression} }`,
      })
    )
  }

  get(target: any, property: PropertyKey) {
    if (property === Symbol.unscopables) return target[property]
    return super.get(target, property)
  }
}
