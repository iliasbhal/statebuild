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
})