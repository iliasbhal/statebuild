import { Atom } from "./Atom";
import { Entity } from './Entity';
import { DependencyTree } from '../utils/DependencyTree';
import { MultiWeakMap } from '../utils/MultiWeakMap';

export type SelectorCallback = (...args: any) => any;
export class Selector<Fn extends SelectorCallback> extends Atom<ReturnType<Fn>> {
  static tree = new DependencyTree();
  static cache = new WeakMap<Selector<any>, MultiWeakMap<any, Selector<any>>>();

  selector : Fn;
  constructor(selector: Fn) {
    super(null);

    const cache = new MultiWeakMap<any, Selector<Fn>>();
    Selector.cache.set(this, cache);
    cache.mset([], this);

    this.selector = selector;
  }

  static makeCallableSelector<A extends Selector<any>>(selector: A) : A['selector'] & A {
    const callable = (...args) => selector.get(...args);

    Object.setPrototypeOf(callable, Selector.prototype);
    const callableAtom = Object.assign(callable, selector, {
      get: selector.get.bind(selector),
    });

    const coreAtom = Entity.getBaseObject(selector);
    Entity.originalObjectByProxy.set(callableAtom, coreAtom);
    return callableAtom;
  }

  static subsribeToSelectorChanges(selector: Selector<any>, callback: () => void) {
    const dependencyKey = Entity.getBaseObject(selector);
    const subscription = Selector.tree.invalidations.subscribe(dependencyKey, () => callback())

    return subscription;
  }

  static autoRegisterSelectorDependencies(selector: Selector<any>) {
    const dependencyKey = Entity.getBaseObject(selector);
    const registration = Entity.regsiterGlobalListener(dependencyKey, (parent, prop) => {
      selector.addDependency(parent);

      // Ensure that get notify when one a dependency is updated
      // In that case we'll need to invalidate this and downstream selectors
      Entity.subscribe(parent, (updatedProp) => {
        if (updatedProp !== prop) return;
        selector.invalidate();
      });
    })

    return registration;
  }

  private addDependency(dependency: object) {
    const dependencyKey = Entity.getBaseObject(this);
    const dependentKey = Entity.getBaseObject(dependency);
    return Selector.tree.register(dependencyKey, dependentKey);
  }

  private invalidate() {
    const dependencyKey = Entity.getBaseObject(this);
    return Selector.tree.invalidate(dependencyKey);
  }

  clear() {
    const cache = Selector.cache.get(this);
    cache.clear();
  }

  select(...args: unknown[]) {
    const dependencyKey = Entity.getBaseObject(this);
    const hasCachedValue = Selector.tree.verify(dependencyKey);
    if (!hasCachedValue) {
      const registration = Selector.autoRegisterSelectorDependencies(this)
      const selected = this.selector(...args);
      registration.unregister();
      super.set(selected);
    } 

    return super.get();
  }

  set = (value: unknown) => {
    throw new Error('Selector is read only, cannot use .set() method');
  }

  getSelectorForArgs(...args) : Selector<Fn> {
    const cache = Selector.cache.get(this);
    const cachedSelector = cache.mhas(...args);
    if (cachedSelector) {
      return cache.mget(...args)
    }

    const next = new Selector(this.selector);
    cache.mset(args, next);
    return next;
  }

  get = (...args) => {
    const cache = this.getSelectorForArgs(...args);
    return cache.select(...args);
  }
}
