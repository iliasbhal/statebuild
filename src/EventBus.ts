export interface Subscription {
  unsubscribe() : void;
}

export type SubscriptionHandler = (topic: string) => void;

export class EventBus<Key extends object> {
  subscriptions = new WeakMap<Key, Set<SubscriptionHandler>>()

  publish = (target: Key, prop: string) => {
    const subscriptions = this.subscriptions.get(target);
    if (!subscriptions) {
      return;
    }

    subscriptions.forEach((handler) => {
      handler(prop);
    });
  }

  subscribe = (target: Key, handler: SubscriptionHandler) : Subscription => {
    if (!this.subscriptions.has(target)) {
      this.subscriptions.set(target, new Set());
    }

    const subscriptions = this.subscriptions.get(target);
    subscriptions.add(handler);

    return {
      unsubscribe: () => {
        subscriptions.delete(handler);
      },
    }
  }
}