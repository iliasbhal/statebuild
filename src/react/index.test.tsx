import React from 'react';
import * as testingLib from '@testing-library/react'
import { act } from 'react-dom/test-utils';
import { State, enableAutoRendering } from './index'
import { useAtom } from '../hooks';

describe('React', () => {
  enableAutoRendering();

  it('rerender when atom is updated', async () => {
    const Numb = State.from(1);
    const renderSpy = jest.fn();
    const AAA = () => {
      renderSpy();
      return (
        <span>
          <Numb />
        </span>
      );
    };

    const wrapper = testingLib.render(<AAA />);
    expect(wrapper.container).toHaveTextContent('1');

    renderSpy.mockClear();
    await act(() => {
      Numb.set(2);
    });

    expect(wrapper.container).toHaveTextContent('2');
    expect(renderSpy).toHaveBeenCalledTimes(0);
  });

  it('should still be able to use statebuild hooks', async () => {
    const Numb = State.from(1);
    const renderSpy = jest.fn();
    const AAA = () => {
      const [value] = useAtom(Numb);
      renderSpy();
      return (
        <span>
          <Numb /> {value % 2 === 0 ? 'even' : 'odd'}
        </span>
      );
    };

    const wrapper = testingLib.render(<AAA />);
    expect(wrapper.container).toHaveTextContent('1');
    expect(wrapper.container).toHaveTextContent('odd');

    renderSpy.mockClear();
    await act(() => {
      Numb.set(2);
    });

    expect(wrapper.container).toHaveTextContent('2');
    expect(wrapper.container).toHaveTextContent('even');
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
})