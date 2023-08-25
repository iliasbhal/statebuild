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
    jest.useFakeTimers({ legacyFakeTimers: true });
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
    jest.useFakeTimers({ legacyFakeTimers: true });
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
    jest.useFakeTimers({ legacyFakeTimers: true });
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

  it('should renvder several components using different props', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    const atom = State.from(1);
    
    const anotherAtom = State.from(1);
    const anotherSpy = jest.fn();

    const AnotherItem = State.UI(() => {
      anotherSpy();
      return (
        <span>
          another:{anotherAtom}
        </span>
      );
    })

    const Item = State.UI(({ id }: { id: string }) => {
      return (
        <span>
          id: {id}| value:{atom}
        </span>
      );
    });

    const Root = () => {
      return (
        <>
          <Item id='1'/>
          <Item id='2'/>
          <AnotherItem />
        </>
      );
    }

    const wrapper = testingLib.render(<Root />);
    expect(wrapper.container).toHaveTextContent('id: 1| value:1');
    expect(wrapper.container).toHaveTextContent('id: 2| value:1');
    expect(wrapper.container).toHaveTextContent('another:1');
    expect(anotherSpy).toHaveBeenCalledTimes(1);
    anotherSpy.mockClear();

    await act(() => {
      atom.set(2);
      jest.runOnlyPendingTimers();
    });

    expect(wrapper.container).toHaveTextContent('id: 1| value:2');
    expect(wrapper.container).toHaveTextContent('id: 2| value:2');
    expect(wrapper.container).toHaveTextContent('another:1');

    expect(anotherSpy).toHaveBeenCalledTimes(0);
  })

  it('should rerender components props changes', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    const atom = State.from(1);
    const renderSpy = jest.fn();

    const Item = State.UI(({ id }: { id: string }) => {
      renderSpy();

      return (
        <span>
          id: {id}| value:{atom}
        </span>
      );
    });

    const wrapper = testingLib.render(<Item id={"1"} />);
    expect(wrapper.container).toHaveTextContent('id: 1| value:1');
    expect(renderSpy).toHaveBeenCalledTimes(1);
    renderSpy.mockClear();

    wrapper.rerender(<Item id={"2"} />);

    expect(wrapper.container).toHaveTextContent('id: 2| value:1');
    expect(renderSpy).toHaveBeenCalledTimes(1);
  })

  it('should not rerender when components props didnt change', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    const atom = State.from(1);
    const renderSpy = jest.fn();

    const Item = State.UI(({ id }: { id: string }) => {
      renderSpy();

      return (
        <span>
          id: {id}| value:{atom}
        </span>
      );
    });

    const wrapper = testingLib.render(<Item id={"1"} />);
    renderSpy.mockClear();

    wrapper.rerender(<Item id={"2"} />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    renderSpy.mockClear();

    wrapper.rerender(<Item id={"2"} />);

    expect(renderSpy).not.toHaveBeenCalled();
  })
})