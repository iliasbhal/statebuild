import { Entity } from './base/Entity';
import { Atom } from './Atom';
import { Selector, SelectorCallback } from './Selector';
import { Reaction } from './Reaction';

export class State extends Entity {
  static from<V>(value: V) {
    const atom = new Atom(value);
    return Atom.makeCallableAtom(atom);
  }

  static select<Fn extends SelectorCallback>(id: string, selectorFn: Fn): ReturnType<typeof Selector.makeCallableSelector<Selector<Fn>>>;
  static select<Fn extends SelectorCallback>(selectorFn: Fn, b?: never): ReturnType<typeof Selector.makeCallableSelector<Selector<Fn>>>;
  static select(a, b) {
    if (typeof a === 'string') {
      const selector = new Selector(b);
      selector.id = a;
      return Selector.makeCallableSelector(selector);
    }

    const selector = new Selector(a);
    return Selector.makeCallableSelector(selector);
  }

  static reaction<Fn extends SelectorCallback>(id: string, reactionCallback: () => void): Reaction;
  static reaction<Fn extends SelectorCallback>(reactionCallback: () => void, b?: never): Reaction;
  static reaction(a, b) {
    if (typeof a === 'string') {
      const reaction = new Reaction(b);
      reaction.id = a;
      reaction.start();
      return reaction;
    }

    const reaction = new Reaction(a);
    reaction.start();
    return reaction;
  }

  static waitFor<Result, Error = any>(matchCallback: (resolve: (v: Result) => void, reject: (err: Error) => void) => Result): Promise<Result> {
    return new Promise((resolve, reject) => {
      const reaction = State.reaction(() => {
        const synthetic = {
          resolve: (value: Result) => {
            resolve(value);
            reaction.dispose();
          },
          reject: (error: Error) => {
            reject(error);
            reaction.dispose();
          },
        }

        matchCallback(
          synthetic.resolve,
          synthetic.reject
        );
      });
    });
  };
}
