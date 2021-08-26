import { suite, test } from './lib/testdeck.esm.js'
import 'chai/register-should.js'
import { expect } from 'chai'
import { LiveExpression } from '../src/live-expression.js'

@suite
export class LiveExpressionTest {
  //
  @test async 'static value expression yields only once'() {
    let evaluator = new LiveExpression('value + 2')
    let evalStream = evaluator.run({ value: 3 })

    let result1 = await evalStream.next()
    expect(result1.value).to.be.equal(5)

    let result2 = await evalStream.next()
    expect(result2.done).to.be.true
  }

  @test async 'expression with value generator yields all values'() {
    async function* generator() {
      yield 1
      yield 2
      yield 3
    }

    let evaluator = new LiveExpression('2 * value')
    let evalStream = evaluator.run({ value: generator() })

    expect(await evalStream.next())
      .property('value')
      .to.be.equal(2)

    expect(await evalStream.next())
      .property('value')
      .to.be.equal(4)

    expect(await evalStream.next())
      .property('value')
      .to.be.equal(6)

    expect(await evalStream.next()).property('done').to.be.true
  }

  @test async 'multiple generators reevaluates the expression'() {
    /**
     *  time -> 0 1 2 3 4 5 6 7 8 9 (x10ms)
     *    v1 => 1         2   3
     *    v2 =>   a   b           c
     * result =   1a  1b  2b  3b  3c
     */

    async function* generator1() {
      yield new Promise(r => setTimeout(r, 0, 1))
      yield new Promise(r => setTimeout(r, 50, 2))
      yield new Promise(r => setTimeout(r, 70, 3))
    }

    async function* generator2() {
      yield new Promise(r => setTimeout(r, 10, 'a'))
      yield new Promise(r => setTimeout(r, 30, 'b'))
      yield new Promise(r => setTimeout(r, 90, 'c'))
    }

    let evaluator = new LiveExpression<string>('v1 + v2')
    let evalStream = evaluator.run({ v1: generator1(), v2: generator2() })
    let list: string[] = []

    for await (let v of evalStream) list.push(v)

    list.should.be.eql(['1a', '1b', '2b', '3b', '3c'])
  }

  @test async 'each change reevaluates the expression while first term takes precedence'() {
    /**
     *  time -> 0 1 2 3 4 5 6 7 8 9 (x10ms)
     *    v1 => 1     2     3
     *    v2 => a     b     c
     * result = 1a    2a 2b 3b 3c
     */

    async function* generator1() {
      yield new Promise(r => setTimeout(r, 0, 1))
      yield new Promise(r => setTimeout(r, 30, 2))
      yield new Promise(r => setTimeout(r, 60, 3))
    }

    async function* generator2() {
      yield new Promise(r => setTimeout(r, 0, 'a'))
      yield new Promise(r => setTimeout(r, 30, 'b'))
      yield new Promise(r => setTimeout(r, 60, 'c'))
    }

    let evaluator1 = new LiveExpression<string>('v1 + v2') // v1 changes takes precedence
    let evalStream1 = evaluator1.run({ v1: generator1(), v2: generator2() })
    let list1: string[] = []

    for await (let v of evalStream1) list1.push(v)
    list1.should.be.eql(['1a', '2a', '2b', '3b', '3c'])

    let evaluator2 = new LiveExpression<string>('v2 + v1') // v2 changes takes precedence
    let evalStream2 = evaluator2.run({ v1: generator1(), v2: generator2() })
    let list2: string[] = []

    for await (let v of evalStream2) list2.push(v)
    list2.should.be.eql(['a1', 'b1', 'b2', 'c2', 'c3'])
  }
}
