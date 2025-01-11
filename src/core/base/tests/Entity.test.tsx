import { State, Entity } from '../..';

describe('Entity', () => {
  class Person extends State {
    name = "John";
    list: string[] = [];
  }

  it('should track when object properties are set', () => {
    const person = new Person();

    const callback = jest.fn();
    Entity.subscribe(person, callback);

    person.name = 'Dave';

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('name');
    expect(person).toMatchObject({ name: 'Dave' });
  })

  it('should track when array is mutated', () => {
    const person = new Person();

    const callback = jest.fn();
    Entity.subscribe(person.list, callback);

    person.list.push('1')

    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith('0');
    expect(callback).toHaveBeenCalledWith('length');
    expect(person).toMatchObject({
      name: 'John',
      list: ['1'],
    });
  })

  class Worker extends Person {
    job: string = 'unemployed';
  }

  it('inherited: should track when object properties are set', () => {
    const worker = new Worker();

    const callback = jest.fn();
    Entity.subscribe(worker, callback);

    worker.name = 'Dave';

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('name');
    expect(worker).toMatchObject({ name: 'Dave' });
  })

  it('inherited: should track when array is mutated', () => {
    const worker = new Worker();

    const callback = jest.fn();
    Entity.subscribe(worker.list, callback);

    worker.list.push('1')

    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith('0');
    expect(callback).toHaveBeenCalledWith('length');
    expect(worker).toMatchObject({
      name: 'John',
      list: ['1'],
    });
  })

  it('inherited: should track worker attributes', () => {
    const worker = new Worker();

    const callback = jest.fn();
    Entity.subscribe(worker, callback);

    worker.job = 'baker';

    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith('job');
    expect(worker).toMatchObject({
      name: 'John',
      job: 'baker',
    });
  })

  it.skip('should not keep a reference on items after dipose', () => {
    const worker = new Worker();
    Entity.dispose(worker);
  })
})

describe('Entity Map/Set', () => {

  
  it('Set: can track when adding/removing an element', () => {
    class Example extends State {
      list: Set<any>[] = [];
    }
    const example = new Example();
    example.list.push(new Set());

    
    const callback = jest.fn();
    Entity.subscribe(example.list[0], callback);

    example.list[0].add('1');
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('size');
    expect(callback).toHaveBeenCalledWith('1');
    callback.mockClear();

    example.list[0].add('1');
    expect(callback).not.toHaveBeenCalled();
    callback.mockClear();

    example.list[0].add('2');
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('size');
    expect(callback).toHaveBeenCalledWith('2');
    callback.mockClear();

    example.list[0].add('1');
    example.list[0].add('2');
    expect(callback).not.toHaveBeenCalled();
    callback.mockClear();


    const obj = { id: 1 };
    example.list[0].add(obj);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('size');
    expect(callback).toHaveBeenCalledWith(obj);
    callback.mockClear();

    example.list[0].add('1');
    example.list[0].add('2');
    example.list[0].add(obj);
    expect(callback).not.toHaveBeenCalled();
    callback.mockClear();

    example.list[0].delete('1');
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('size');
    expect(callback).toHaveBeenCalledWith('1');
    callback.mockClear();

    example.list[0].delete('1');
    expect(callback).not.toHaveBeenCalled();
    callback.mockClear();

    example.list[0].delete(obj);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('size');
    expect(callback).toHaveBeenCalledWith(obj);
    callback.mockClear();


    example.list[0].delete('1');
    example.list[0].delete(obj);
    expect(callback).not.toHaveBeenCalled();
    callback.mockClear();

    example.list[0].clear();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('size');
    expect(callback).toHaveBeenCalledWith('2');
  })

  it('Map: can track when adding/removing an element', () => {
    class Example extends State {
      list: Map<any, any>[] = [];
    }

    const example = new Example();
    example.list.push(new Map());

    const callback = jest.fn();
    Entity.subscribe(example.list[0], callback);

    example.list[0].set('1', true);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('size');
    expect(callback).toHaveBeenCalledWith('1');
    callback.mockClear();

    example.list[0].set('1', true);
    expect(callback).not.toHaveBeenCalled();
    callback.mockClear();

    example.list[0].set('1', false);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('1');
    callback.mockClear();

    const obj = { id: 1 };
    example.list[0].set(obj, true);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('size');
    expect(callback).toHaveBeenCalledWith(obj);
    callback.mockClear();

    example.list[0].set(obj, true);
    expect(callback).not.toHaveBeenCalled();
    callback.mockClear();

    example.list[0].delete('1');
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('size');
    expect(callback).toHaveBeenCalledWith('1');
    callback.mockClear();
  })
})