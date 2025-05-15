import { Entity } from './base/Entity';

type SyncPromiseData<T> = {
  isLoading: boolean,
  value: Awaited<T> | undefined,
  error: Error | undefined,
};

class AtomWaiting<T> extends Error {
  promise: Promise<T>

  constructor(promise: Promise<T>) {
    super("Waiting!");
    this.promise = promise;
  }
}

export class Atom<T> {
  static Waiting = AtomWaiting;
  static Ref = new WeakMap<any, Atom<any>>();

  atom: {
    value: T,
    syncValue: SyncPromiseData<T>
  };

  constructor(value: T) {
    this.atom = Entity.wrap({
      value,
      syncValue: this.toSyncValue(value),
    });

    this.trackSyncValue(value);
    Atom.Ref.set(Entity.getBaseObject(this.atom), this);
  }

  get() {
    return this.atom.value
  }

  set(value: T) {
    this.atom.value = value;
    this.atom.syncValue = this.toSyncValue(value);
    this.trackSyncValue(value);
  }

  getAsync() {
    return this.atom.syncValue
  }

  getSync(): Awaited<T> {
    if (this.atom.syncValue.isLoading) {

      // Ensure we don't track when the promise changes, but only 
      // when its not loading anymore. that why we use the "currentPromise" 
      // located outside of the wrapped atom.
      throw new Atom.Waiting(this.currentPromise as Promise<T>);
    }

    return this.atom.syncValue?.value;
  }

  private currentPromise: Promise<T> | T = null
  private trackSyncValue(promise: Promise<T> | T) {
    const isPromise = promise instanceof Promise
    this.currentPromise = promise;

    if (isPromise) {
      const updateSyncData = (data, error) => {
        console.log('updateSyncData', data, error)
        const hasChanged = this.currentPromise !== promise;
        if (hasChanged) return;

        this.atom.syncValue = {
          value: data || undefined,
          error: error || undefined,
          isLoading: false,
        };

        // this.atom.syncValue = Object.assign({}, this.atom.syncValue, {
        //   value: data || undefined,
        //   error: error || undefined,
        //   isLoading: false,
        // });
      }

      promise.then((data) => updateSyncData(data, null))
        .catch((error) => updateSyncData(null, error));
    }
  }

  private toSyncValue(promise: Promise<T> | T): SyncPromiseData<T> {
    const isPromise = promise instanceof Promise

    if (isPromise) {
      return {
        isLoading: true,
        value: undefined,
        error: undefined,
      }
    }

    return {
      isLoading: false,
      value: promise as Awaited<T>,
      error: undefined,
    }
  }

  dispose() {
    Entity.dispose(this.atom);
  }
}
