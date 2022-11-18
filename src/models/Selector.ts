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

  static createCallableSelector<V>(selectorFn: () => V) : CallableSelector<V> {
    const selector = new Selector(selectorFn);

    const callable = () => selector.get();
    Object.setPrototypeOf(callable, Selector.prototype);

    const coreSelector = Entity.getBaseObject(selector);
    Entity.originalObjectByProxy.set(callable, coreSelector);
    return Object.assign(callable, selector);
  }

  static subsribeToSelectorChanges(selector, callback) {
    const dependencyKey = Entity.getBaseObject(selector);
    const subscription = Selector.tree.events.subscribe(dependencyKey, (messsage) => {
      setTimeout(() => {
        const nextValue = selector.get();
        callback(nextValue);
      })
    })

    return subscription;
  }

  static autoRegisterSelectorDependencies(selector: Selector<unknown>) {
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

  private select() {
    const dependencyKey = Entity.getBaseObject(this);
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
