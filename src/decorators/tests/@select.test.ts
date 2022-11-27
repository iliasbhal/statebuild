import { State } from '../../models';
import { select } from '../@select';

describe('@select', () => {
  const fullNameSpy = jest.fn();
  const reverseFullNameSpy = jest.fn();
  const methodSpy = jest.fn();

  class Person extends State {
    fistName: string = '';
    lastName: string = '';

    constructor(data: Partial<Person>) {
      super();

      this.fistName = data.fistName || '';
      this.lastName = data.lastName || '';
    }

    @select get fullName() {
      fullNameSpy();
      return this.fistName + ' ' + this.lastName;
    }

    @select get reverseFullName() {
      reverseFullNameSpy();
      return this.lastName + ' ' + this.fistName;
    }

    @select checkNameWith(testName: string) {
      methodSpy(testName);
      return this.lastName + " " + testName;
    }
  }

  beforeEach(() => {
    fullNameSpy.mockClear();
    reverseFullNameSpy.mockClear();
  })

  it('should return initial value', () => {
    const person = new Person({ fistName: 'John', lastName: 'Doe' });
    expect(fullNameSpy).not.toHaveBeenCalled();

    expect(person.fullName).toBe('John Doe');
    expect(fullNameSpy).toHaveBeenCalledTimes(1);
  })

  it('should cache value if dependencies are not updated', () => {
    const person = new Person({ fistName: 'John', lastName: 'Doe' });
    expect(person.fullName).toBe('John Doe');
    expect(person.fullName).toBe('John Doe');
    expect(fullNameSpy).toHaveBeenCalledTimes(1);
  })

  it('should invalidate cache if dependencies have changed updated', () => {
    const person = new Person({ fistName: 'John', lastName: 'Doe' });
    expect(person.fullName).toBe('John Doe');
    expect(fullNameSpy).toHaveBeenCalledTimes(1);
    fullNameSpy.mockClear();

    person.fistName = "Dave";

    expect(person.fullName).toBe('Dave Doe');
    expect(person.fullName).toBe('Dave Doe');
    expect(fullNameSpy).toHaveBeenCalledTimes(1);
  })

  it('should be usable several times per class', () => {
    const person = new Person({ fistName: 'John', lastName: 'Doe' });
    expect(person.fullName).toBe('John Doe');
    expect(person.reverseFullName).toBe('Doe John');
    expect(person.fullName).toBe('John Doe');
    expect(person.reverseFullName).toBe('Doe John');
    expect(fullNameSpy).toHaveBeenCalledTimes(1);
    fullNameSpy.mockClear();

    expect(reverseFullNameSpy).toHaveBeenCalledTimes(1);
    reverseFullNameSpy.mockClear();

    person.fistName = "Dave";

    expect(person.fullName).toBe('Dave Doe');
    expect(person.reverseFullName).toBe('Doe Dave');
    expect(person.fullName).toBe('Dave Doe');
    expect(person.reverseFullName).toBe('Doe Dave');
    expect(fullNameSpy).toHaveBeenCalledTimes(1);
    expect(reverseFullNameSpy).toHaveBeenCalledTimes(1);
  })

  it('should memoize decorated methods', () => {
    const person = new Person({ fistName: 'John', lastName: 'Doe' });

    person.checkNameWith('The 2nd');
    expect(person.checkNameWith('The 2nd')).toBe('Doe The 2nd');
    expect(methodSpy).toHaveBeenCalledTimes(1);

    person.checkNameWith('The 3rd');
    expect(person.checkNameWith('The 3rd')).toBe('Doe The 3rd');

    expect(person.checkNameWith('The 2nd')).toBe('Doe The 2nd');
    expect(methodSpy).toHaveBeenCalledTimes(2);
    expect(methodSpy).toHaveBeenLastCalledWith('The 3rd');
    methodSpy.mockClear();

    person.lastName = 'Found';
    expect(person.checkNameWith('The 3rd')).toBe('Found The 3rd');
    person.checkNameWith('The 3rd');
    expect(methodSpy).toHaveBeenCalledTimes(1);
    methodSpy.mockClear();

    expect(person.checkNameWith('The 2nd')).toBe('Found The 2nd');
    expect(person.checkNameWith('The 2nd')).toBe('Found The 2nd');
    expect(methodSpy).toHaveBeenCalledTimes(1);
    expect(methodSpy).toHaveBeenLastCalledWith('The 2nd');
    methodSpy.mockClear();

    expect(person.checkNameWith('The 3rd')).toBe('Found The 3rd');
    expect(methodSpy).not.toHaveBeenCalled();
  })
});