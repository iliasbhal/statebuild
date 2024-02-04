import React from 'react';
import { useSelector } from '../hooks';
import { Atom, SelectorCallback, State as StateOG } from '../models';

const STATEBUILD_UI_FLAG = '__STATEBUILD_UI__';

export const enableAutoRendering = () => {
  const reactCreateElement = React.createElement
  React.createElement = (name, props, ...children) => {
    const isRenderableEntity = name[STATEBUILD_UI_FLAG];
    if (isRenderableEntity) {
      return name[STATEBUILD_UI_FLAG];
    }

    return reactCreateElement(name, props, ...children);
  }
}

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

  public static toReactComponent = <A extends Atom<any>>(atom: A) => {
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

  protected static makeRenderable<U, A extends Atom<U>>(atom: A) {
    const AtomUI = State.toReactComponent(atom);
    return Object.assign(atom, AtomUI, { [STATEBUILD_UI_FLAG]: <AtomUI /> } as {})
  }
}
