import { Atom } from "./Atom";
import { Entity } from './Entity';
import { DependencyTree } from '../utils/DependencyTree';

type CallableSelector<V> = (() => V) & Selector<V>;

export class Selector<T> extends Atom<T> {
  static tree = new DependencyTree();

  protected selector : () => T;
  constructor(selector: () => T) {
    super(null);
    this.selector = selector;
  }

  static selectorInstanceByCallable = new WeakMap<any, Selector<unknown>>
  static createCallableSelector<V>(selectorFn: () => V) : CallableSelector<V> {
    const selector = new Selector(selectorFn);

    const callable = () => selector.get();
    Object.setPrototypeOf(callable, Selector.prototype);

    Selector.selectorInstanceByCallable.set(callable, selector);
    return Object.assign(callable, selector);
  }
  
  static getBaseSelector(selector: Selector<any>) : Selector<any> {
    const coreSelector = Selector.selectorInstanceByCallable.get(selector) || selector;
    return Entity.getBaseObject(coreSelector);
  }

  static subsribeToSelectorChanges(selector, callback) {
    const dependencyKey = Selector.getBaseSelector(selector);
    const subscription = Selector.tree.events.subscribe(dependencyKey, (messsage) => {
      setTimeout(() => {
        const nextValue = selector.get();
        callback(nextValue);
      })
    })

    return subscription;
  }

  static autoRegisterSelectorDependencies(selector) {
    const registration = Entity.regsiterGlobalListener(selector, (parent, prop) => {
      const dependencyKey = Entity.getBaseObject(selector);
      const dependentKey = Entity.getBaseObject(parent);
      Selector.tree.register(dependencyKey, dependentKey);

      // Ensure that get notify when one a dependency is updated
      // In that case we'll need to invalidate this and downstream selectors
      Entity.subscribe(parent, (updatedProp) => {
        if (updatedProp !== prop) return;
        Selector.tree.invalidate(dependencyKey);
      });
    })

    return registration;
  }

  private select() {
    const dependencyKey = Selector.getBaseSelector(this);
    const hasCachedValue = Selector.tree.verify(dependencyKey);
    if (!hasCachedValue) {
      const registration = Selector.autoRegisterSelectorDependencies(this)
      const selected = this.selector();
      registration.unregister();
      super.set(selected);
    } 

    return super.get();
  }

  set = (value: T) => {
    throw new Error('Selector is read only, cannot use .set() method');
  }

  get = () => {
    return this.select();
  }
}
