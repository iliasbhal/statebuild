import React from 'react';
import { Selector, SelectorCallback } from '../models';

export const useSelector = <Fn extends SelectorCallback>(selector: Selector<Fn>, ...args: unknown[]) : ReturnType<Fn> => {
  const [value, setValue] = React.useState(() => selector.get(...args));
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    const isFirstRender = renderCount.current === 0;
    if (!isFirstRender) {
      const nextValue = selector.get(...args);
      setValue(nextValue);
    } else {
      renderCount.current += 1;
    }

    const subscription = Selector.subsribeToSelectorChanges(selector, () => {
      setTimeout(() => {
        const nextValue = selector.get(...args);
        setValue(nextValue)
      });
    });

    return () => {
      subscription.unsubscribe()
    }
  }, [...args]);

  return value;
}