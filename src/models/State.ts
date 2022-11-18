import { Entity } from './Entity';
import type { Atom as AtomType } from './Atom';
import type { Selector as SelectorType} from './Selector';
import type { Reaction as ReactionType} from './Reaction';

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

  static reaction(selectorFn: () => any) {
    const exports = require('./Reaction');
    const Reaction = exports.Reaction as typeof ReactionType;
    return new Reaction(selectorFn);
  }
}