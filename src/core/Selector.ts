import { Atom } from "./Atom";
import { Track } from './Track';
import { Generator } from './utils/Generator'

export type SelectorCallback = (ctx: SelectorContext) => any;
export type SelectorAsyncCallback = (...args: any) => Promise<any>;
export type AnySelectorCallback = SelectorCallback | SelectorAsyncCallback;

export const STATEBUILD_RAW_FLAG = '__STATEBUILD_RAW__';

export class Selector<Fn extends SelectorCallback = SelectorCallback> extends Atom<ReturnType<Fn>> {
  callback: Fn;
  id: string;

  constructor(callback: Fn) {
    super(undefined);

    this.callback = callback;

    const subscription = Track.subscribe(this.atom, () => {
      this.invalidationCallbacks.forEach((callback) => {
        callback();
      })
    });

    Track.ressourcesByEntity.add(this.atom, {
      dispose: () => {
        subscription.unsubscribe();
      }
    });
  }

  private runSelectorCallback() {
    const isGenerator = Generator.isGeneratorFunction(this.callback);
    const context = new SelectorContext(this);

    let value = this.callback(context);
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

  private runWithTracking() {
    // When running the selector we also keep track of what has been read
    // This is how we can determine what data is a dependency

    // console.log('run with Tracking') 
    Track.remove(this.atom);
    const selectedValue = Track.attributeChanges(this.atom, () => {
      return this.runSelectorCallback();
    })

    return selectedValue;
  }

  dispose() {
    Track.remove(this.atom);
    super.dispose();
  }

  invalidationCallbacks: Set<Function> = new Set<Function>();
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

    const hasCachedValue = Track.isTracked(this.atom)
    if (!hasCachedValue) {
      const selectedValue = this.runWithTracking()
      super.set(selectedValue);

      const isTracked = Track.isTracked(this.atom)
      if (!isTracked) {
        // Selector doesn't have any dependencies
        // we'll add it to the registery to that the selector can concider 
        // that its value is in cache.
        // Note, the selector will never rerrun since it doesn't have dependencies
        // That may invalidate it.
        Track.add(this.atom);
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

  get = <A extends Atom<any>>(atom: A): A['atom']['value'] => {
    return Track.attributeChanges(this.selector.atom, () => {
      return atom.get();
    })
  }
}
