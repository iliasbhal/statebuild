import { EventBus } from "../utils/EventBus";

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

  
  static originalObjectByProxy = new WeakMap<object>();
  static getBaseObject<E extends Entity>(obj: E) : E {
    return Entity.originalObjectByProxy.get(obj) ?? obj;
  }

  static checkShouldWrapWithProxy = (value) => {
    const isAlreadyProxy = Entity.originalObjectByProxy.has(value);
    const isObject = value instanceof Object;
    const shouldWrapWithProxy = !isAlreadyProxy && isObject;
    return shouldWrapWithProxy;
  }

  private static handlePropUpdates = <T extends object>(base: T) : T => {
    const proxy = new Proxy(base, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (typeof value !== 'function') {
          const lastKey = Entity.globalRegistrationStack[Entity.globalRegistrationStack.length - 1];
          if (lastKey) {
            const propVisitor = Entity.globalVistorByBase.get(lastKey);
            propVisitor(base, prop);
          }
        }

        return value
      },
      set(target, prop, newValue, receiver) {
        Entity.changes.publish(base, prop);
        
        const shouldWrapWithProxy = Entity.checkShouldWrapWithProxy(newValue)
        if (shouldWrapWithProxy) {
          const proxyValue = Entity.handlePropUpdates(newValue);
          return Reflect.set(target, prop, proxyValue, receiver);
        }

        return Reflect.set(target, prop, newValue, receiver);
      },
    })

    Entity.originalObjectByProxy.set(proxy, base);
    return proxy;
  }

  constructor() {
    return Entity.handlePropUpdates(this);
  }
}
