import { State } from '../models';

export const select : MethodDecorator  = (desc: any) => {
  const selectorByInstance = new WeakMap();
  const getOrCreateSelector = (instance, initialCallback) => {
    if (!selectorByInstance.has(instance)) {
      selectorByInstance.set(instance, State.select(initialCallback.bind(instance)));
    }

    const selector = selectorByInstance.get(instance);
    return selector;
  }
  
  const { descriptor } = desc 
  const isGetter = !!descriptor.get;
  if (isGetter) {
    const inital = descriptor.get;
    descriptor.get = function() {  
      const selector = getOrCreateSelector(this, inital);
      return selector.get();
    }
  }

  const isMethod = typeof descriptor.value === 'function';
  if (isMethod) {
    const initial = descriptor.value;
    descriptor.value = function(...args) {  
      const selector = getOrCreateSelector(this, initial);
      return selector.get(...args);
    }
  }
}

export const memo : MethodDecorator = (desc: any) => {

}