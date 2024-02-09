import { EventBus } from "./EventBus";

export class DependencyTree {
  cache = new Set<object>();
  dependentKeysByKey = new Map<object, Set<object>>();
  invalidations = new EventBus<object>(); 

  register(origin: any, dependent: any) {
    const isDifferent = dependent !== origin; 
    if (!isDifferent) {
      // Cannot be dependent on themselves
      return;
    }

    this.cache.add(origin);

    if (!this.dependentKeysByKey.has(dependent)) {
      this.dependentKeysByKey.set(dependent, new Set());
    }

    this.dependentKeysByKey.get(dependent).add(origin);
  }

  autoClearCache = new AutoClearCache();
  invalidate(origin: any, force: boolean = false) {
    if (!force && this.autoClearCache.has(origin)) {
      return;
    }

    this.autoClearCache.add(origin);

    // remove all caches of selector that have key as dependncy;
    this.cache.delete(origin);
    this.invalidations.publish(origin);

    this.dependentKeysByKey.get(origin)?.forEach(dependentKey => {
      this.invalidate(dependentKey);
    });
  }

  has(origin: any) {
    return this.cache.has(origin);
  }
}

class AutoClearCache {
  cache = new Set<any>();
  clearId: any = null;

  add(key: any) {
    this.cache.add(key)
    if (!this.clearId) {
      this.clearId = setTimeout(() => {
        this.cache.clear();
        this.clearId = null;
      })
    }
  }

  has(key: any) {
    return this.cache.has(key);
  }
}