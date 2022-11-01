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

  static select<V>(selector: () => V) : Atom<V> {
    const atom = new AtomSelector(selector);
    return atom;
  }

  get() {
    return this.value;
  }

  set(value: T) {
    this.value = value;
  }
}

class AtomSelector<T> extends Atom<T> {
  protected selector : () => T;

  constructor(selector: () => T) {
    super(null);

    this.selector = selector;
  }

  select() {
    const value = this.selector();
    this.set(value);
  }

  get() {
    this.select();
    return super.get();
  }
}