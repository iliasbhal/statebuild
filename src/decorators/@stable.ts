import { Entity } from '../models';

export const stable : PropertyDecorator  = (desc: any) => {
  const originalInitializer = desc.initializer;

  desc.initializer = function(...args) {
    Entity.makePropStable(this, desc.key);
    return originalInitializer(...args);
  }
}
