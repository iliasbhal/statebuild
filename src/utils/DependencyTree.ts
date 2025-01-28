import { EventBus } from "./EventBus";

export interface Disposable {
  dispose?(): void;
}

export class DependencyTree {
  items = new Set<Disposable>();

  dependents = new WeakMap<Disposable, Set<Disposable>>();
  dependencies = new WeakMap<Disposable, Set<Disposable>>();

  invalidations = new EventBus<Disposable>();
  activityChanged = new EventBus<any>('activityChanged');

  add(origin: any) {
    this.items.add(origin);
  }

  register(origin: any, dependency: any) {
    const isDifferent = dependency !== origin;
    if (!isDifferent) {
      // Cannot be dependency on themselves
      return;
    }

    // console.log('register,', origin, dependency)
    // console.log('REGISTER', origin, dependency)
    this.items.add(origin);
    this.addDependency(origin, dependency);
    this.addDependent(origin, dependency);
  }

  // To know what is dependent on `dependency`
  // This will be used to invalidate all ressources that depend on `dependency`
  private addDependency(origin: any, dependency: any) {
    if (!this.dependents.has(dependency)) this.dependents.set(dependency, new Set());
    this.dependents.get(dependency).add(origin);
  }

  // To know who what are the dependencies of `origin`
  // This will be used to know what are the dependencies of `origin`
  private addDependent(origin: any, dependency: any) {
    if (!this.dependencies.has(origin)) this.dependencies.set(origin, new Set());
    this.dependencies.get(origin).add(dependency);
  }

  getDependencies(origin: any) {
    return this.dependents.get(origin) || new Set();
  }

  getDependents(origin: any) {
    return this.dependencies.get(origin) || new Set();
  }

  remove(origin: any) {
    // console.log('remove', origin, {
    //   dependents: this.dependents.get(origin)?.size,
    //   dependencies: this.dependencies.get(origin)?.size
    // })
    // Also throw if there are things that have origin as a dependency.
    const dependents = this.dependents.get(origin);
    if (dependents?.size > 0) {
      console.log(dependents)
      throw new Error('Cannot remove origin as it is a dependency of other items');
    }

    // Remove origin from all its dependencies
    // So that the dependencies will list origin as a dependency
    const dependencies = this.dependencies.get(origin);

    dependencies?.forEach(dependency => {
      const dependencies = this.dependents.get(dependency);
      dependencies?.delete(origin);

      if (dependencies?.size === 0) {
        this.activityChanged.publish(dependency, false);
      }
    });

    this.items.delete(origin);
    this.dependents.delete(origin);
    this.dependencies.delete(origin);
  }

  autoClearCache = new AutoClearCache();
  invalidate(origin: any, force: boolean = false) {
    // console.log('invalidate origin', force, origin);
    if (!force && this.autoClearCache.has(origin)) {
      return;
    }

    // console.log('invalidate', origin)

    this.items.delete(origin);
    this.autoClearCache.add(origin);
    this.invalidations.publish(origin);

    const dependencies = this.getDependencies(origin);
    dependencies.forEach(dependentKey => {
      // We should force invalidate all dependents
      // Because they have been invalidated by the origin
      this.invalidate(dependentKey, true);
    });

    // this.remove(origin);
  }

  has(origin: any) {
    return this.items.has(origin);
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