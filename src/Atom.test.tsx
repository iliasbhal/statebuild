import { Atom } from './Atom';

describe('Atom', () => {
  it('can retrieve atom value', () => {
    const atom = Atom.from(3);
    expect(atom.get()).toBe(3);
  })

  it('can update atom property', () => {
    const atom = Atom.from(3);
    atom.set(4);
    expect(atom.get()).toBe(4);
  })
})

describe('Atom Selector', () => {
  it('can create a selector with other atoms', () =>{
    const count = Atom.from(3);
    const double = Atom.select(() => {
      return count.get() * 2
    });

    expect(double.get()).toBe(6);
  })

  it('can create a selector with other updated atoms', () =>{
    const count = Atom.from(3);
    count.set(4);
    const double = Atom.select(() => {
      return count.get() * 2
    });

    expect(double.get()).toBe(8);
  })

  it('updates selector when base atom is updated', () =>{
    const count = Atom.from(3);
    const double = Atom.select(() => {
      return count.get() * 2
    });

    count.set(6);
    expect(double.get()).toBe(12);

    count.set(1);
    expect(double.get()).toBe(2);
  })

  it('computes selector only when read', () => {
    const count = Atom.from(3);
    const select = jest.fn();
    const double = Atom.select(() => {
      select();
      return count.get() * 2
    });

    expect(select).not.toHaveBeenCalled();
    count.set(6);
    expect(double.get()).toBe(12);
    expect(select).toHaveBeenCalledTimes(1);
  })

  it('doesn\'t recompute selector if atom hasn\'t changed', () => {
    const count = Atom.from(3);
    const select = jest.fn();
    const double = Atom.select(() => {
      select();
      return count.get() * 2
    });

    expect(select).not.toHaveBeenCalled();
    
    double.get()
    double.get()
    double.get()

    expect(select).toHaveBeenCalledTimes(1);
    select.mockClear();

    count.set(4);

    double.get();
    double.get();
    double.get()

    expect(select).toHaveBeenCalledTimes(1);
  })
})