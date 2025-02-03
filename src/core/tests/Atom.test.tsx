import wait from 'wait';
import { Atom, State, } from '../';

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

  it('can read the state of a promise (non-blocking)', async () => {
    const atom  = State.from(new Promise<number>(r => setTimeout(() => r(100), 100)));
    
    {
      const { isLoading, value, error } = atom.getAsync();
      expect(isLoading).toBe(true);
      expect(value).toBe(null);
      expect(error).toBe(null);
    }

    await wait(100);

    {
      const { isLoading, value, error } = atom.getAsync();
      expect(isLoading).toBe(false);
      expect(value).toBe(100);
      expect(error).toBe(null);
    }

  })

  it('can read the state of a promise (blocking - waterfall)', async () => {
    const createPromise = (value: any, timeout: number) => new Promise<number>(r => setTimeout(() => r(value), timeout));
    const atom  = State.from(createPromise('First', 100));
    
    expect(() => atom.getSync()).toThrow(Atom.Waiting);

    await wait(100);

    expect(atom.getSync()).toBe('First');

    atom.set(createPromise('Second', 100));

    expect(() => atom.getSync()).toThrow(Atom.Waiting);

    await wait(100);

    expect(atom.getSync()).toBe('Second');
  })

  it('can read the state of a promise (blocking - race)', async () => {
    const createPromise = (value: any, timeout: number) => new Promise<number>(r => setTimeout(() => r(value), timeout));
    const atom  = State.from(createPromise('First', 100));
    
    expect(() => atom.getSync()).toThrow(Atom.Waiting);

    await wait(50);

    expect(() => atom.getSync()).toThrow(Atom.Waiting);
    
    atom.set(createPromise('Second', 100));

    expect(() => atom.getSync()).toThrow(Atom.Waiting);
    
    await wait(50);

    expect(() => atom.getSync()).toThrow(Atom.Waiting);

    await wait(50);

    expect(atom.getSync()).toBe('Second');
  })
})
