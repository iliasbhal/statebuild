import { Atom } from "./Atom";
import { Entity } from './base/Entity';
import { DependencyTree } from '../utils/DependencyTree';

export type SelectorCallback = (ctx: SelectorContext) => any;
export type SelectorAsyncCallback = (...args: any) => Promise<any>;

export const STATEBUILD_RAW_FLAG = '__STATEBUILD_RAW__';

export class Selector<Fn extends SelectorCallback, ID extends string = string> extends Atom<ReturnType<Fn>> {
  static tree = new DependencyTree();
  static disposableRessources = new WeakMap<Selector<any>, { dispose: Function }[]>();

  selectorFn: Fn;
  context = new SelectorContext(this);
  id: ID;
  constructor(selectorFn: Fn) {
    super(null);
    this.selectorFn = selectorFn;
  }

  static makeCallableSelector<A extends Selector<any>>(selector: A): A['selectorFn'] & A {
    const callable = () => selector.get();

    Object.setPrototypeOf(callable, Selector.prototype);
    const callableAtom = Object.assign(callable, selector, {
      get: selector.get.bind(selector),
      [STATEBUILD_RAW_FLAG]: selector,
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
          core.invalidate(true);
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

  static getDependencies(selector: Selector<any>) {
    const core = Entity.getBaseObject(selector);
    return Selector.tree.getDependencies(core);
  }

  static onActivityChanged(selector: Selector<any>, handler: (isActive: boolean) => void) {
    const core = Entity.getBaseObject(selector);
    return Selector.tree.activityChanged.subscribe(core, handler);
  }

  addDependency(dependency: object) {
    const dependent = Entity.getBaseObject(dependency);
    const parent = Entity.getBaseObject(this);
    return Selector.tree.register(parent, dependent);
  }

  private invalidate(force: boolean = false) {
    const origin = Entity.getBaseObject(this);
    return Selector.tree.invalidate(origin, force);
  }

  static runSelectorFn(selector: Selector<any>) {
    // When running the selector we also keep track of what has been read
    // This is how we can determine what data is a dependency
    const registration = Selector.autoRegisterSelectorDependencies(selector)
    const selectedValue = selector.selectorFn(selector.context);
    registration.unregister();

    return selectedValue;
  }

  dispose() {
    const base = Entity.getBaseObject(this);
    Selector.disposeRelatedRessources(this);
    Selector.tree.remove(base);
    Entity.dispose(this);
  }

  select(...args: unknown[]) {
    const calledWithArguments = args.length > 0;
    if (calledWithArguments) {
      throw new Error('Selector does not accept arguments');
    }

    const core = Entity.getBaseObject(this);
    const hasCachedValue = Selector.tree.has(core);
    if (!hasCachedValue) {
      const selectedValue = Selector.runSelectorFn(this)
      super.set(selectedValue);
    }

    return super.get();
  }

  set(value: unknown) {
    throw new Error('Selector is read only, cannot use .set() method');
  }

  get(...args) {
    return this.select(...args);
  }
}


class SelectorContext {
  selector: Selector<any>;

  constructor(selector: Selector<any> = null) {
    this.selector = selector;
  }

  get = <A extends Atom<any>>(atom: A): A['value'] => {
    const isTrackable = atom instanceof Selector;
    if (!isTrackable) {
      return atom;
    }

    const registration = Selector.autoRegisterSelectorDependencies(this.selector);
    const value = atom.get();
    registration.unregister();
    return value;
  }
}
