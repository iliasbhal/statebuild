import { Selector, SelectorContext } from "./Selector";
import { Entity } from "./base/Entity";
import { Track } from "./Track";

type ReactionCallback = () => any;

export class Reaction extends Selector<ReactionCallback> {
  constructor(callback: () => any) {
    super(callback);
  }

  static runningEffect = new WeakSet<Selector<any>>();

  context = new ReactionContext(this);
  subscription: ReturnType<typeof Track.subscribe>

  started = false;

  start() {
    if (this.started) return;
    this.started = true;

    Track.subscribe(this, () => {
      if (Reaction.runningEffect.has(this)) return;
      this.execute();
    })

    Track.attributeChanges(this, () => {
      this.execute();
    });
  }

  restart() {
    this.stop();
    this.start();
  }

  private execute() {
    Track.dispose(this);
    this.get();
  }

  forceRun() {
    return Selector.runRaw(this);
  }

  dispose() {
    this.subscription?.unsubscribe();
    super.dispose();
  }

  stop() {
    this.started = false
    this.dispose();
  }
}


class ReactionContext extends SelectorContext {
  effect(callback: () => void) {
    Reaction.runningEffect.add(this.selector);
    callback();
    Reaction.runningEffect.delete(this.selector);
  }
}