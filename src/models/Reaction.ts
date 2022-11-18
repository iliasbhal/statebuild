import { Selector } from "./Selector";

export class Reaction extends Selector<object> {
  constructor(selector: () => any) {
    super(selector);
    this.start();
  }

  subscription: ReturnType<typeof Selector.subsribeToSelectorChanges>
  start() {
    this.get();

    const subscrption = Selector.subsribeToSelectorChanges(this, () => this.get()); 
    this.subscription = subscrption;    
  }

  stop() {
    this.subscription?.unsubscribe()
  }
}
