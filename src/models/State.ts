import { Entity } from './Entity';
import type { Atom as AtomType } from './Atom';
import type { Selector as SelectorType} from './Selector';

export class State extends Entity {
  static from<V>(value: V) {
    const exports = require('./Atom');
    const Atom = exports.Atom as typeof AtomType;
    const atom = new Atom(value);
    return atom;
  }

  static select<V>(selectorFn: () => V) {
    const exports = require('./Selector');
    const Selector = exports.Selector as typeof SelectorType;
    return Selector.createCallableSelector(selectorFn);
  }
}