import React from 'react';
import * as testingLib from '@testing-library/react'
import { State } from '../index'

State.enableAutoRendering();

describe('React', () => {

  it('can use atom like a component', async () => {
    const Numb = State.from(1);
    const renderSpy = jest.fn();
    const AAA = () => {
      renderSpy();
      return (
        <span>
          <Numb KKK="LLL"/>
        </span>
      );
    };

    const wrapper = testingLib.render(<AAA />);
    expect(wrapper.container).toHaveTextContent('1');

    renderSpy.mockClear();
    await React.act(() => {
      Numb.set(2);
    });

    expect(wrapper.container).toHaveTextContent('2');
    expect(renderSpy).toHaveBeenCalledTimes(0);
  });

  it('can render atom by placing it in the render brackets', async () => {
    const atom = State.from(1);
    const renderSpy = jest.fn();
    const AAA = () => {
      renderSpy();
      return (
        <span>
          {atom}
        </span>
      );
    };

    const wrapper = testingLib.render(<AAA />);
    expect(wrapper.container).toHaveTextContent('1');

    renderSpy.mockClear();
    await React.act(() => {
      atom.set(2);
    });

    expect(wrapper.container).toHaveTextContent('2');
    expect(renderSpy).toHaveBeenCalledTimes(0);
  });

  it('should still be able to use React hooks', async () => {
    const atom = State.from(1);
    const renderSpy = jest.fn();
    const useEffectSpy = jest.fn();
    const Component = () => {
      React.useState("initial");
      
      renderSpy();

      React.useEffect(() => {
        useEffectSpy();
      })


      return (
        <span>
          {atom.get()}
        </span>
      );
    };

    Component.debug = true;

    const wrapper = testingLib.render(<Component />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(useEffectSpy).toHaveBeenCalledTimes(1);
    renderSpy.mockClear();
    useEffectSpy.mockClear();

    wrapper.rerender(<Component />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(useEffectSpy).toHaveBeenCalledTimes(1);
    renderSpy.mockClear();
    useEffectSpy.mockClear();

    wrapper.rerender(<Component />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(useEffectSpy).toHaveBeenCalledTimes(1);
    renderSpy.mockClear();
    useEffectSpy.mockClear();
  });

  it('rerenders with new props', async () => {
    const atom = State.from(1);
    const renderSpy = jest.fn();
    
    const Component = (props) => {
      renderSpy();
      return (
        <span>
          {props.name}:{atom.get()}
        </span>
      );
    };

    const wrapper = testingLib.render(<Component name="first" />);
    expect(wrapper.container).toHaveTextContent('first:1');
    expect(renderSpy).toHaveBeenCalledTimes(1);
    renderSpy.mockClear();

    wrapper.rerender(<Component name="second" />)

    expect(wrapper.container).toHaveTextContent('second:1');
    expect(renderSpy).toHaveBeenCalledTimes(1);
  })

  it('rerenders with a hooks initiate the rerender', () => {

    const atom = State.from(3);
    const rerenderSpy = jest.fn();
    const Wrapper = () => {
      const [state, setState] = React.useState(0);
      rerenderSpy();
      return (
        <div data-testid="container" onClick={() => setState((prev => prev + 1))}>
          {atom.get() + 1}:{state}
        </div>
      )
    }

    const wrapper = testingLib.render(<Wrapper />);
    const container = wrapper.getByTestId('container');
    expect(container).toHaveTextContent('4:0');
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    rerenderSpy.mockClear();


    React.act(() => {
      container.click();
    })

    expect(container).toHaveTextContent('4:1');
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
    rerenderSpy.mockClear();

    React.act(() => {
      atom.set(4);
    })

    expect(container).toHaveTextContent('5:1');
    expect(rerenderSpy).toHaveBeenCalledTimes(1);
  });

})