import { Selector } from "./Selector";

type ReactionCallback = () => any;

export class Reaction extends Selector<ReactionCallback> {
  constructor(callback: () => any) {
    super(callback);
  }

  static current: Reaction | null = null;
  static preventInifiniteLoop = new Set<Reaction>();

  subscription: ReturnType<typeof Selector.onUpstreamInvalidation>
  start() {
    this.execute();

    this.subscription = Selector.onUpstreamInvalidation(this, () => {
      if (Reaction.preventInifiniteLoop.has(this)) {
        return;
      }

      this.execute();
    });
  }

  execute() {
    Reaction.current = this;
    this.get();
  }

  dispose() {
    this.subscription?.unsubscribe();
    super.dispose();
  }

  stop() {
    this.dispose();
  }

  static effect(callback: () => void) {
    const reaction = Reaction.current!;
    Reaction.preventInifiniteLoop.add(reaction);
    callback();
    Reaction.preventInifiniteLoop.delete(reaction);
  }
}
