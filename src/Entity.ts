import { EventBus } from "./EventBus";



export class Entity {
  private static topics = new EventBus<Entity>();
  static subscribe = Entity.topics.subscribe;
  static publish = Entity.topics.publish;

  static handlePropRead = <T extends object>(base: T, onPropVisit: (target: object, prop: string) => void) : T => {
    return new Proxy(base, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof prop === 'string') {
          onPropVisit(target, prop);
        }

        if (typeof value === 'object') {
          return Entity.handlePropRead(value, onPropVisit);
        }

        return value;
      },
    })
  }

  private static handlePropUpdates = <T extends object>(base: T) : T => {
    const proxy = new Proxy(base, {
      set(target, prop, newValue, receiver) {
        if (typeof prop === 'string') {
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