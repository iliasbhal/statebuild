export interface Subscription {
  unsubscribe(): void;
}

export type SubscriptionHandler = (message?: string | symbol | number | boolean) => void;

export class EventBus<Topic extends object> {
  id: string;
  subscriptions = new WeakMap<Topic, Set<SubscriptionHandler>>();

  constructor(id?: string) {
    this.id = id;
  }

  publish = (topic: Topic, message?: Parameters<SubscriptionHandler>[0]) => {
    // if (this.id === 'dependencyCountChanged') {
    //   console.log('Publish', topic, message);
    // }

    const subscriptions = this.subscriptions.get(topic);
    if (!subscriptions) {
      return;
    }

    subscriptions.forEach((handler) => {
      handler(message);
    });
  }

  subscribe = (topic: Topic, handler: SubscriptionHandler): Subscription => {
    // if (this.id === 'dependencyCountChanged') {
    //   console.log('Publish', topic);
    // }

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