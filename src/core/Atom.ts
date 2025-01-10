import React from 'react';
import { Entity } from './base/Entity';

export class Atom<T> extends Entity {
  value: T;

  constructor(value: T) {
    super();

    this.value = value;
  }

  get() {
    return this.value;
  }

  set(value: T) {
    this.value = value;
  }

  static makeCallableAtom<A extends Atom<any>>(atom: A) {
    const callable: () => A['value'] = () => (atom as any).get();

    Object.setPrototypeOf(callable, Atom.prototype);
    const callableAtom = Object.assign(callable, atom);


    // ensure that "this" value is set correctly
    Object.assign(callable, {
      get: atom.get.bind(atom),
      set: atom.set.bind(atom),
    })

    const coreAtom = Entity.getBaseObject(atom);
    Entity.originalObjectByProxy.set(callableAtom, coreAtom);
    return callableAtom;
  }
}
