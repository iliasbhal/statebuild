import { Entity } from './base/Entity';
import { Atom } from "./Atom";
import { Track } from './Track';
import { Generator } from './utils/Generator'

export type SelectorCallback = (ctx: SelectorContext) => any;
export type SelectorAsyncCallback = (...args: any) => Promise<any>;
export type AnySelectorCallback = SelectorCallback | SelectorAsyncCallback;

export const STATEBUILD_RAW_FLAG = '__STATEBUILD_RAW__';

export class Selector<Fn extends SelectorCallback = SelectorCallback> extends Atom<ReturnType<Fn>> {
  selectorFn: Fn;

  id: string;
  constructor(selectorFn: Fn) {
    super(null);
    this.selectorFn = selectorFn;


    const subscription = Track.subscribe(this, () => {
      this.executeOnInvalidate();
    });

    Track.ressourcesByEntity.add(this, {
      dispose: () => {
        subscription.unsubscribe();
        this.invalidationCallbacks = new Set<Function>();
      }
    });
  }

  static runRaw(selector: Selector<any>) {
    const isGenerator = Generator.isGeneratorFunction(selector.selectorFn);
    const context = new SelectorContext(selector);

    let value = selector.selectorFn(context);
    if (isGenerator) {
      value = Generator.execute(value);
    }

    if (value instanceof Promise) {
      value.then(() => context.dispose());
    } else {
      context.dispose();
    }

    return value;
  }

  static runWithTracking(selector: Selector<any>) {
    // When running the selector we also keep track of what has been read
    // This is how we can determine what data is a dependency

    // console.log('run with Tracking') 
    Track.remove(selector);
    const selectedValue = Track.attributeChanges(selector, () => {
      return Selector.runRaw(selector);
    })

    return selectedValue;
  }

  dispose() {
    Track.remove(this);
    Entity.dispose(this);
  }

  invalidationCallbacks: Set<Function> = new Set<Function>();
  private executeOnInvalidate = () => {
    this.invalidationCallbacks.forEach((callback) => {
      callback();
    })
  }

  onInvalidate(callback: Function) {
    this.invalidationCallbacks.add(callback);

    return {
      unsubscribe: () => {
        this.invalidationCallbacks.delete(callback);
      }
    }
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
  abortController = new AbortController();

  onInvalidateSub: ReturnType<typeof this.selector.onInvalidate>
  constructor(selector: Selector<any> = null) {
    this.selector = selector;

    this.onInvalidateSub = this.selector.onInvalidate(() => {
      this.abortController.abort();
    });
  }

  get aborted() {
    return this.abortController.signal.aborted;
  }

  dispose() {
    this.onInvalidateSub?.unsubscribe();
  }

  get = <A extends Atom<any>>(atom: A): A['value'] => {
    return Track.attributeChanges(this.selector, () => {
      return atom.get();
    })
  }
}
