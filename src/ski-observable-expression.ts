import SkiObservableFunction from './ski-observable-function.js'
import { hasAsyncGenerator, pick } from '@ski/streams'

export default class SkiObservableExpresion<
  T extends object = any
> extends SkiObservableFunction<T> {
  constructor(expression: string, context: any) {
    super(
      new Function(
        '__scope__',
        `with (__scope__) return (${expression || undefined})`
      ).bind(context)
    )
  }

  getValue(target: any, property: PropertyKey, receiver: any) {
    if (property === Symbol.unscopables) return target[property]
    let value = hasAsyncGenerator<any>(target)
      ? (this.watch(target), pick(target, property))
      : super.getValue(target, property, receiver)
    return value
  }
}
