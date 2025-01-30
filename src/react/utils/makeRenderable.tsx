import React from 'react';
import { Atom, State } from '../../core';
import { STATEBUILD_UI_FLAG } from './enableAutoRendering'
import { useBuild } from '../hooks';

const originalCreateElement = React.createElement;

export const makeRenderable = <U, A extends Atom<U>>(atom: A) : A => {
  const AtomUI = atomToComponent(atom);
  return Object.assign(
    atom, 
    AtomUI,
    { render: () => originalCreateElement(AtomUI) },
    { [STATEBUILD_UI_FLAG]: <AtomUI /> } as {}
  )
}

export const atomToComponent = <A extends Atom<any>>(atom: A) => {
  const StateBuildAutoUI = React.memo(() => {
    const selector = React.useMemo(() => State.select(() => atom.get()), []);
    const value = useBuild.Select(selector);
    return (
      <React.Fragment>
        {value}
      </React.Fragment>
    );
  });

  return StateBuildAutoUI;
}