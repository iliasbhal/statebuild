import { Entity } from './Entity';

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

  static makeCallable<A extends Atom<any>>(atom: A, Constructor) : (() => A['value']) & A {
    const callable = () => atom.get();

    Object.setPrototypeOf(callable, Constructor.prototype);
    const callableAtom = Object.assign(callable, atom, {
      get: atom.get.bind(atom),
      set: atom.set.bind(atom),
    });

    const coreAtom = Entity.getBaseObject(atom);
    Entity.originalObjectByProxy.set(callableAtom, coreAtom);
    return callableAtom;
  }
}
