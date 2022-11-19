import { Entity } from './Entity';
import type { Atom as AtomType } from './Atom';
import type { Selector as SelectorType} from './Selector';
import type { Reaction as ReactionType} from './Reaction';

export class State extends Entity {
  static from<V>(value: V) {
    const Atom = require('./Atom').Atom as typeof AtomType;;
    const atom = new Atom(value);

    return Atom.makeCallable(atom, Atom);
  }

  static select<V>(selectorFn: () => V) : (() => V) & SelectorType<V> {
    const Selector = require('./Selector').Selector as typeof SelectorType;
    const Atom = require('./Atom').Atom as typeof AtomType;
    const selector = new Selector(selectorFn);
    return Atom.makeCallable(selector, Selector);
  }

  static reaction(selectorFn: () => any) {
    const exports = require('./Reaction');
    const Reaction = exports.Reaction as typeof ReactionType;
    return new Reaction(selectorFn);
  }
}