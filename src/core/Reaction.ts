import { Selector, AnySelectorCallback } from "./Selector";

export class Reaction {
  id: string;
  callback: AnySelectorCallback;
  selector: Selector<AnySelectorCallback>
  constructor(callback: AnySelectorCallback) {
    this.callback = callback;
  }

  start() {
    if (this.selector) return;

    this.selector = new Selector(this.callback);
    this.selector.id = this.id;
    this.selector.get();

    this.selector.onInvalidate(() => {
      this.restart();
    });
  }

  restart() {
    this.stop();
    this.start();
  }

  dispose() {
    this.selector?.dispose();
    this.selector = null;
  }

  stop() {
    this.dispose();
  }
}
