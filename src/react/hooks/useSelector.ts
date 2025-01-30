import React from 'react';
import { Selector, AnySelectorCallback } from '../../core';
import { useReaction } from './useReaction';

export const useSelector = <Fn extends AnySelectorCallback>(selector: Selector<Fn>): ReturnType<Fn> => {
  const valueRef = React.useRef<ReturnType<Fn>>();

  const [_, rerender] = React.useState(() => {
    const value = selector.get();
    valueRef.current = value;
  });


  useReaction(() => {
    const nextValue = selector.get();

    const hasChanged = valueRef.current !== nextValue;
    if (!hasChanged) {
      valueRef.current = nextValue;
      rerender({});
    }
  });

  return valueRef.current;
}
