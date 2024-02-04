import { Selector } from "./Selector";

type ReactionCallback = () => any;

export class Reaction extends Selector<ReactionCallback> {
  constructor(selector: () => any) {
    super(selector);
    this.start();
  }

  subscription: ReturnType<typeof Selector.onUpstreamInvalidation>
  start() {
    this.get();

    this.subscription = Selector.onUpstreamInvalidation(this, () => {
      this.get();
    }); 
  }

  dispose() {
    this.stop();
    super.dispose();
  }

  stop() {
    this.subscription?.unsubscribe();
    this.clear();
  }
}
