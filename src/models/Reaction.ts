import { Selector } from "./Selector";

type ReactionCallback = () => any;

export class Reaction extends Selector<ReactionCallback> {
  constructor(selector: () => any) {
    super(selector);
    this.start();
  }

  subscription: ReturnType<typeof Selector.subsribeToSelectorChanges>
  start() {
    this.get();

    this.subscription = Selector.subsribeToSelectorChanges(this, () => {
      setTimeout(() => this.get());
    }); 
  }

  stop() {
    this.subscription?.unsubscribe()
  }
}
