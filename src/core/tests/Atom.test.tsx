import { State, } from '../';

describe('Atom', () => {
  it('can retrieve atom value', () => {
    const atom = State.from(3);
    expect(atom.get()).toBe(3);
  })

  it('can update atom property', () => {
    const atom = State.from(3);
    atom.set(4);
    expect(atom.get()).toBe(4);
  })

  it('can be called like a function', () => {
    const atom = State.from(3);
    expect(atom()).toBe(3)

    atom.set(4);
    expect(atom()).toBe(4);
  })
})
