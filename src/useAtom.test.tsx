import React from 'react';
import * as testingLib from '@testing-library/react'
import { Atom } from './Atom';
import { useAtom } from './useAtom';
import { act } from 'react-dom/test-utils';

describe('useAtom', () => {
  it('should display initial value', () => {
    const countAtom = Atom.from(3);
    const Wrapper = () => {
      const [count, setCount] = useAtom(countAtom);
      return (
        <div data-testid="container">
          {count}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent('3');
  })

  it('should update atom when setState is called', () => {
    const countAtom = Atom.from(3);
    const Wrapper = () => {
      const [count, setCount] = useAtom(countAtom);
      return (
        <div data-testid="container" onClick={() => setCount(count + 1)}>
          {count}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');

    act(() => {
      container.click();
    })

    expect(container).toHaveTextContent('4');
    expect(countAtom.get()).toBe(4);
  });

  it('should rerender when atom update from outside the component', () => {
    const countAtom = Atom.from(3);

    const Wrapper = () => {
      const [count, setCount] = useAtom(countAtom);
      return (
        <div data-testid="container">
          {count}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent('3');
    expect(countAtom.get()).toBe(3);

    act(() => {
      countAtom.set(4);
    })

    expect(container).toHaveTextContent('4');
    expect(countAtom.get()).toBe(4);
  })

  it('should batch rerenders when atom is updated from inside the component', () => {
    const countAtom = Atom.from(3);

    const rerenderSpy = jest.fn();
    const Wrapper = () => {
      const [count, setCount] = useAtom(countAtom);
      rerenderSpy();
      return (
        <div data-testid="container" onClick={() => setCount(count + 1)}>
          {count}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    rerenderSpy.mockClear();
    expect(container).toHaveTextContent('3');
    expect(countAtom.get()).toBe(3);

    act(() => {
      container.click();
      container.click();
      container.click();
    })

    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    expect(countAtom.get()).toBe(4);
    expect(container).toHaveTextContent('4');
  })

  it('should batch rerenders when atom is updated from outide the component', () => {
    const countAtom = Atom.from(3);

    const rerenderSpy = jest.fn();
    const Wrapper = () => {
      const [count, setCount] = useAtom(countAtom);
      rerenderSpy();
      return (
        <div data-testid="container" onClick={() => setCount(count + 1)}>
          {count}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    rerenderSpy.mockClear();
    expect(container).toHaveTextContent('3');
    expect(countAtom.get()).toBe(3);

    act(() => {
      countAtom.set(4);
      countAtom.set(5);
      countAtom.set(6);
    })

    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    expect(countAtom.get()).toBe(6);
    expect(container).toHaveTextContent('6');
  })

  it('should rerender every component reading a specific atom', () => {
    const sharedAtom = Atom.from(3);
    const notSharedAtom = Atom.from(3);

    const rerenderSpy1 = jest.fn();
    const Component1 = () => {
      const [shared, setShared] = useAtom(sharedAtom);
      rerenderSpy1();
      return <div data-testid="Component1">{shared}</div>;
    }

    const rerenderSpy2 = jest.fn();
    const Component2 = () => {
      const [shared, setShared] = useAtom(sharedAtom);
      const [notShared, setNotShared] = useAtom(notSharedAtom);

      rerenderSpy2();
      return <div data-testid="Component2">{shared} {notShared}</div>;
    }

    const Wrapper = () => {
      return (
        <>
          <Component1 />
          <Component2 />
        </>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    expect(rerenderSpy1).toHaveBeenCalledTimes(1);
    expect(rerenderSpy2).toHaveBeenCalledTimes(1);
    rerenderSpy1.mockClear();
    rerenderSpy2.mockClear();

    act(() => {
      sharedAtom.set(4);
      sharedAtom.set(5);
      sharedAtom.set(6);
    })

    expect(rerenderSpy1).toHaveBeenCalledTimes(1);
    expect(rerenderSpy2).toHaveBeenCalledTimes(1);

    rerenderSpy1.mockClear();
    rerenderSpy2.mockClear();

    act(() => {
      notSharedAtom.set(4);
      notSharedAtom.set(5);
      notSharedAtom.set(6);
    })

    expect(rerenderSpy1).not.toHaveBeenCalled();
    expect(rerenderSpy2).toHaveBeenCalledTimes(1);
  })
})