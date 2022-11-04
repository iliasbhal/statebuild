import { EventBus } from "./EventBus";



export class Entity {
  private static topics = new EventBus<Entity>();
  static subscribe = Entity.topics.subscribe;
  static publish = Entity.topics.publish;

  static handlePropRead = <T extends object>(base: T, onPropVisit: (target: object, prop: string | symbol) => void) : T => {
    return new Proxy(base, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') {
          onPropVisit(target, prop);
        }

        if (typeof value === 'object' && value !== null) {
          return Entity.handlePropRead(value, onPropVisit);
        }

        return value;
      },
    })
  }

  private static handlePropUpdates = <T extends object>(base: T) : T => {
    const proxy = new Proxy(base, {
      set(target, prop, newValue, receiver) {
        const hasChanged = target[prop] !== newValue;
        if (hasChanged) {
          Entity.publish(proxy, prop)
        }
        
        if (newValue instanceof Object) {
          const proxyValue = Entity.handlePropUpdates(newValue)
          return Reflect.set(target, prop, proxyValue, receiver);
        }

        return Reflect.set(target, prop, newValue, receiver);
      },
    })

    return proxy;
  }

  constructor() {
    return Entity.handlePropUpdates(this);
  }
}