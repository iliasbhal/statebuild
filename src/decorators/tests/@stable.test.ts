import { State } from '../../models';
import { stable } from '../@stable';

describe('@stable', () => {
  class Person extends State {
    @stable ref: object = {};
    @stable ref2: object = {};

    constructor(data: Partial<Person>) {
      super();

      this.ref = data.ref || {};
    }
  }

  it('stable properties are not wrapped with Proxy', () => {

    const initialRef = { name: 1 };
    const person = new Person({ ref: initialRef });

    expect(person.ref).toBe(initialRef);
  })
});