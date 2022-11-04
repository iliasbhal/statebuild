import { Entity } from "./Entity";

export class Atom<T> extends Entity {
  protected value: T;

  constructor(value: T) {
    super();

    this.value = value;
  }

  static from<V>(value: V) {
    const atom = new Atom(value);
    return atom;
  }

  static select<V>(selector: (use: <B>(entity: Atom<B>) => B) => V) : AtomSelector<V> {
    const atom = new AtomSelector(selector);
    return atom;
  }

  get() {
    return this.value;
  }

  set(value: T) {
    this.value = value;
  }
}

class DependencyTree {
  cache = new WeakSet<object>();
  dependents = new WeakMap<object, Set<object>>();

  register(key: any, dependency: any) {
    this.cache.add(key.selector);

    if (!this.dependents.has(dependency)) {
      this.dependents.set(dependency, new Set());
    }

    this.dependents.get(dependency).add(key);
  }

  invalidate(key: any) {
    // remove all caches of selector that have key as dependncy;
    this.cache.delete(key.selector);

    const dependents = this.dependents.get(key);
    dependents?.forEach(dependent => {
      this.invalidate(dependent);
    });
  }

  verify(key: any) {
    return this.cache.has(key.selector);
  }
}

export class AtomSelector<T> extends Atom<T> {
  static tree = new DependencyTree();
  protected selector : (use: any) => T;
  constructor(selector: (use: any) => T) {
    super(null);
    this.selector = selector;
  }
  
  use = <A>(entity: Atom<A>) : A => {
    const proxy = Entity.handlePropRead(entity, (parent, prop) => {
      AtomSelector.tree.register(this, parent);

      // Ensure that get notify when one a dependency is updated
      // In that case we'll need to invalidate this and downstream selectors
      Entity.subscribe(parent, (updatedProp) => {
        if (updatedProp !== prop) return;
        AtomSelector.tree.invalidate(this);
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
    const hasCachedValue = AtomSelector.tree.verify(this);
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
