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
  // @ts-expect-error
  static select<Fn extends SelectorCallback>(selectorFn: Fn): ReturnType<typeof Selector.makeCallableSelector<Selector<Fn>>>;
  static select(a, b) {
    if (typeof a === 'string') {
      const selector = new Selector(b);
      selector.selectorName = a;
      return Selector.makeCallableSelector(selector);
    }

    const selector = new Selector(a);
    return Selector.makeCallableSelector(selector);
  }

  static selectAsync<Fn extends SelectorCallback>(selectorFnFactory: (asyncCtx: AsyncSelectorContext) => Fn) {
    const asyncCtx = new AsyncSelectorContext();
    const selectorFn = selectorFnFactory(asyncCtx);
    const selector = State.select(selectorFn);

    asyncCtx.selector = selector;

    return selector;
  }

  static reaction(selectorFn: () => any) {
    return new Reaction(selectorFn);
  }
}

class AsyncSelectorContext {
  selector: Selector<any>;

  get = <A extends Atom<any>>(atom: A) : A['value'] => {
    const registration = Selector.autoRegisterSelectorDependencies(this.selector);
    const value = atom.get();
    registration.unregister();
    return value;
  }
}
