import { Selector } from "./Selector";

type ReactionCallback = () => any;

export class Reaction extends Selector<ReactionCallback> {
  constructor(callback: () => any) {
    super(callback);
  }

  static current: Reaction | null = null;
  static hibernatedReactions = new Set<Reaction>();

  subscription: ReturnType<typeof Selector.onUpstreamInvalidation>
  start() {
    this.execute();

    this.subscription = Selector.onUpstreamInvalidation(this, () => {
      if (Reaction.hibernatedReactions.has(this)) {
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
    this.stop();
    super.dispose();
  }

  stop() {
    this.subscription?.unsubscribe();
  }

  static effect(callback: () => void) {
    const reaction = Reaction.current!;
    Reaction.hibernatedReactions.add(reaction);
    callback();
    Reaction.hibernatedReactions.delete(reaction);
  }
}
