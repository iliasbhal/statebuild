import { State } from '../models';

export const select : MethodDecorator  = (desc: any) => {
  const initialGetter = desc.descriptor.get;
  const selectorByInstance = new WeakMap();

  desc.descriptor.get = function() {
    if (!selectorByInstance.has(this)) {
      selectorByInstance.set(this, State.select(initialGetter.bind(this)));
    }

    const selector = selectorByInstance.get(this);
    return selector.get();
  }
}
