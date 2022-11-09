import { EventBus } from "./EventBus";

export class DependencyTree {
  cache = new WeakSet<object>();
  dependents = new WeakMap<object, Set<object>>();
  events = new EventBus(); 

  register(key: any, dependency: any) {
    this.cache.add(key.selector);

    if (!this.dependents.has(dependency)) {
      this.dependents.set(dependency, new Set());
    }

    this.dependents.get(dependency).add(key);
  }

  invalidate(key: any) {
    // remove all caches of selector that have key as dependncy;
    this.cache.delete(key.selector);
    this.events.publish(key, 'delete');

    const dependents = this.dependents.get(key);
    dependents?.forEach(dependent => {
      this.invalidate(dependent);
    });
  }

  verify(key: any) {
    return this.cache.has(key.selector);
  }
}