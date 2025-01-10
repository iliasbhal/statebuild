import React from 'react';
import { Selector, SelectorCallback, Reaction } from '../../core';

export const useSelector = <Fn extends SelectorCallback>(selector: Selector<Fn>): ReturnType<Fn> => {
  const valueRef = React.useRef();
  const [_, rerender] = React.useState(() => {
    const value = selector.get();
    valueRef.current = value;
  });

  React.useEffect(() => {
    const reaction = new Reaction(() => {
      const nextValue = selector.get();
      if (valueRef.current !== nextValue) {
        valueRef.current = nextValue;
        rerender({});
      }
    });

    reaction.start();

    return () => {
      reaction.dispose();
    }
  }, [selector]);

  return valueRef.current;
}