import { Entity } from "./Entity";

export class Atom<T> extends Entity {
  protected value: T;

  constructor(value: T) {
    super();

    this.value = value;
  }

  static from<V>(value: V) {
    const atom = new Atom(value);
    return atom;
  }

  get() {
    return this.value;
  }

  set(value: T) {
    this.value = value;
  }
}