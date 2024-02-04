import { Entity } from './base/Entity';
import { Atom  } from './Atom';
import { Selector, SelectorCallback } from './Selector';
import { Reaction } from './Reaction';

export class State extends Entity {
  static from<V>(value: V) {
    const atom = new Atom(value);
    return Atom.makeCallableAtom(atom);
  }

  static select<Fn extends SelectorCallback>(name: string, selectorFn: Fn): ReturnType<typeof Selector.makeCallableSelector<Selector<Fn>>>;
  static select<Fn extends SelectorCallback>(selectorFn: Fn, b?: never): ReturnType<typeof Selector.makeCallableSelector<Selector<Fn>>>;
  static select(a, b) {
    if (typeof a === 'string') {
      const selector = new Selector(b);
      selector.selectorName = a;
      return Selector.makeCallableSelector(selector);
    }

    const selector = new Selector(a);
    return Selector.makeCallableSelector(selector);
  }

  static reaction<Fn extends SelectorCallback>(name: string, reactionCallback: () => void): Reaction;
  static reaction<Fn extends SelectorCallback>(reactionCallback: () => void, b?: never): Reaction;
  static reaction(a, b) {
    if (typeof a === 'string') {
      const selector = new Reaction(b);
      selector.selectorName = a;
      return selector;
    }

    const selector = new Reaction(a);

    return selector;
  }
}
