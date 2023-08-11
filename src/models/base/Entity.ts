import { EventBus } from "../../utils/EventBus";

type PropVisitor = (target: object, prop: string | symbol) => void;

export class Entity {
  private static changes = new EventBus<Entity>();
  static subscribe(obj: object, callback: any) {
    const orignal = Entity.getBaseObject(obj);
    return Entity.changes.subscribe(orignal, callback);
  }
  
  static globalRegistrationStack : Entity[] = [];
  static globalVistorByBase = new WeakMap<Entity, PropVisitor>();
  static regsiterGlobalListener(base: Entity, visitor: PropVisitor) {
    Entity.globalRegistrationStack.push(base);
    Entity.globalVistorByBase.set(base, visitor);
    
    return {
      unregister() {
        const idx = Entity.globalRegistrationStack.indexOf(base);
        Entity.globalRegistrationStack.splice(idx, 1);
        Entity.globalVistorByBase.delete(base);
      }
    }
  }

  static getPeekVisitor() {
    const lastKey = Entity.globalRegistrationStack[Entity.globalRegistrationStack.length - 1];
    if (lastKey) {
      return Entity.globalVistorByBase.get(lastKey);
    }

    return null;
  }

  
  static originalObjectByProxy = new WeakMap<object>();
  static getBaseObject<E extends Entity>(obj: E) : E {
    return Entity.originalObjectByProxy.get(obj) || obj;
  }

  static stablePropMap = new WeakMap<object, Set<string>>();
  static makePropStable(obj: object, prop: string) {
    const base = Entity.getBaseObject(obj);
    if (!Entity.stablePropMap.has(base)) {
      Entity.stablePropMap.set(base, new Set());
    }

    const stableProps = Entity.stablePropMap.get(base);
    stableProps.add(prop);
  }

  static checkShouldWrapWithProxy = (obj, prop, value) => {
    const isStableProp = Entity.stablePropMap.get(obj)?.has(prop);
    if (isStableProp) {
      return false;
    }

    const isPromise = value instanceof Promise; 
    if (isPromise) {
      return false;
    }

    const isAlreadyProxy = Entity.originalObjectByProxy.has(value);
    const isObject = value instanceof Object;
    const shouldWrapWithProxy = !isAlreadyProxy && isObject;
    return shouldWrapWithProxy;
  }

  private static wrap = <T extends object>(base: T) : T => {
    const proxy = new Proxy(base, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (typeof value !== 'function') {
          const visit = Entity.getPeekVisitor()
          if (visit) {
            // console.log('VISIT', base, prop);
            visit(base, prop);
          }
        }

        // console.log('VSITE 2',  base, prop);
        return value
      },
      set(target, prop, newValue, receiver) {
        Entity.changes.publish(base, prop);
        
        const shouldWrapWithProxy = Entity.checkShouldWrapWithProxy(base, prop, newValue)
        if (shouldWrapWithProxy) {
          const proxyValue = Entity.wrap(newValue);
          return Reflect.set(target, prop, proxyValue, receiver);
        }

        return Reflect.set(target, prop, newValue, receiver);
      },
    })

    Entity.originalObjectByProxy.set(proxy, base);
    return proxy;
  }

  constructor() {
    return Entity.wrap(this);
  }
}