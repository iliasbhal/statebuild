import React from 'react';
import * as testingLib from '@testing-library/react'
import { State } from '../';

State.enableAutoRendering();

describe('useAtom', () => {
  it('should display atom value', () => {
    const countAtom = State.from(3);
    
    const Wrapper = () => {
      return (
        <div data-testid="container">
          {countAtom}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent('3');
  })

  it('should display atom value 2', () => {
    const countAtom = State.from(3);
    
    const Wrapper = () => {
      return (
        <div data-testid="container">
          {countAtom}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent('3');
  })

  it('should not rerender with atom is not read during render block', () => {
    const countAtom = State.from(3);
    const rerenderSpy = jest.fn();
    const Wrapper = () => {
      rerenderSpy();
      return (
        <div data-testid="container" onClick={() => countAtom.set(countAtom.get() + 1)}>
          {countAtom}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    rerenderSpy.mockClear();


    React.act(() => {
      container.click();
    })

    expect(container).toHaveTextContent('4');
    expect(countAtom.get()).toBe(4);
    expect(rerenderSpy).toHaveBeenCalledTimes(0);
  });

  it('should rerender when atom is read during render block', () => {
    const atom = State.from(3);
    const rerenderSpy = jest.fn();
    const Wrapper = () => {
      rerenderSpy();

      const value = atom.get()
      return (
        <div 
          data-testid="container"
          onClick={() => {
            atom.set(value + 1)
          }}

        >
          {value}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent('3');
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    rerenderSpy.mockClear();

    React.act(() => {
      container.click();
    })

    // wrapper.debug();

    expect(atom.get()).toBe(4);
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    rerenderSpy.mockClear();
    expect(container).toHaveTextContent('4');


    React.act(() => {
      container.click();
    })

    // wrapper.debug();

    expect(atom.get()).toBe(5);
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    rerenderSpy.mockClear();
    expect(container).toHaveTextContent('5');
  });

  it('should rerender when atom update from outside the component', () => {
    const countAtom = State.from(3);

    const Wrapper = () => {
      return (
        <div data-testid="container">
          {countAtom.get() + 1}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent('4');
    expect(countAtom.get()).toBe(3);

    React.act(() => {
      countAtom.set(4);
    })

    expect(container).toHaveTextContent('5');
    expect(countAtom.get()).toBe(4);
  })

  it('should rerender every component reading a specific atom', () => {
    const sharedAtom = State.from(3);
    const notSharedAtom = State.from(3);

    const rerenderSpy1 = jest.fn();
    const Component1 = () => {
      rerenderSpy1();
      return <div data-testid="Component1">{sharedAtom.get()}</div>;
    }

    const rerenderSpy2 = jest.fn();
    const Component2 = () => {
      rerenderSpy2();
      return <div data-testid="Component2">{sharedAtom.get()} {notSharedAtom.get()}</div>;
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

    React.act(() => {
      sharedAtom.set(4);
      sharedAtom.set(5);
      sharedAtom.set(6);
    })

    // wrapper.debug();

    // should render only once because React batch rerender calls
    expect(rerenderSpy1).toHaveBeenCalledTimes(1);
    expect(rerenderSpy2).toHaveBeenCalledTimes(1);

    rerenderSpy1.mockClear();
    rerenderSpy2.mockClear();

    React.act(() => {
      notSharedAtom.set(4);
      notSharedAtom.set(5);
      notSharedAtom.set(6);
    })

    // wrapper.debug();

    expect(rerenderSpy1).not.toHaveBeenCalled();
    expect(rerenderSpy2).toHaveBeenCalledTimes(1);
  })
})