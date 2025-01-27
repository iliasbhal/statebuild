import { AsyncContext } from "simple-async-context";
import { Polyfill } from "simple-async-context/build/polyfill/Polyfill";
import { DependencyTree } from "../utils/DependencyTree";
import { Entity } from "./base/Entity";

Polyfill.ensureEnabled();



// type AA = Class

type Store = typeof Map | typeof WeakMap | typeof Set | typeof WeakSet;

class MapSet<K, V> extends Map<K, Set<V>> {


  add(key: K, item: V) {
    const set = this.get(key);
    if (!set) {
      const nextSet = new Set<V>();
      this.set(key, nextSet);
      return nextSet.add(item);
    }

    return set.add(item);
  }

  delete(key: K) {
    const set = this.get(key);
    set?.forEach((v) => set.delete(v));
    return super.delete(key)
  }
}

type TrackingContext = {
  visit(target: object, prop: string | symbol): void
}

export class Track {
  static Context = new AsyncContext.Variable<TrackingContext>();
  static tree = new DependencyTree();

  static subscribe(entity: Entity, callback: (...args: any[]) => void) {
    const dependencyKey = Entity.getBaseObject(entity);
    const subscription = Track.tree.invalidations.subscribe(dependencyKey, callback)
    return subscription;
  }

  static onActivityChanged(entity: Entity, handler: (isActive: boolean) => void) {
    const core = Entity.getBaseObject(entity);
    return Track.tree.activityChanged.subscribe(core, handler);
  }

  static add(entity: Entity) {
    const core = Entity.getBaseObject(entity);
    return Track.tree.add(core);
  }

  static register(origin: Entity, dependency: Entity) {
    const parent = Entity.getBaseObject(origin);
    const dependent = Entity.getBaseObject(dependency);

    return Track.tree.register(parent, dependent);
  }

  static remove(entity: Entity) {
    const core = Entity.getBaseObject(entity);

    Track.dispose(core);
    return Track.tree.remove(core);
  }

  static isTracked(entity: Entity) {
    const core = Entity.getBaseObject(entity);
    return Track.tree.has(core);
  }

  static hasDependencies(entity: Entity) {
    const core = Entity.getBaseObject(entity)
    return Track.getDependencies(core).size > 0;
  }

  static invalidate(entity: Entity, force: boolean = false) {
    const core = Entity.getBaseObject(entity);

    return Track.tree.invalidate(core, force);
  }

  static getDependencies(entity: Entity) {
    const core = Entity.getBaseObject(entity);
    return Track.tree.getDependencies(core);
  }

  static getDependents(entity: Entity) {
    const core = Entity.getBaseObject(entity);
    return Track.tree.getDependents(core);
  }

  static attributeChanges(entity: Entity, callback: (...args) => any) {
    const core = Entity.getBaseObject(entity);
    const utils = Track.createSelectorVisitor(core);
    return Track.Context.run(utils, callback)
  }

  static visit(base, prop) {
    const trackingContext = Track.Context.get();
    // console.log('trackingContext', trackingContext)
    trackingContext?.visit(base, prop);
  }

  static ressourcesByEntity = new MapSet<Entity, { dispose: Function }>();
  static dispose(entity: Entity) {
    const core = Entity.getBaseObject(entity);
    Track.ressourcesByEntity.get(core)
      ?.forEach((ressource) => ressource.dispose());

    Track.ressourcesByEntity.delete(core)
  }

  private static createSelectorVisitor(entity: Entity) {
    const visit = (obj, prop) => {
      const isSelf = obj === entity;
      if (isSelf) return;
      // Ensure that get notify when one a dependency is updated
      // In that case we'll need to invalidate this and downstream selectors

      // console.log('obj', obj, prop);

      let previousValue = obj[prop];
      const propSub = Entity.subscribe(obj, (updatedProp) => {
        // console.log('obj', obj, updatedProp)
        const isTrackedProp = updatedProp === prop;
        if (!isTrackedProp) return;

        const nextValue = obj[updatedProp];
        const hasChanged = previousValue !== nextValue;
        if (hasChanged) {
          Track.invalidate(entity, true);
          previousValue = nextValue;
        }
      });

      // console.log('register', entity, obj)
      Track.register(entity, obj);
      Track.ressourcesByEntity.add(entity, {
        dispose: () => {
          propSub.unsubscribe()
        }
      });
    }

    return {
      entity,
      visit,
    }
  }
}
