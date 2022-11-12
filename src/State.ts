import { Entity } from './Entity';
import type { Atom } from './Atom';
import type { Selector } from './Selector';

export class State extends Entity {
  static from<V>(value: V) {
    const exports = require('./Atom');
    const AtomConstructor = exports.Atom as typeof Atom;
    const atom = new AtomConstructor(value);
    return atom;
  }

  static select<V>(selectorFn: () => V) : Selector<V> {
    const exports = require('./Selector');
    const SelectorConstructor = exports.Selector as typeof Selector;
    const selector = new SelectorConstructor(selectorFn);
    return selector;
  }
}