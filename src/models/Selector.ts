import { Atom } from "./Atom";
import { Entity } from './base/Entity';
import { DependencyTree } from '../utils/DependencyTree';
import { MultiWeakMap } from '../utils/MultiWeakMap';

export type SelectorCallback = (...args: any) => any;
export type SelectorAsyncCallback = (...args: any) => Promise<any>;

export class Selector<Fn extends SelectorCallback, ID extends string = string> extends Atom<ReturnType<Fn>> {
  static tree = new DependencyTree();
  static cache = new WeakMap<Selector<any>, MultiWeakMap<any, Selector<any>>>();
  static disposableRessources = new WeakMap<Selector<any>, {dispose: Function}[]>();

  selectorFn : Fn;
  id: ID;
  constructor(selectorFn: Fn) {
    super(null);

    const cache = new MultiWeakMap<any, Selector<Fn>>();
    Selector.cache.set(this, cache);
    cache.mset([], this);

    this.selectorFn = selectorFn;
  }

  static makeCallableSelector<A extends Selector<any>>(selector: A) : A['selectorFn'] & A {
    const callable = (...args) => selector.get(...args);

    Object.setPrototypeOf(callable, Selector.prototype);
    const callableAtom = Object.assign(callable, selector, {
      get: selector.get.bind(selector),
    });

    const coreAtom = Entity.getBaseObject(selector);
    Entity.originalObjectByProxy.set(callableAtom, coreAtom);
    return callableAtom;
  }

  static onUpstreamInvalidation(selector: Selector<any>, callback: () => void) {
    const dependencyKey = Entity.getBaseObject(selector);
    const subscription = Selector.tree.invalidations.subscribe(dependencyKey, callback)

    return subscription;
  }

  static disposeRelatedRessources(selector: Selector<any>) {
    const core = Entity.getBaseObject(selector);
    const disposableRessources = Selector.disposableRessources.get(core);
    if (disposableRessources) {
      disposableRessources.forEach((ressource) => ressource.dispose());
    }

    Selector.disposableRessources.delete(core)
  }

  static getOrCreateDisposableRessources(selector: Selector<any>) {
    const core = Entity.getBaseObject(selector);

    const disposableRessources = Selector.disposableRessources.get(core);
    if (disposableRessources) {
      return disposableRessources;
    }

    const ressources = [];
    Selector.disposableRessources.set(core, ressources);
    return ressources;
  }

  static autoRegisterSelectorDependencies(selector: Selector<any>) {
    const core = Entity.getBaseObject(selector);
    const random = Math.random();

    Selector.disposeRelatedRessources(selector);
    const ressources = Selector.getOrCreateDisposableRessources(selector);

    const registration = Entity.regsiterGlobalListener(core, (parent, prop) => {
      const isSelector = parent === selector;
      if (isSelector) return;
      // Ensure that get notify when one a dependency is updated
      // In that case we'll need to invalidate this and downstream selectors

      let previousValue = parent[prop];
      const propSub = Entity.subscribe(parent, (updatedProp) => {
        const isTrackedProp = updatedProp === prop;
        if (!isTrackedProp) return;

        const nextValue = parent[updatedProp];
        const hasChanged = previousValue !== nextValue;
        if (hasChanged) {
          core.invalidate(hasChanged);
          previousValue = nextValue;
        }
      });

      ressources.push({ dispose: () => propSub.unsubscribe() });
      core.addDependency(parent);
    })

    return {
      unregister: () => {
        registration.unregister();
      }
    };
  }

  addDependency(dependency: object) {
    const dependencyKey = Entity.getBaseObject(this);
    const dependentKey = Entity.getBaseObject(dependency);
    return Selector.tree.register(dependencyKey, dependentKey);
  }

  private invalidate(force?: boolean) {
    const dependencyKey = Entity.getBaseObject(this);
    return Selector.tree.invalidate(dependencyKey, force);
  }

  clear() {
    const cache = Selector.cache.get(this);
    cache.clear();
  }

  static runSelectorFn(selector: Selector<any>, args: any[]) {
    // When running the selector we also keep track of what has been read
    // This is how we can determine what data is a dependency
    const registration = Selector.autoRegisterSelectorDependencies(selector)

    const selectedValue = selector.selectorFn(...args);
    registration.unregister();

    return selectedValue;
  }

  dispose() {
    return Selector.disposeRelatedRessources(this);
  }

  select(...args: unknown[]) {
    const dependencyKey = Entity.getBaseObject(this);
    const hasCachedValue = Selector.tree.verify(dependencyKey);
    if (!hasCachedValue) {
      const selectedValue = Selector.runSelectorFn(this, args)
      super.set(selectedValue);
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

    const clonedSelector = Object.create(this, Object.getOwnPropertyDescriptors(this));
    cache.mset(args, clonedSelector);
    return clonedSelector;
  }

  get = (...args) => {
    const cache = this.getSelectorForArgs(...args);
    return cache.select(...args);
  }
}
