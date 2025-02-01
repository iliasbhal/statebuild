import { Selector, AnySelectorCallback } from "./Selector";

export class Reaction extends Selector<AnySelectorCallback> {
  watch: ReturnType<typeof this.onInvalidate>;
  start() {
    if (this.watch) {
      return;
    }

    this.get();

    this.watch = this.onInvalidate(() => {
      this.get();
    });
  }

  stop() {
    if (!this.watch) {
      return;
    }

    this.watch.unsubscribe();
    this.watch = null;
  }
}
