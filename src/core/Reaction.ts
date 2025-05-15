import { Selector, AnySelectorCallback } from "./Selector";
import { Track } from "./Track";

export class Reaction extends Selector<AnySelectorCallback> {
  watch: ReturnType<typeof this.onInvalidate>;


  constructor(callback: AnySelectorCallback) {
    super((args) => {
      callback(args);
      return 3;
    });
  }

  start() {
    if (this.watch) {
      return;
    }

    // const invalidateId = Math.random().toString(36).substring(2, 15);
    this.watch = this.onInvalidate(() => {
      // console.log('on invalidate', this.id, invalidateId, this.invalidationCallbacks.size);



      this.restart();

      // console.log('done');
    });

    // console.log('before get');
    this.get();
    // console.log('after get');

    // Track.debug();
  }

  restart() {
    this.stop();
    this.start();
  }

  stop() {
    if (!this.watch) {
      return;
    }

    Track.remove(this.id);
    this.watch.unsubscribe();
    this.watch = null;
  }
}
