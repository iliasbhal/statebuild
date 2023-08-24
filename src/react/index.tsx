import React from 'react';
import { useSelector } from '../hooks';
import { Atom, SelectorCallback, State as StateOG } from '../models';

export class State extends StateOG {
  static UI = (callback: (props: any) => any) => {    
    return React.memo((props) => {
      const selector = React.useMemo(() => {
        return StateOG.select(() => {
          const reactCreateElement = React.createElement
  
          // @ts-ignore
          React.createElement = (name, props, ...children) => {
            const updatedChildren = children.map((child) => {
              return child.jsx?.() || child;
            });

            return reactCreateElement(name, props, ...updatedChildren);
          }
  
          const value = callback(props);
  
          React.createElement = reactCreateElement
          return value;
        });
      }, []);
  
      const component = useSelector(selector);
      return component;
    });
  };

  static createAtomUI = (atom: Atom<any>) => {
    const AtomUI = () => {
      const selector = State.select(() => atom.get());
      const value = useSelector(selector);
      return value;
    }

    return AtomUI;
  }

  static from<V>(value: V) {
    const atom = StateOG.from(value);
    const component = React.createElement('', {}, <></>);
    return Object.assign(atom, component, {
      jsx: () => {
        const AtomUI = State.createAtomUI(atom);
        return <AtomUI />;
      }
    });
  }

  static select<V extends SelectorCallback>(value: V) {
    const atom = StateOG.select(value);
    const component = React.createElement('', {}, <></>);
    return Object.assign(atom, component, {
      jsx: () => {
        const AtomUI = State.createAtomUI(atom);
        return <AtomUI />;
      }
    });
  }
}