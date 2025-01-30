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
}
