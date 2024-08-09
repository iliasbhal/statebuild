import React from 'react';
import * as testingLib from '@testing-library/react'
import { act } from 'react-dom/test-utils';
import { State, useSelector } from '../..';

describe('useSelector', () => {
  it('should return selector value', () => {
    const count = State.from(3);
    const doubleSelector = State.select(() => {
      return count.get() * 2;
    })

    const rerenderSpy = jest.fn();
    const Wrapper = () => {
      const double = useSelector(doubleSelector);
      rerenderSpy();
      return (
        <div data-testid="container">
          {double}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent('6');
  })

  it('should render updated selector value', async () => {
    const count = State.from(3);
    const doubleSelector = State.select(() => {
      return count.get() * 2;
    })

    const rerenderSpy = jest.fn();
    const Wrapper = () => {
      const double = useSelector(doubleSelector);
      rerenderSpy();
      return (
        <div data-testid="container" onClick={() => count.set(1)}>
          {double}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    rerenderSpy.mockClear();
    expect(container).toHaveTextContent('6');

    act(() => {
      container.click();
    })

    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent('2');
  })

  it('should accept last atom value and rerender only once', () => {
    const count = State.from(3);
    const doubleSelector = State.select(() => {
      return count.get() * 2;
    })

    const rerenderSpy = jest.fn();
    const Wrapper = () => {
      const double = useSelector(doubleSelector);
      rerenderSpy();
      return (
        <div
          data-testid="container"
          onClick={() => {
            count.set(1);
            count.set(20);
            count.set(30);
          }}
        >
          {double}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    rerenderSpy.mockClear();
    expect(container).toHaveTextContent('6');

    act(() => {
      container.click();
    })

    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent('60');
  })
})