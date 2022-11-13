import { Atom } from "./Atom";
import { Entity } from './Entity';
import { DependencyTree } from './lib/DependencyTree';

export class Selector<T> extends Atom<T> {
  static tree = new DependencyTree();
  protected selector : () => T;
  constructor(selector: () => T) {
    super(null);
    this.selector = selector;
  }


  static selectorInstanceByCallable = new WeakMap<any, Selector<unknown>>
  static createCallableSelector<V>(selector: Selector<V>) {
    const callable = () => selector.get();
    Object.setPrototypeOf(callable, Selector.prototype);
    callable.get = () => selector.get();

    Selector.selectorInstanceByCallable.set(callable, selector);
    return callable ;
  }

  private select() {
    const hasCachedValue = Selector.tree.verify(this);
    if (!hasCachedValue) {
      const registration = Entity.regsiterGlobalListener(this, (parent, prop) => {
        Selector.tree.register(this, parent);

        // Ensure that get notify when one a dependency is updated
        // In that case we'll need to invalidate this and downstream selectors
        Entity.changes.subscribe(parent, (updatedProp) => {
          if (updatedProp !== prop) return;
          Selector.tree.invalidate(this);
        });
      })

      const selected = this.selector();

      registration.unregister();
      super.set(selected);
    } 

    return super.get();
  }

  set(value: T) {
    throw new Error('Selector is read only, cannot use .set() method');
  }

  get() {
    return this.select();
  }
}
