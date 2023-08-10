import { EventBus } from "./EventBus";

export class DependencyTree {
  cache = new Set<object>();
  dependentKeysByKey = new Map<object, Set<object>>();
  invalidations = new EventBus<object>(); 

  register(key: any, dependent: any) {
    const isDifferent = dependent !== key; 
    if (!isDifferent) {
      // Cannot be dependent on themselves
      return;
    }

    this.cache.add(key);

    if (!this.dependentKeysByKey.has(dependent)) {
      this.dependentKeysByKey.set(dependent, new Set());
    }

    this.dependentKeysByKey.get(dependent).add(key);
  }

  invalidate(key: any) {
    // remove all caches of selector that have key as dependncy;
    this.cache.delete(key);
    this.invalidations.publish(key);

    this.dependentKeysByKey.get(key)?.forEach(dependentKey => {
      this.invalidate(dependentKey);
    });
  }

  verify(key: any) {
    return this.cache.has(key);
  }
}