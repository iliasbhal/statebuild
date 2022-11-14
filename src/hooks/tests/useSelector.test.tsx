import React from 'react';
import * as testingLib from '@testing-library/react'
import { act } from 'react-dom/test-utils';
import { Atom, useSelector } from '../..';

describe('useSelector', () => {
  it('should return selector value', () => {
    const count = Atom.from(3);
    const doubleSelector = Atom.select(() => {
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
    jest.useFakeTimers();
    const count = Atom.from(3);
    const doubleSelector = Atom.select(() => {
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
      jest.runOnlyPendingTimers();
    })

    await testingLib.waitFor(() => rerenderSpy.mock.calls.length > 0);
    
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent('2');
  })
})