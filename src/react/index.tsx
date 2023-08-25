import React from 'react';
import { useSelector } from '../hooks';
import { Atom, SelectorCallback, State as StateOG } from '../models';

const createComponent = <P extends Record<string, any>>(callback: (props: P) => any) => {    
  return React.memo((props: P) => {
    const selector = React.useMemo(() => {
      return StateOG.select((...args: any[]) => {
        const reactCreateElement = React.createElement

        // @ts-ignore
        React.createElement = (name, props, ...children) => {
          const updatedChildren = children.map((child) => {
            return child?.component || child;
          });

          return reactCreateElement(name, props, ...updatedChildren);
        }


        const reconstructedProps = {};
        for(let i = 0; i < args.length; i += 2) {
          reconstructedProps[args[i]] = args[i + 1];
        }

        const value = callback(reconstructedProps as P);

        React.createElement = reactCreateElement
        return value;
      });
    }, []);


    // We have to serialize the props so that we can forward them as arguments to the selector
    const args = Object.entries(props).flat(1);
    const component = useSelector(selector, ...args);
    return component;
  });
}

export class State extends StateOG {
  static UI = createComponent;

  static from<Fn>(selectorFn: Fn): ReturnType<typeof State.makeRenderable<ReturnType<typeof StateOG.from<Fn>>>>;
  static from(a) {
    const atom = StateOG.from(a);
    return State.makeRenderable(atom);
  }

  static select<Fn extends SelectorCallback>(name: string, selectorFn: Fn): ReturnType<typeof State.makeRenderable<ReturnType<typeof StateOG.select<Fn>>>>;
  static select<Fn extends SelectorCallback>(selectorFn: Fn, b?: never): ReturnType<typeof State.makeRenderable<ReturnType<typeof StateOG.select<Fn>>>>;
  static select(a,b) {
    const atom = StateOG.select(a, b);
    return State.makeRenderable(atom);
  }

  static selectAsync<Fn extends SelectorCallback>(name: string, selectorFn: Fn): ReturnType<typeof State.makeRenderable<ReturnType<typeof StateOG.selectAsync<Fn>>>>;
  static selectAsync<Fn extends SelectorCallback>(selectorFn: Fn, b?: never): ReturnType<typeof State.makeRenderable<ReturnType<typeof StateOG.selectAsync<Fn>>>>;
  static selectAsync(a, b) {
    const atom = StateOG.selectAsync(a,b);
    return State.makeRenderable(atom);
  }

  private static createAtomUI = (atom: Atom<any>) => {
    const AtomUI = () => {
      const selector = React.useMemo(() => State.select(() => atom.get()), []);
      const value = useSelector(selector);
      return value;
    }

    return AtomUI;
  }

  private static makeRenderable<A extends Atom<any>>(atom: A) {
    const AtomUI = State.createAtomUI(atom);
    const component = React.createElement('', {}, <AtomUI />); 
    return Object.assign(atom, component, { component: <AtomUI /> })
  }
}
