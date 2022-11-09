import { Atom } from "./Atom";
import { Entity } from './Entity';
import { DependencyTree } from './lib/DependencyTree';


type Use = (<B>(entity: Atom<B>) => B) & (<A extends Entity>(entity: A) => A);

export class Selector<T> extends Atom<T> {
  static tree = new DependencyTree();
  protected selector : (use: any) => T;
  constructor(selector: (use: any) => T) {
    super(null);
    this.selector = selector;
  }
  
  use : Use = (entity: Entity)  => {
    const proxy = Entity.handlePropRead(entity, (parent, prop) => {
      Selector.tree.register(this, parent);

      // Ensure that get notify when one a dependency is updated
      // In that case we'll need to invalidate this and downstream selectors
      Entity.subscribe(parent, (updatedProp) => {
        if (updatedProp !== prop) return;
        Selector.tree.invalidate(this);
      });
    });

    // We need to return the current atom value
    if (proxy instanceof Atom) {
      const value = proxy.get();
      return value;
    }

    return proxy;
  }

  select() {
    const hasCachedValue = Selector.tree.verify(this);
    if (!hasCachedValue) {
      const selected = this.selector(this.use);
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
