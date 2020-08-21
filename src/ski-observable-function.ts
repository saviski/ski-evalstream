import SkiProxyFunction from './ski-proxy-function.js'
import {
  HasAsyngIterator,
  UNINITIALIZED,
  hasAsyncGenerator,
  mostRecent,
  forEach,
  next,
} from '@ski/streams'

export default class SkiObservableFunction<T extends object> extends SkiProxyFunction<T> {
  private dependencies = new Set<HasAsyngIterator<any>>()

  protected async *execute(...args) {
    try {
      const result = super.execute(...args)
      this.await()
      yield* result
    } catch (error) {
      if (error !== UNINITIALIZED) throw error
    }
  }

  await() {
    const changes = Array.from(this.dependencies).map(source => next(source))
    // this.dependencies.clear()
    Promise.race(changes).then(() => this.changed())
  }

  getValue(target: any, property, _receiver: any) {
    let value = target[property] // Reflect.get(target, property, receiver)

    if (hasAsyncGenerator(value)) {
      this.watch(value)
      value = mostRecent(value)
    }

    return value
  }

  watch(source: HasAsyngIterator<unknown>) {
    if (!this.dependencies.has(source)) {
      this.dependencies.add(source)
      forEach(source, () => this.changed())
    }
  }
}
