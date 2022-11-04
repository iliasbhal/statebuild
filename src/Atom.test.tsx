import { Atom, AtomSelector } from './Atom';
import { Entity } from './Entity';

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
    const double = Atom.select((use) => use(count) * 2);

    expect(double.get()).toBe(6);
  })

  it('throws if trying to manualy set set value', () => {
    const count = Atom.from(3);
    const double = Atom.select((use) => use(count) * 2);

    expect(() => double.set(3)).toThrow();
  })

  it('can create a selector with other updated atoms', () =>{
    const count = Atom.from(3);
    count.set(4);
    const double = Atom.select((use) => use(count) * 2);

    expect(double.get()).toBe(8);
  })

  it('updates selector when base atom is updated', () =>{
    const count = Atom.from(3);
    const double = Atom.select((use) => use(count) * 2);

    count.set(6);
    expect(double.get()).toBe(12);

    count.set(1);
    expect(double.get()).toBe(2);
  })

  it('computes selector only when read', () => {
    const count = Atom.from(3);
    const selector = jest.fn().mockImplementation(() => count.get() * 2);
    const double = Atom.select(selector);

    expect(selector).not.toHaveBeenCalled();
    count.set(6);
    expect(double.get()).toBe(12);
    expect(selector).toHaveBeenCalledTimes(1);
  })

  it('doesn\'t recompute selector if atom hasn\'t changed', () => {
    const count = Atom.from(3);
    const selector = jest.fn().mockImplementation((use) => use(count) * 2);
    const double = Atom.select(selector);

    expect(selector).not.toHaveBeenCalled();
    
    double.get();
    double.get();
    double.get()

    expect(double.get()).toBe(6);
    expect(selector).toHaveBeenCalledTimes(1);
    selector.mockClear();

    count.set(4);

    expect(selector).not.toHaveBeenCalled();

    double.get();
    double.get();
    double.get();

    expect(double.get()).toBe(8);
    expect(selector).toHaveBeenCalledTimes(1);
  })

  it('accepts a selectors as arguments', () => {
    const count = Atom.from(3);
    const selector = jest.fn();
    const double = Atom.select((use) => {
      selector();
      return use(count) * 2;
    });

    const selector2 = jest.fn();
    const quad = Atom.select((use) => {
      selector2();
      return use(double) * 2;
    });

    expect(selector).not.toHaveBeenCalled();
    expect(selector2).not.toHaveBeenCalled();

    expect(quad.get()).toBe(12);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(selector2).toHaveBeenCalledTimes(1);
  })

  it('be up to date when upstream selector isn\'t valid', () => {
    const count = Atom.from(1);
    const double = Atom.select((use) => use(count) * 2);
    const quad = Atom.select((use) => use(double) * 2);

    expect(quad.get()).toBe(4);

    count.set(100)

    expect(quad.get()).toBe(400);
  })

  it('should recompute invalidated upstream selectors', () => {
    const count = Atom.from(1);
    const doubleSpy = jest.fn();
    const double = Atom.select((use) => {
      doubleSpy();
      return use(count) * 2;
    });

    const tripleSpy = jest.fn();
    const triple = Atom.select((use) => {
      tripleSpy();
      return use(double) * 3;
    });

    expect(doubleSpy).not.toHaveBeenCalled();
    expect(tripleSpy).not.toHaveBeenCalled();
    
    triple.get();
    expect(triple.get()).toBe(6);
    expect(doubleSpy).toHaveBeenCalledTimes(1);
    expect(tripleSpy).toHaveBeenCalledTimes(1);
    doubleSpy.mockClear();
    tripleSpy.mockClear();
    
    count.set(100);
    expect(doubleSpy).not.toHaveBeenCalled();
    expect(tripleSpy).not.toHaveBeenCalled();

    triple.get()
    expect(triple.get()).toBe(600);
    expect(doubleSpy).toHaveBeenCalledTimes(1);
    expect(tripleSpy).toHaveBeenCalledTimes(1);
  })

  it('should recompute invalidated upstream selectors tree 2', () => {
    const count = Atom.from(1);
    const doubleSpy = jest.fn();
    const double = Atom.select((use) => {
      doubleSpy();
      return use(count) * 2;
    });
    
    const multiple = Atom.from(3);
    const multiple2 = Atom.from(1000);
    const variableSpy = jest.fn();
    const variable = Atom.select((use) => {
      variableSpy();
      return use(double) * use(multiple) * use(multiple2);
    });

    variable.get()
    expect(variable.get()).toBe(6000);
    expect(doubleSpy).toHaveBeenCalledTimes(1);
    expect(variableSpy).toHaveBeenCalledTimes(1);
    doubleSpy.mockClear();
    variableSpy.mockClear();

    multiple.set(0)
    
    expect(variable.get()).toBe(0);
    expect(doubleSpy).not.toHaveBeenCalled();
    expect(variableSpy).toHaveBeenCalledTimes(1);
    doubleSpy.mockClear();
    variableSpy.mockClear();

    multiple2.set(5)
    expect(variable.get()).toBe(0);
    expect(doubleSpy).not.toHaveBeenCalled();
    expect(variableSpy).toHaveBeenCalledTimes(1);
  })

  // This is because we don't get stable references
  // when working with proxies
  // we should ensure thet the reference key used
  // when calling .register .invalidate and .verify is stable
  // that's why we had to use .selector sometimes
  // because .selector attribute is not wrapped 
  // by a Proxy from Entity when read
  it.todo('remove usage of .selector in DependencyTree');
})