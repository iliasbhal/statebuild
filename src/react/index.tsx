import React from 'react';
import { useSelector } from './hooks';
import { Atom, Selector, Reaction, SelectorCallback, State as StateOG } from '../core';
import { unsubscribe } from 'diagnostics_channel';
import { Track } from '../core/Track';

export * from './hooks';

const STATEBUILD_UI_FLAG = '__STATEBUILD_UI__';

const originalCreateElement = React.createElement;

export class State extends StateOG {
  static from<Fn>(selectorFn: Fn): ReturnType<typeof State.makeRenderable<any, ReturnType<typeof StateOG.from<Fn>>>>;
  static from(a) {
    const atom = StateOG.from(a);
    return State.makeRenderable(atom);
  }

  static select<Fn extends SelectorCallback>(name: string, selectorFn: Fn): ReturnType<typeof State.makeRenderable<any, ReturnType<typeof StateOG.select<Fn>>>>;
  static select<Fn extends SelectorCallback>(selectorFn: Fn, b?: never): ReturnType<typeof State.makeRenderable<any, ReturnType<typeof StateOG.select<Fn>>>>;
  static select(a, b) {
    const atom = StateOG.select(a, b);
    return State.makeRenderable(atom);
  }


  protected static makeRenderable<U, A extends Atom<U>>(atom: A) : A {
    const AtomUI = State.atomToComponent(atom);
    return Object.assign(
      atom, 
      AtomUI,
      { render: () => originalCreateElement(AtomUI) },
      { [STATEBUILD_UI_FLAG]: <AtomUI /> } as {}
    )
  }

  protected static atomToComponent = <A extends Atom<any>>(atom: A) => {
    const StateBuildAutoUI = React.memo(() => {
      const selector = React.useMemo(() => StateOG.select(() => atom.get()), []);
      const value = useSelector(selector);
      return (
        <React.Fragment>
          {value}
        </React.Fragment>
      );
    });

    return StateBuildAutoUI;
  }

  static wrappedByOriginal = new WeakMap()
  static wrapToAutoRerender = (component) => {
    const wrapped = this.wrappedByOriginal.get(component)
    if (wrapped) return wrapped;

    const wrapped2 = (props) => {
      const[ _, rerender] = React.useState();

      const selector = new Selector(() => {
        return component(props);
      })

      const rendered = selector.get()

      React.useEffect(() => {
        const sub = Track.subscribe(selector, () => {
          rerender({});
        })
   
        return () => {
          sub.unsubscribe();
          selector.dispose();
        };
      });

      return rendered;
    };

    this.wrappedByOriginal.set(component, wrapped2);
    return wrapped2;
  }

  static enableAutoRendering = () => {
    const originalCreateElement = React.createElement;

    React.createElement = (component, props, ...children) => {

      const patchedChildren = children.map((child) => {
        const isRenderableEntity = child[STATEBUILD_UI_FLAG];
        if (isRenderableEntity) {
          return child[STATEBUILD_UI_FLAG];
        }

        return child;
      })

      const isRenderableEntity = component[STATEBUILD_UI_FLAG];
      if (isRenderableEntity) {
        return component[STATEBUILD_UI_FLAG];
      }

      if (typeof component !== 'function' || component['$$typeof']) {
        return originalCreateElement(component, props, ...patchedChildren);
      }

      const autoRerenderComp = State.wrapToAutoRerender(component);
      return originalCreateElement(autoRerenderComp, props, ...patchedChildren);
    }
  };

}
