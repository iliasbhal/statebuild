import { Entity } from './base/Entity';

type SyncPromiseData<T> = {
  promise: Promise<T>
  isLoading: boolean,
  value: Awaited<T>,
  error: Error,
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

  atom: {
    value: T,
    syncValue?: SyncPromiseData<T>
  };

  constructor(value: T) {
    this.atom = Entity.wrap({
      value,
      syncValue: this.toSyncValue(value)
    });

    this.trackSyncValue(value);
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
        const hasChanged = this.currentPromise !== promise;
        if (hasChanged) return;

        Object.assign(this.atom.syncValue, {
          value: data || null,
          error: error || null,
          isLoading: false,
        });
      }

      promise.then((data) => updateSyncData(data, null))
        .catch((error) => updateSyncData(null, error));
    }
  }

  private toSyncValue(promise: Promise<T> | T) {
    const isPromise = promise instanceof Promise

    if (isPromise) {
      return {
        promise: promise,
        isLoading: true,
        value: null,
        error: null,
      }
    }

    return {
      promise: null,
      isLoading: false,
      value: promise as Awaited<T>,
      error: null,
    }
  }

  dispose() {
    Entity.dispose(this.atom);
  }
}
