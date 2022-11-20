import { Atom } from "./Atom";
import { Entity } from './Entity';
import { DependencyTree } from '../utils/DependencyTree';

export class Selector<T> extends Atom<T> {
  static tree = new DependencyTree();

  protected selector : () => T;
  constructor(selector: () => T) {
    super(null);
    this.selector = selector;
  }

  static subsribeToSelectorChanges<T>(selector: Selector<T>, callback: () => void) {
    const dependencyKey = Entity.getBaseObject(selector);
    const subscription = Selector.tree.invalidations.subscribe(dependencyKey, () => callback())

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
