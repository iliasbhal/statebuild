import React from 'react';
import * as testingLib from '@testing-library/react'
import { State, useEntity } from '../..';


describe.skip('useEntity', () => {
  class Count extends State {
    count = 0;
    count2 = 0;

    get readableCount() {
      return `${this.count}x times`;
    }

    setCount(num: number) {
      this.count = num;
    }

    increment() {
      this.count += 1;
    }
  }

  const Container = () => {
    const store = useEntity(Count)
    return (
      <div
        data-testid="container"
        onClick={() => store.increment()}
      >
        {store.count} {store.count2}
      </div>
    )
  }

  it('should display initial values', () => {
    const wrapper = testingLib.render(<Container />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent("0 0");
  });

  it('should render updated value', () => {
    const wrapper = testingLib.render(<Container />);
    const container = wrapper.getByTestId('container');

    React.act(() => {
      container.click();
    });

    expect(container).toHaveTextContent("1 0");

    React.act(() => {
      container.click();
    });

    expect(container).toHaveTextContent("2 0");
  });

  it('should rerender when getter is updated', () => {
    class Count extends State {
      count = 0;

      get readableCount() {
        return `${this.count}x times`;
      }

      increment() {
        this.count += 1;
      }
    }

    const Container = () => {
      const store = useEntity(Count)

      return (
        <div
          data-testid="container"
          onClick={() => store.increment()}
        >
          {store.readableCount}
        </div>
      )
    }

    const wrapper = testingLib.render(<Container />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent("0x times");

    React.act(() => {
      container.click();
      container.click();
      container.click();
    });

    expect(container).toHaveTextContent("3x times");
  })

  it('should rerender when getter closur is updated', () => {
    const person = new Person('John');
    class TestState extends State {
      count = 0;

      get text() {
        return `${person.firstName} counts to ${this.count}`;
      }

      increment() {
        this.count += 1;
      }
    }

    const renderSpy = jest.fn();
    const Container = () => {
      const store = useEntity(TestState)
      renderSpy();

      return (
        <div data-testid="container">
          {store.text}
        </div>
      )
    }

    const wrapper = testingLib.render(<Container />);
    const container = wrapper.getByTestId('container');

    expect(container.innerHTML).toBe('John counts to 0');

    React.act(() => {
      person.setFirstName('Lynda');
    });

    expect(container.innerHTML).toBe('Lynda counts to 0');
  });

  it('should batch updates and only render once', () => {
    class Count extends State {
      count = 0;

      increment() {
        this.count += 1;
      }
    }

    const renderSpy = jest.fn();
    const Container = () => {
      const store = useEntity(Count)
      renderSpy();

      return (
        <div
          data-testid="container"
          onClick={() => store.increment()}
        >
          {store.count}
        </div>
      )
    }

    const wrapper = testingLib.render(<Container />);
    const container = wrapper.getByTestId('container');

    React.act(() => {
      container.click();
      container.click();
      container.click();
      container.click();
    });

    expect(container).toHaveTextContent("4");
    expect(renderSpy).toHaveBeenCalledTimes(2);
  })


  it('should rerender when data is updated while rendering', () => {
    const renderTrack = jest.fn();

    const Container = (props: { count: Count }) => {
      const store = useEntity(props.count)

      const prevCount = store.count;

      if (store.count !== 5) {
        store.setCount(5);
      }

      renderTrack();
      return (
        <div
          data-testid="container"
          onClick={() => {
            store.count += 1;
          }}
        >
          {prevCount}
          {store.count}
        </div>
      )
    }

    const count = new Count();
    const wrapper = testingLib.render(<Container count={count} />);

    
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent("5");
    // expect(container).toHaveTextContent("5");
    // expect(count.count).toEqual(3);
    expect(renderTrack).toHaveBeenCalledTimes(1);
  })

  it('should rerender when updating attribute from within component', () => {
    const renderTrack = jest.fn();

    const Container = (props: any) => {
      const store = useEntity(props.count)
      renderTrack();
      return (
        <div
          data-testid="container"
          onClick={() => {
            store.count += 1;
          }}
        >
          {store.count}
        </div>
      )
    }

    const count = new Count();
    const wrapper = testingLib.render(<Container count={count} />);
    const container = wrapper.getByTestId('container');
    renderTrack.mockClear();
    expect(container).toHaveTextContent("0");

    React.act(() => {
      container.click();
      container.click();
      container.click();
    })

    expect(container).toHaveTextContent("3");
    expect(count.count).toEqual(3);
    expect(renderTrack).toHaveBeenCalledTimes(1);
  })

  it('should rerender when updating attribute from outside component', () => {
    const renderTrack = jest.fn();

    const Container = (props: any) => {
      const store = useEntity(props.count)
      renderTrack();
      return (
        <div data-testid="container">
          {store.count}
        </div>
      )
    }

    const count = new Count();
    const wrapper = testingLib.render(<Container count={count} />);
    const container = wrapper.getByTestId('container');
    renderTrack.mockClear();
    expect(container).toHaveTextContent("0");

    React.act(() => {
      count.count += 3;
    })

    expect(container).toHaveTextContent("3");
    expect(count.count).toEqual(3);
    expect(renderTrack).toHaveBeenCalledTimes(1);
  })

  it('should not rerender if attributes is not used during render', () => {
    const renderSpy = jest.fn();

    const Container = () => {
      const store = useEntity(Count)
      renderSpy();
      return (
        <div
          data-testid="container"
          onClick={() => {
            const nextCount = store.count + 1;
            store.setCount(nextCount)
          }}
        >
          {store.count2}
        </div>
      )
    }

    const wrapper = testingLib.render(<Container />);
    const container = wrapper.getByTestId('container');

    React.act(() => {
      container.click();
      container.click();
      container.click();
    });

    expect(renderSpy).toHaveBeenCalledTimes(1);

    React.act(() => {
      container.click();
      container.click();
      container.click();
    });

    expect(renderSpy).toHaveBeenCalledTimes(1);
  })


  class Person extends State {
    firstName: string;

    constructor(firstName: string) {
      super();

      this.firstName = firstName;
    }

    setFirstName(firstName: string) {
      this.firstName = firstName;
    }
  }

  class People extends State {
    people: Person[] = [];

    addPerson(person: Person) {
      this.people.push(person);
    }
  }

  it('should rerender when children objects are updated', () => {
    const people = new People();
    const renderTrack = jest.fn();
    const PeopleList = (props: { people: People }) => {
      const store = useEntity(props.people)
      renderTrack();
      return (
        <div
          data-testid="container-store"
          onClick={() => {
            const idx = store.people.length;
            store.addPerson(
              new Person(`John ${idx}`)
            );
          }}
        >
          There are {store.people.length} people.
          {store.people.length > 0 && (
            <>
              Last Person: {store.people[store.people.length - 1].firstName}<br />
            </>
          )}
        </div>
      )
    }

    const wrapper = testingLib.render(
      <PeopleList people={people} />
    );
    const container = wrapper.getByTestId('container-store');
    expect(container.innerHTML).toBe("There are 0 people.");
    renderTrack.mockClear();

    React.act(() => {
      container.click();
      container.click();
      container.click();
    });

    expect(renderTrack).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent("There are 3 people.");
    expect(container).toHaveTextContent("Last Person: John 2")
  });

  it('should rerender when deeper children objects are updated', () => {
    const people = new People();
    people.addPerson(new Person('1 (initial)'))
    people.addPerson(new Person('2 (initial)'))

    const renderTrack = jest.fn();
    const PeopleList = (props: { people: People }) => {
      const store = useEntity(props.people)
      const lastPerson = store.people[store.people.length - 1];
      renderTrack();
      return (
        <div
          data-testid="container-store"
          onClick={() => {
            lastPerson.setFirstName('2 (updated)');
          }}
        >
          Last Person: {lastPerson.firstName}
        </div>
      )
    }

    const wrapper = testingLib.render(
      <PeopleList people={people} />
    );
    const container = wrapper.getByTestId('container-store');
    expect(container.innerHTML).toBe("Last Person: 2 (initial)");
    renderTrack.mockClear();

    React.act(() => {
      container.click();
    });

    expect(renderTrack).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("Last Person: 2 (updated)");
  });

  it('should not rerender when deep children objects are updated', () => {
    const people = new People();
    people.addPerson(new Person('1 (initial)'))
    people.addPerson(new Person('2 (initial)'))

    const renderTrack = jest.fn();
    const PeopleList = (props: { people: People }) => {
      const store = useEntity(props.people)
      const firstPerson = store.people[0];
      renderTrack();
      return (
        <div
          data-testid="container-store"
          onClick={() => {
            const lastPerson = store.people[store.people.length - 1];
            lastPerson.setFirstName('2 (updated)');
          }}
        >
          First Person: {firstPerson.firstName}
        </div>
      )
    }

    const wrapper = testingLib.render(
      <PeopleList people={people} />
    );
    const container = wrapper.getByTestId('container-store');
    renderTrack.mockClear();

    React.act(() => {
      container.click();
    });

    expect(renderTrack).toHaveBeenCalledTimes(0);
    expect(people.people).toHaveLength(2);
  });

  it('should render/rerender when out of scope object are updated', () => {

    const first = new Person('FirstName LastName');
    class People extends State {
      people = [first];
    }

    const renderTrack = jest.fn();
    const PeopleDisplay = (props: { people: People }) => {
      const store = useEntity(props.people)

      renderTrack();
      return (
        <div
          data-testid="container-store"
          onClick={() => {
            first.firstName = 'Updated Name';
          }}
        >
          {store.people[0].firstName}
        </div>
      )
    }

    const wrapper = testingLib.render(
      <PeopleDisplay people={new People()} />
    );
    const container = wrapper.getByTestId('container-store');
    expect(container.innerHTML).toBe("FirstName LastName");
    renderTrack.mockClear();

    React.act(() => {
      container.click();
    });

    expect(renderTrack).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("Updated Name");
  })

  it('should render/rerender when arr is accessed through loops', () => {
    const first = new Person('First');
    const second = new Person('Second');
    const third = new Person('Third');
    class People extends State {
      people = [first];
    }

    const people = new People();

    let testStepIdx = 0;
    const testSteps = [
      () => first.firstName = 'First(updated)',
      () => people.people.push(second),
      () => second.firstName = 'Second(updated)',
      () => people.people.unshift(third),
      () => third.firstName = 'Third(updated)',
    ]

    const renderTrack = jest.fn();
    const PeopleDisplay = (props: { people: People }) => {
      const store = useEntity(props.people)
      renderTrack();
      return (
        <div
          data-testid="container-store"
          onClick={() => {
            testSteps[testStepIdx]();
            testStepIdx++;
          }}
        >
          {store.people.map((person) => `${person.firstName},`)}
        </div>
      )
    }

    const wrapper = testingLib.render(
      <PeopleDisplay people={people} />
    );

    const container = wrapper.getByTestId('container-store');
    expect(container.innerHTML).toBe("First,");
    renderTrack.mockClear();

    React.act(() => {
      container.click();
    });

    expect(renderTrack).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("First(updated),");
    renderTrack.mockClear();

    React.act(() => {
      container.click();
    });

    expect(renderTrack).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("First(updated),Second,");
    renderTrack.mockClear();

    React.act(() => {
      container.click();
    });

    expect(renderTrack).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("First(updated),Second(updated),");
    renderTrack.mockClear();


    React.act(() => {
      container.click();
    });

    expect(renderTrack).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("Third,First(updated),Second(updated),");
    renderTrack.mockClear();

    React.act(() => {
      container.click();
    });

    expect(renderTrack).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("Third(updated),First(updated),Second(updated),");
    renderTrack.mockClear();
  })
});
