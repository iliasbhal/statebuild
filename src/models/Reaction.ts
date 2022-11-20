import { Selector } from "./Selector";

export class Reaction extends Selector<object> {
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
