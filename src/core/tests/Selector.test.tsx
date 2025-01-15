import wait from "wait";
import { Entity, Selector, State } from "..";

describe("Selector", () => {
  it("can create a selector with other atoms", () => {
    const count = State.from(3);
    const double = State.select(() => count.get() * 2);

    expect(double.get()).toBe(6);
  });

  it("throws if trying to manualy set set value", () => {
    const count = State.from(3);
    const double = State.select(() => count.get() * 2);

    expect(() => (double as any).set(3)).toThrow("Selector is read only");
  });

  it("can create a selector with other updated atoms", () => {
    const count = State.from(3);
    count.set(4);
    const double = State.select(() => count.get() * 2);

    expect(double.get()).toBe(8);
  });

  it("updates selector when base atom is updated", () => {
    const count = State.from(3);
    const double = State.select(() => count.get() * 2);

    count.set(6);
    expect(double.get()).toBe(12);

    count.set(1);
    expect(double.get()).toBe(2);
  });

  it("computes selector only when read", () => {
    const count = State.from(3);
    const selector = jest.fn().mockImplementation(() => count.get() * 2);
    const double = State.select(selector);

    expect(selector).not.toHaveBeenCalled();
    count.set(6);
    expect(double.get()).toBe(12);
    expect(selector).toHaveBeenCalledTimes(1);
  });

  it("doesn't recompute selector if atom hasn't changed", () => {
    const count = State.from(3);
    const selector = jest.fn().mockImplementation(() => count.get() * 2);
    const double = State.select(selector);

    expect(selector).not.toHaveBeenCalled();

    double.get();
    double.get();
    double.get();

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
  });

  it("can be used like a normal function", () => {
    const count = State.from(3);
    const doubleSelector = jest.fn();
    const double = State.select(() => {
      doubleSelector();
      return count.get() * 2;
    });

    const tenSelector = jest.fn();
    const ten = State.select(() => {
      tenSelector();
      return double.get() * 10;
    });

    expect(ten()).toBe(60);
    expect(tenSelector).toHaveBeenCalledTimes(1);
    expect(doubleSelector).toHaveBeenCalledTimes(1);
  });

  it("accepts a selectors as arguments", () => {
    const count = State.from(3);
    const selector = jest.fn();
    const double = State.select(() => {
      selector();
      return count.get() * 2;
    });

    const selector2 = jest.fn();
    const quad = State.select(() => {
      selector2();
      return double.get() * 2;
    });

    expect(selector).not.toHaveBeenCalled();
    expect(selector2).not.toHaveBeenCalled();

    expect(quad.get()).toBe(12);
    expect(selector).toHaveBeenCalledTimes(1);
    expect(selector2).toHaveBeenCalledTimes(1);
  });

  it("be up to date when upstream selector isn't valid", () => {
    const count = State.from(1);
    const double = State.select(() => count.get() * 2);
    const ten = State.select(() => double.get() * 10);

    expect(ten.get()).toBe(20);

    count.set(100);

    expect(ten.get()).toBe(2000);
  });

  it("should recompute only invalidated upstream selectors", () => {
    const count = State.from(1);
    const doubleSpy = jest.fn();
    const double = State.select(() => {
      doubleSpy();
      return count.get() * 2;
    });

    const tripleSpy = jest.fn();
    const triple = State.select(() => {
      tripleSpy();
      return double.get() * 3;
    });

    expect(doubleSpy).not.toHaveBeenCalled();
    expect(tripleSpy).not.toHaveBeenCalled();

    triple.get();
    expect(triple.get()).toBe(6);
    expect(doubleSpy).toHaveBeenCalledTimes(1);
    expect(tripleSpy).toHaveBeenCalledTimes(1);
    doubleSpy.mockClear();
    tripleSpy.mockClear();

    // Simply seting count should recompute
    // Simply invalidate the tree
    count.set(100);
    expect(doubleSpy).not.toHaveBeenCalled();
    expect(tripleSpy).not.toHaveBeenCalled();

    triple.get();
    expect(triple.get()).toBe(600);
    expect(doubleSpy).toHaveBeenCalledTimes(1);
    expect(tripleSpy).toHaveBeenCalledTimes(1);
  });

  it("should recompute only invalidated upstream selectors tree 2", () => {
    const count = State.from(1);
    const doubleSpy = jest.fn();
    const double = State.select((): number => {
      doubleSpy();
      return count.get() * 2;
    });

    const multiple = State.from(3);
    const multiple2 = State.from(1000);
    const variableSpy = jest.fn();
    const variable = State.select(() => {
      variableSpy();
      return double.get() * multiple.get() * multiple2.get();
    });

    variable.get();
    expect(variable.get()).toBe(6000);
    expect(doubleSpy).toHaveBeenCalledTimes(1);
    expect(variableSpy).toHaveBeenCalledTimes(1);
    doubleSpy.mockClear();
    variableSpy.mockClear();

    multiple.set(0);

    expect(variable.get()).toBe(0);
    expect(doubleSpy).not.toHaveBeenCalled();
    expect(variableSpy).toHaveBeenCalledTimes(1);
    doubleSpy.mockClear();
    variableSpy.mockClear();

    multiple2.set(5);
    expect(variable.get()).toBe(0);
    expect(doubleSpy).not.toHaveBeenCalled();
    expect(variableSpy).toHaveBeenCalledTimes(1);
  });

  it("should accept entities as selector arguments", () => {
    class Person extends State {
      name: string;
      lastName: string;

      constructor(name: string) {
        super();
        this.setName(name);
        this.setLastName("last");
      }

      setName(name: string) {
        this.name = name;
      }

      setLastName(lastName: string) {
        this.lastName = lastName;
      }
    }

    const person = new Person("First");
    const second = new Person("Second");
    const updatedNameSpy = jest.fn();
    const updatedName = State.select(() => {
      updatedNameSpy();
      return person.name + "(Select)";
    });

    const marriedWithSpy = jest.fn();
    const marriedWith = State.select(() => {
      marriedWithSpy();
      return updatedName.get() + " is with " + second.name;
    });

    updatedName.get();
    expect(updatedName.get()).toBe("First(Select)");
    expect(updatedNameSpy).toHaveBeenCalledTimes(1);
    expect(marriedWithSpy).not.toHaveBeenCalled();
    updatedNameSpy.mockClear();

    person.setName("New");
    expect(updatedNameSpy).not.toHaveBeenCalled();

    updatedName.get();
    expect(updatedName.get()).toBe("New(Select)");
    expect(updatedNameSpy).toHaveBeenCalledTimes(1);
    updatedNameSpy.mockClear();

    marriedWith.get();
    expect(marriedWith.get()).toBe("New(Select) is with Second");
    expect(marriedWithSpy).toHaveBeenCalledTimes(1);
    marriedWithSpy.mockClear();

    person.setName("John");
    marriedWith.get();
    expect(marriedWith.get()).toBe("John(Select) is with Second");
    expect(marriedWithSpy).toHaveBeenCalledTimes(1);
    expect(updatedNameSpy).toHaveBeenCalledTimes(1);
  });

  it("should not invalidate selector if property isnt used in selector", () => {
    class Person extends State {
      name: string;
      lastName: string;

      constructor(name: string) {
        super();
        this.setName(name);
        this.setLastName("last");
      }

      setName(name: string) {
        this.name = name;
      }

      setLastName(lastName: string) {
        this.lastName = lastName;
      }
    }

    const person = new Person("First");
    const updatedNameSpy = jest.fn();
    const updatedName = State.select(() => {
      updatedNameSpy();
      return person.name + "(Select)";
    });

    updatedName.get();
    expect(updatedName.get()).toBe("First(Select)");
    expect(updatedNameSpy).toHaveBeenCalledTimes(1);
    updatedNameSpy.mockClear();

    person.setLastName("Doe");
    updatedName.get();
    expect(updatedName.get()).toBe("First(Select)");
    expect(updatedNameSpy).not.toHaveBeenCalled();
  });

  it("should register dependencies of async selector (when dependencies are defined in the same sync event loop)", async () => {
    const atom = State.from(3);
    const atom2 = State.from(2);
    const selectorSpy = jest.fn();
    const doubleAsync = State.select(async () => {
      selectorSpy();
      const value = atom.get();
      const multiplyWith = atom2.get();
      await wait(200);

      return value * multiplyWith;
    });

    await expect(doubleAsync.get()).resolves.toBe(6);
    await expect(doubleAsync.get()).resolves.toBe(6);
    expect(selectorSpy).toHaveBeenCalledTimes(1);
    selectorSpy.mockClear();

    await expect(doubleAsync.get()).resolves.toBe(6);
    expect(selectorSpy).not.toHaveBeenCalled();

    atom2.set(3);
    await expect(doubleAsync.get()).resolves.toBe(9);
    await expect(doubleAsync.get()).resolves.toBe(9);
    expect(selectorSpy).toHaveBeenCalledTimes(1);
    selectorSpy.mockClear();

    await expect(doubleAsync.get()).resolves.toBe(9);
    expect(selectorSpy).not.toHaveBeenCalled();
  });

  it.skip('should dependency tree when dependency is not active anymore', async () => {
    const atom = State.from(1);
    const atom2 = State.from(1000);

    const selectorSpy = jest.fn();
    const doubleAsync = State.select(async (ctx) => {
      selectorSpy();
      const value1 = atom.get();
      if (value1 >= 2) {
        return value1;
      }

      const value2 = atom2.get();
      return value2;
    });
    
    await expect(doubleAsync.get()).resolves.toBe(1000);
    atom.set(2);
    await expect(doubleAsync.get()).resolves.toBe(2);
    atom2.set(3);

    expect(Selector.tree.getDependencies(Entity.getBaseObject(atom)).size).toBe(1);
    expect(Selector.tree.getDependencies(Entity.getBaseObject(atom2)).size).toBe(0);
    expect(Selector.tree.getDependents(Entity.getBaseObject(doubleAsync)).size).toBe(1);
  })

  it('should accept generators as selectors for async-like', async () => {
    const atom = State.from(3);
    const atom2 = State.from(2);
    const selectorSpy = jest.fn();

    const doubleAsync = State.select(function* (ctx) {
      selectorSpy();
      const value = atom.get();
      yield wait(200);


      const multiplyWith = atom2.get();
      return value * multiplyWith;
    });

    await expect(doubleAsync.get()).resolves.toBe(6);
    await expect(doubleAsync.get()).resolves.toBe(6);
    expect(selectorSpy).toHaveBeenCalledTimes(1);
    selectorSpy.mockClear();

    await expect(doubleAsync.get()).resolves.toBe(6);
    expect(selectorSpy).not.toHaveBeenCalled();

    atom2.set(3);
    await expect(doubleAsync.get()).resolves.toBe(9);
    await expect(doubleAsync.get()).resolves.toBe(9);
    expect(selectorSpy).toHaveBeenCalledTimes(1);
    selectorSpy.mockClear();

    await expect(doubleAsync.get()).resolves.toBe(9);
    expect(selectorSpy).not.toHaveBeenCalled();
  });


  it.only("should register dependencies of async selector (when dependencies are NOT defined in the same sync event loop)", async () => {
    const atom = State.from(3);
    const atom2 = State.from(2);
    const selectorSpy = jest.fn();

    const double1 = State.select('Double',async () => {
      // console.log('Double1 context', AsyncContext.get().id)
      await wait(200);

      // console.log('Double1 context 2', AsyncContext.get().id)
      return atom.get() * 2;
    });

    const double2 = State.select(async () => {
      await wait(100);
      return atom2.get() * 2;
    })

    const total = State.select('Total',async (ctx) => {
      // console.log('Total context', AsyncContext.get().id)
      selectorSpy();
      const value = atom.get();
      await wait(200);

      // console.log('Total context 2', AsyncContext.get().id)
      const add1 = await double1.get();

      // console.log('Total context 3', AsyncContext.get().id)
      // const add2 = await atom2.get();
      // const add3 = await double2.get();

      // console.log('AsyncContext.get() 4', AsyncContext.get())
      return value + add1;
      // console.log('multiplyWith', value, add1, add2, add3);
      // return value + add1 + add2 + add3;
    });

    await total.get();

    // await expect(total.get()).resolves.toBe(15);
    // expect(selectorSpy).toHaveBeenCalledTimes(1);
    // selectorSpy.mockClear();

    // await expect(total.get()).resolves.toBe(15);
    // expect(selectorSpy).not.toHaveBeenCalled();

    // atom2.set(10);
    // await expect(total.get()).resolves.toBe(9);
    // await expect(total.get()).resolves.toBe(9);
    // expect(selectorSpy).toHaveBeenCalledTimes(1);
    // selectorSpy.mockClear();

    // await expect(doubleAsync.get()).resolves.toBe(9);
    // expect(selectorSpy).not.toHaveBeenCalled();
  });
});
