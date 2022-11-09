import { Entity } from './Entity';
import type { Atom } from './Atom';
import type { Selector  } from './Selector';

export class State extends Entity {
  static from<V>(value: V) {
    const exports = require('./Atom');
    const AtomConstructor = exports.Atom as typeof Atom;
    const atom = new AtomConstructor(value);
    return atom;
  }

  static select<V>(
    selector: (
      use: Selector<unknown>['use']
    ) => V
  ) : Selector<V> {
    const exports = require('./Selector');

    const SelectorConstructor = exports.Selector as typeof Selector;
    const atom = new SelectorConstructor(selector);
    return atom;
  }
}