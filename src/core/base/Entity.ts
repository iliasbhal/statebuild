import { EventBus } from "../../utils/EventBus";

type PropVisitor = (target: object, prop: string | symbol) => void;

export class Entity {
  static changes = new EventBus<Entity>();
  static subscribe(obj: object, callback: any) {
    const orignal = Entity.getBaseObject(obj);
    return Entity.changes.subscribe(orignal, callback);
  }

  static globalRegistrationStack: Entity[] = [];
  static globalVistorByBase = new WeakMap<Entity, PropVisitor>();
  static regsiterGlobalListener(base: Entity, visitor: PropVisitor) {
    Entity.globalRegistrationStack.push(base);
    Entity.globalVistorByBase.set(base, visitor);

    return {
      unregister() {
        const idx = Entity.globalRegistrationStack.indexOf(base);
        Entity.globalRegistrationStack.splice(idx, 1);
        Entity.globalVistorByBase.delete(base);
      },
    };
  }

  static getPeekVisitor() {
    const lastKey =
      Entity.globalRegistrationStack[Entity.globalRegistrationStack.length - 1];
    if (lastKey) {
      return Entity.globalVistorByBase.get(lastKey);
    }

    return null;
  }

  static originalObjectByProxy = new WeakMap<object>();
  static getBaseObject<E extends Entity>(obj: E): E {
    return Entity.originalObjectByProxy.get(obj) || obj;
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

  private static wrap = <T extends object>(base: T): T => {
    const proxy = new Proxy(base, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (typeof value !== "function") {
          const visit = Entity.getPeekVisitor();
          if (visit) {
            // console.log('VISIT', base, prop);
            visit(base, prop);
          }
        }

        if (base instanceof Set || base instanceof Map) {
          if (typeof value === 'function') {
            return pathMapSetMethod(base, prop, value);
          }
        }

        return value;
      },
      set(target, prop, newValue, receiver) {
        const shouldWrapWithProxy = Entity.checkShouldWrapWithProxy(
          base,
          prop,
          newValue,
        );
        if (shouldWrapWithProxy) {
          const proxyValue = Entity.wrap(newValue);
          const returnValue = Reflect.set(target, prop, proxyValue, receiver);
          Entity.changes.publish(base, prop);
          return returnValue;
        }

        const returnValue = Reflect.set(target, prop, newValue, receiver);
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


const pathMapSetMethod = (base: Set<any> | Map<any, any>, prop, method) => {

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
    const visit = Entity.getPeekVisitor();
    if (visit) {
      return function (...args) {
        visit(base, args[0]);
        return Reflect.apply(method, base, args);
      };
    }
  }

  return method.bind(base);
}