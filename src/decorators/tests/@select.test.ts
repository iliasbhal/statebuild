import { State } from '../../models';
import { select } from '../@select';

describe('@select', () => {
  const fullNameSpy = jest.fn();
  const reverseFullNameSpy = jest.fn();

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

  it('should recall getter if dependencies have changed updated', () => {
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
});