import { Entity } from './Entity';
import { Atom  } from './Atom';
import { Selector } from './Selector';
import { Reaction } from './Reaction';

export class State extends Entity {
  static from<V>(value: V) {
    const atom = new Atom(value);
    return Atom.makeCallable(atom, Atom);
  }

  static select<V>(selectorFn: () => V) {
    const selector = new Selector(selectorFn);
    return Atom.makeCallable(selector, Selector);
  }

  static reaction(selectorFn: () => any) {
    return new Reaction(selectorFn);
  }
}