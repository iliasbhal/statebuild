import { EventBus } from "../../utils/EventBus";
import { Track } from "../Track";

export class Entity {
  static changes = new EventBus<Entity>();
  static subscribe(obj: object, callback: any) {
    const orignal = Entity.getBaseObject(obj);
    return Entity.changes.subscribe(orignal, callback);
  }

  static originalObjectByProxy = new WeakMap<object>();
  static getBaseObject<E extends Entity>(obj: E): E {
    return Entity.originalObjectByProxy.get(obj) || obj;
  }

  static dispose(obj: Entity) {
    Entity.originalObjectByProxy.delete(obj);
    return;
  }

  static checkShouldWrapWithProxy = (obj, prop, value) => {
    const isPromise = value instanceof Promise;
    if (isPromise) {
      return false;
    }

    const isPrimitive = typeof value !== "object";
    if (isPrimitive) {
      return false;
    }

    const isAlreadyProxy = Entity.originalObjectByProxy.has(value);
    const isObject = value instanceof Object;
    const shouldWrapWithProxy = !isAlreadyProxy && isObject;
    return shouldWrapWithProxy;
  };

  static wrap = <T extends object>(base: T): T => {
    const proxy = new Proxy(base, {
      get(target, prop, receiver) {
        // console.log('GET', target, prop);
        const value = Reflect.get(target, prop, receiver);
        const isFunction = typeof value == "function";

        if (!isFunction) {
          Track.visit(base, prop)
        }

        if (base instanceof Set || base instanceof Map) {
          if (typeof value === 'function') {
            return patchMapSetMethods(base, prop, value);
          }
        }

        return value;
      },
      set(target, prop, newValue, receiver) {
        // console.log('SET', target, prop, newValue);
        const shouldWrapWithProxy = Entity.checkShouldWrapWithProxy(
          base,
          prop,
          newValue,
        );

        const nextValue = shouldWrapWithProxy
          ? Entity.wrap(newValue)
          : newValue;

        const returnValue = Reflect.set(target, prop, nextValue, receiver);
        Entity.changes.publish(base, prop);
        return returnValue;
      },
    });

    Entity.originalObjectByProxy.set(proxy, base);
    return proxy;
  };

  constructor() {
    return Entity.wrap(this);
  }
}


const patchMapSetMethods = (base: Set<any> | Map<any, any>, prop, method) => {

  // Methods that can update the content of the Set/Map
  if (prop === 'add' || prop === 'delete' || prop === 'clear') {
    return function (...args) {
      const iterable = base.keys();
      const keysToNotify = prop === 'clear' ? Array.from(iterable)
        : prop === 'set' ? [args[0]]
          : args;

      const beforeSize = base.size;
      const returnValue = Reflect.apply(method, base, args);
      const afterSize = base.size;

      if (beforeSize !== afterSize) {
        Entity.changes.publish(base, 'size');
        keysToNotify.forEach((key) => {
          Entity.changes.publish(base, key);
        })
      }

      return returnValue;
    };
  }

  if (prop === 'set' && base instanceof Map) {
    return function (...args) {
      const willChange = args[1] !== base.get(args[0]);

      const beforeSize = base.size;
      const returnValue = Reflect.apply(method, base, args);
      const afterSize = base.size;

      if (beforeSize !== afterSize) {
        Entity.changes.publish(base, 'size');
        Entity.changes.publish(base, args[0]);
      } else if (willChange) {
        Entity.changes.publish(base, args[0]);
      }

      return returnValue;
    };
  }

  // Methods that read the content
  if (prop === 'has' || prop === 'get') {
    return function (...args) {
      Track.visit(base, args[0]);
      return Reflect.apply(method, base, args);
    };
  }

  return method.bind(base);
}