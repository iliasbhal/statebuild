import { Entity } from './Entity';
import { Atom  } from './Atom';
import { Selector, SelectorCallback } from './Selector';
import { Reaction } from './Reaction';

export class State extends Entity {
  static from<V>(value: V) {
    const atom = new Atom(value);
    return Atom.makeCallableAtom(atom);
  }

  
  static select<Fn extends SelectorCallback>(selectorFn: Fn) {
    const selector = new Selector(selectorFn);
    return Selector.makeCallableSelector(selector);
  }

  static reaction(selectorFn: () => any) {
    return new Reaction(selectorFn);
  }
}