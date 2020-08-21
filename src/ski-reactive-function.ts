import { hasAsyncGenerator, trigger, start } from '@ski/streams'

export default class SkiReactiveFunction<R = any> {
  private onchange = this.createOnChange()

  protected changed = () => {}

  constructor(private wrappedFunction: (...args) => any) {}

  public run(...args): AsyncGenerator<R> {
    return trigger(start(this.onchange, undefined), () => this.execute(...args))
  }

  protected async *execute(...args) {
    let result = this.wrappedFunction(...args)
    hasAsyncGenerator(result) ? yield* result : yield result
  }

  private async *createOnChange() {
    const changes = () =>
      new Promise<void>(resolve => {
        this.changed()
        this.changed = resolve
      })

    while (true) yield await changes()
  }
}
