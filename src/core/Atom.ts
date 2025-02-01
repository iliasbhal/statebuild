import { Entity } from './base/Entity';

export class Atom<T> {
  atom: { value: T };

  constructor(value: T) {
    this.atom = Entity.wrap({
      value,
    });
  }

  get() {
    return this.atom.value
  }

  set(value: T) {
    this.atom.value = value
  }

  dispose() {
    Entity.dispose(this.atom);
  }
}
