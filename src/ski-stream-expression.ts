import { hasAsyncGenerator, pick } from '@ski/streams/streams.js'
import SkiStreamFunction from './ski-stream-function.js'

export default class SkiStreamExpression<T extends object> extends SkiStreamFunction<T> {
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
