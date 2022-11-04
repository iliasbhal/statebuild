export interface Subscription {
  unsubscribe() : void;
}

export type SubscriptionHandler = (topic: string | symbol) => void;

export class EventBus<Topic extends object> {
  subscriptions = new WeakMap<Topic, Set<SubscriptionHandler>>()

  publish = (topic: Topic, message: string | symbol) => {
    const subscriptions = this.subscriptions.get(topic);
    if (!subscriptions) {
      return;
    }

    subscriptions.forEach((handler) => {
      handler(message);
    });
  }

  subscribe = (topic: Topic, handler: SubscriptionHandler) : Subscription => {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }

    const subscriptions = this.subscriptions.get(topic);
    subscriptions.add(handler);

    return {
      unsubscribe: () => {
        subscriptions.delete(handler);
        if (subscriptions.size == 0) {
          this.subscriptions.delete(topic);
        }
      },
    }
  }
}