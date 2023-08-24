import React from 'react';
import * as testingLib from '@testing-library/react'
import { act } from 'react-dom/test-utils';
import { State } from './index'

describe('React', () => {
  it('rerender when atom is updated', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });

    const atom = State.from(1);
    const renderSpy = jest.fn();
    const AAA = State.UI(() => {
      renderSpy();
      const value = atom.get();
      return (
        <span>
          {value}
        </span>
      );
    })

    const wrapper = testingLib.render(<AAA />);
    expect(wrapper.container).toHaveTextContent('1');
    expect(renderSpy).toHaveBeenCalledTimes(1);
    renderSpy.mockClear();

    await act(() => {
      atom.set(2);
      jest.runOnlyPendingTimers();
    });

    expect(wrapper.container).toHaveTextContent('2');
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });


  it('can render an atom when used in the children tree', async () => {
    const atom = State.from(1);

    const renderSpy = jest.fn();
    const AAA = State.UI(() => {
      renderSpy();
      return (
        <span>
          {atom}
        </span>
      );
    })

    const wrapper = testingLib.render(<AAA />);
    expect(wrapper.container).toHaveTextContent('1');
  });

  it('can render a selector when used in the children tree', async () => {
    const atom = State.from(1);
    const double = State.select(() => atom.get() * 2);
    const renderSpy = jest.fn();
    const AAA = State.UI(() => {
      renderSpy();
      return (
        <span>
          {double}
        </span>
      );
    })

    const wrapper = testingLib.render(<AAA />);
    expect(wrapper.container).toHaveTextContent('2');
  });

  it('should not rerender the component using the atom in the tree', async () => {
    const atom = State.from(1);

    const renderSpy = jest.fn();
    const AAA = State.UI(() => {
      renderSpy();
      return (
        <span>
          {atom}
        </span>
      );
    })

    const wrapper = testingLib.render(<AAA />);
    expect(wrapper.container).toHaveTextContent('1');
    expect(renderSpy).toHaveBeenCalledTimes(1);
    renderSpy.mockClear();

    await act(() => {
      atom.set(2);
      jest.runOnlyPendingTimers();
    });

    expect(wrapper.container).toHaveTextContent('2');
    expect(renderSpy).toHaveBeenCalledTimes(0);
  })
})