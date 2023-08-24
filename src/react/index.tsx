import React from 'react';
import { useSelector } from '../hooks';
import { Atom, State as StateOG } from '../models';

export class State extends StateOG {
  static UI = (callback: (props: any) => any) => {    
    return React.memo((props) => {
      const selector = React.useMemo(() => {
        return StateOG.select(() => {
          const originalCreateComp = React.createElement
  
          React.createElement = (name, props, ...children) => {
            console.log(children.length, children);
            return originalCreateComp(name, props, children.map((child) => {
              if (child instanceof Atom) return child.get();
              return child;
            }));
          }
  
          const value = callback(props);
  
          React.createElement = originalCreateComp
          return value;
        });
      }, []);
  
      const component = useSelector(selector);
      return component;
    });
  };

  static createAtomUI = (atom: Atom<any>) => {
    const AtomUI = () => {
      const value = atom.get();

      return (
        <div>
          {value}
        </div>
      )
    }

    return AtomUI;
  }

  static from<V>(value: V) {
    const atom = StateOG.from(value);
    const AtomUI = State.createAtomUI(atom);
    const component = React.createElement('', {}, <AtomUI />);
    return Object.assign(atom, component);
  }
}