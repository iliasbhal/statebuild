import React from 'react';
import * as testingLib from '@testing-library/react'
import { State, useSelectorAsync } from '../..';
import { act } from 'react-dom/test-utils';

describe('useSelectorAsync', () => {
  it('should return async selector value and state', async () => {
    const count = State.from(3);
    const delayDouble = State.select(async () => {
      const double = count.get() * 2;
      await new Promise(r => setTimeout(r, 100));
      return double;
    })

    const rerenderSpy = jest.fn();
    const Wrapper = () => {
      const [double, meta] = useSelectorAsync(delayDouble);
      rerenderSpy();
      return (
        <div data-testid="container">
          (data: {double}) (isLoading: {meta.isLoading.toString()}) (hasError: {!!meta.error})
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);

    const container = wrapper.getByTestId('container');
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent('isLoading: true');
    expect(container).toHaveTextContent('(data: )')

    await testingLib.waitFor(() =>{
      expect(container).toHaveTextContent('isLoading: false');
      expect(container).toHaveTextContent('(data: 6)')
    })
  })

  it('should render updated selector value', async () => {
    const count = State.from(3);
    const delayDouble = State.select(async () => {
      const double = count.get() * 2;
      await new Promise(r => setTimeout(r, 100));
      return double;
    })

    const Wrapper = () => {
      const [double, meta] = useSelectorAsync(delayDouble);
      return (
        <div data-testid="container" onClick={() => count.set(1)}>
          (data: {double}) (isLoading: {meta.isLoading.toString()}) (hasError: {!!meta.error})
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent('isLoading: true');
    expect(container).toHaveTextContent('(data: )')

    await testingLib.waitFor(() => {
      expect(container).toHaveTextContent('isLoading: false');
      expect(container).toHaveTextContent('(data: 6)')
    });

    act(() => {
      container.click();
    })

    await testingLib.waitFor(() => {
      expect(container).toHaveTextContent('isLoading: true');
      expect(container).toHaveTextContent('(data: 6)')
    });

    await testingLib.waitFor(() => {
      expect(container).toHaveTextContent('isLoading: false');
      expect(container).toHaveTextContent('(data: 2)')
    });
    
  })
})