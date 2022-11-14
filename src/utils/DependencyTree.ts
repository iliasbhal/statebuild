import { Entity } from "../models/Entity";
import { EventBus } from "./EventBus";

export class DependencyTree {
  cache = new Set<object>();
  dependentKeysByKey = new Map<object, Set<object>>();
  events = new EventBus(); 

  register(key: any, dependent: any) {
    this.cache.add(key);

    if (!this.dependentKeysByKey.has(dependent)) {
      this.dependentKeysByKey.set(dependent, new Set());
    }

    this.dependentKeysByKey.get(dependent).add(key);
  }

  invalidate(key: any) {
    // remove all caches of selector that have key as dependncy;
    this.cache.delete(key);
    this.events.publish(key, 'delete');

    const orignalKey = Entity.getBaseObject(key);
    this.dependentKeysByKey.get(orignalKey)?.forEach(dependentKey => {
      this.invalidate(dependentKey);
    });
  }

  verify(key: any) {
    return this.cache.has(key);
  }
}