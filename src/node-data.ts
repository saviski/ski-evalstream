import { spy } from '@ski/spy/spy.js'
import { stream } from '@ski/streams/streams.js'

const datamap = new WeakMap<Node, object>()

export const $nodedata = Symbol('nodedata')

export function nodedata<T extends object>(node: Node): Readonly<T> {
  let data = datamap.get(node)
  if (!data) {
    let parentData =
      node instanceof ShadowRoot
        ? streamValues(node.host)
        : node instanceof Attr && node.ownerElement
        ? nodedata(node.ownerElement)
        : node.parentNode
        ? nodedata(node.parentNode)
        : Object.prototype

    datamap.set(node, (data = Object.create(parentData)))
  }
  return <T>data
}

function streamValues(object: any) {
  return spy(object, changes => stream(changes).pick('value'))
}
