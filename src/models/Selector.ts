import { Atom } from "./Atom";
import { Entity } from './base/Entity';
import { DependencyTree } from '../utils/DependencyTree';
import { MultiWeakMap } from '../utils/MultiWeakMap';

export type SelectorCallback = (...args: any) => any;
export type SelectorAsyncCallback = (...args: any) => Promise<any>;

export class Selector<Fn extends SelectorCallback, Name extends string = string> extends Atom<ReturnType<Fn>> {
  static tree = new DependencyTree();
  static cache = new WeakMap<Selector<any>, MultiWeakMap<any, Selector<any>>>();

  selectorFn : Fn;
  selectorName: Name;
  constructor(selector: Fn) {
    super(null);

    const cache = new MultiWeakMap<any, Selector<Fn>>();
    Selector.cache.set(this, cache);
    cache.mset([], this);

    this.selectorFn = selector;
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

  // static autoRegisterAsyncSelectorDependencies<P extends Promise<any>, T extends Selector<(...args : any[]) => P>>(selector:  T, promise: P) {
  //   const registration = Selector.autoRegisterSelectorDependencies(selector);
    
  //   TrackedPromise.open(selector);
  //   return promise.finally(() => {
  //     TrackedPromise.close(selector);
  //     registration.unregister();
  //   });
  // }

  addDependency(dependency: object) {
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

  static runSelectorFn(selector: Selector<any>, args: any[]) {
    // When running the selector we also keep track of what has been read
    // This is how we can determine what data is a dependency
    const registration = Selector.autoRegisterSelectorDependencies(selector)

    const selectedValue = selector.selectorFn(...args);
    registration.unregister();

    // const isPromise = selectedValue instanceof Promise;
    // if(isPromise) {
    //   Selector.autoRegisterAsyncSelectorDependencies(selector, selectedValue);
    // }

    return selectedValue;
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

    const next = new Selector(this.selectorFn);
    cache.mset(args, next);
    return next;
  }

  get = (...args) => {
    const cache = this.getSelectorForArgs(...args);
    return cache.select(...args);
  }
}

// Zone 1 |--------*--------*-------*----------|
// Zone 2                |------*---------*---------------*---|
// Zone 2      *      *                *              *         

class TrackedPromise extends Promise<any> {
  static zones = new Set<Selector<any>>();

  static open(selector: Selector<any>) {
    this.zones.add(selector);

    console.log("ADDED", this.zones);
  }

  static close(selector: Selector<any>) {
    this.zones.delete(selector);

    console.log("DELETED",this.zones);
  }

  static get [Symbol.species]() {
    return Promise;
  }

  constructor(executor) {
    // console.log('NEW PROMISE', executor.toString());
    // try {
    //   throw new Error('FIND STASKTRACE');
    // } catch (err) {
    //   console.log('ERR', err);
    // }

    super(executor);
  }
}