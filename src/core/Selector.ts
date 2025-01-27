import { Entity } from './base/Entity';
import { Atom } from "./Atom";
import { Track } from './Track';

export type SelectorCallback = (ctx: SelectorContext) => any;
export type SelectorAsyncCallback = (...args: any) => Promise<any>;

export const STATEBUILD_RAW_FLAG = '__STATEBUILD_RAW__';

export class Selector<Fn extends SelectorCallback, ID extends string = string> extends Atom<ReturnType<Fn>> {
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

  static runRaw(selector: Selector<any>) {
    const isGenerator = Generator.isGeneratorFunction(selector.selectorFn);
    const value = selector.selectorFn(selector.context);
    if (isGenerator) {
      return Generator.execute(value);
    }

    return value;
  }

  static runWithTracking(selector: Selector<any>) {
    // When running the selector we also keep track of what has been read
    // This is how we can determine what data is a dependency
    const selectedValue = Track.attributeChanges(selector, () => {
      return Selector.runRaw(selector);
    })

    return selectedValue;
  }

  dispose() {
    Track.remove(this);
    Entity.dispose(this);
  }

  select(...args: unknown[]) {
    const calledWithArguments = args.length > 0;
    if (calledWithArguments) {
      throw new Error('Selector does not accept arguments');
    }

    const hasCachedValue = Track.isTracked(this)
    if (!hasCachedValue) {
      const selectedValue = Selector.runWithTracking(this)
      super.set(selectedValue);

      const isTracked = Track.isTracked(this)
      if (!isTracked) {
        // Selector doesn't have any dependencies
        // we'll add it to the registery to that the selector can concider 
        // that its value is in cache.
        // Note, the selector will never rerrun since it doesn't have dependencies
        // That may invalidate it.
        Track.add(this);
      }
    }

    // console.log('dependencies', Track.getDependencies(this), Track.getDependents(this));
    const value = super.get();
    return value;
  }

  set(value: unknown) {
    throw new Error('Selector is read only, cannot use .set() method');
  }

  get(...args) {
    return this.select(...args);
  }
}


export class SelectorContext {
  selector: Selector<any>;

  constructor(selector: Selector<any> = null) {
    this.selector = selector;
  }

  get = <A extends Atom<any>>(atom: A): A['value'] => {
    // const isTrackable = atom instanceof Selector;
    // if (!isTrackable) {
    //   return atom.get();
    // }

    return Track.attributeChanges(this.selector, () => {
      return atom.get();
    })
  }
}

export class Generator {
  static isGeneratorFunction(fn: any) {
    const GeneratorFunction = (function* () { yield undefined; }).constructor;
    const isGenerator = fn instanceof GeneratorFunction;
    return isGenerator;
  }

  static execute(generator: Generator, step?: Function) {
    // const generator = generatorFn(...args);
    const executeStep = step ? step : (callback: Function) => callback()

    return new Promise(function (resolve, reject) {
      const generatorStep = (key, arg) => {
        try {
          let info = null

          executeStep(() => {
            info = generator[key](arg)
          });

          if (info.done) {
            resolve(info.value)
          } else {
            Promise.resolve(info.value)
              .then(api.next, api.throw)
          }

        } catch (error) {
          reject(error)
          return
        }
      }

      const api = {
        next: (yielded) => generatorStep("next", yielded),
        throw: (err) => generatorStep("throw", err),
      };

      api.next(undefined)
    })
  }
}