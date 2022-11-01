export interface Subscription {
  unsubscribe() : void;
}

export type SubscriptionHandler = (topic: string | symbol) => void;

export class EventBus<Topic extends object> {
  subscriptions = new WeakMap<Topic, Set<SubscriptionHandler>>()

  publish = (target: Topic, prop: string | symbol) => {
    const subscriptions = this.subscriptions.get(target);
    if (!subscriptions) {
      return;
    }

    subscriptions.forEach((handler) => {
      handler(prop);
    });
  }

  subscribe = (target: Topic, handler: SubscriptionHandler) : Subscription => {
    if (!this.subscriptions.has(target)) {
      this.subscriptions.set(target, new Set());
    }

    const subscriptions = this.subscriptions.get(target);
    subscriptions.add(handler);

    return {
      unsubscribe: () => {
        subscriptions.delete(handler);
        if (subscriptions.size == 0) {
          this.subscriptions.delete(target);
        }
      },
    }
  }
}