import { Entity } from '..';

describe('Entity', () => {
  class Person extends Entity {
    name = "John";
    list: string[] = [];
  }

  it('should track when object properties are set', () => {
    const person = new Person();

    const callback = jest.fn();
    Entity.subscribe(person, callback);

    person.name = 'Dave';

    expect(person).toMatchObject({ name: 'Dave' });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('name');
  })

  it('should track when array is mutated', () => {
    const person = new Person();

    const callback = jest.fn();
    Entity.subscribe(person.list, callback);

    person.list.push('1')

    expect(person.list).toMatchObject(["1"]);
    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith('0');
    expect(callback).toHaveBeenCalledWith('length');
  })
})