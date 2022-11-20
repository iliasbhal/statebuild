import { State } from '../models';

const createSelectoryFactory = () => {
  const selectorsBy = new WeakMap<any, any>();

  return (instance, selectFn) => {
    if (!selectorsBy.get(instance)) {
      const selector = State.select(selectFn.bind(instance));
      selectorsBy.set(instance, selector);
    }
    
    return selectorsBy.get(instance);
  }
}

export const select : MethodDecorator  = (desc: any) => {
  const initialGetter = desc.descriptor.get;
  const createSelector = createSelectoryFactory();

  desc.descriptor.get = function() {
    const selector = createSelector(this, initialGetter);
    return selector.get();
  }
}
