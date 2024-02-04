import React from 'react';
import { Selector, SelectorCallback } from '../models';

export const useSelector = <Fn extends SelectorCallback>(selector: Selector<Fn>, ...args: unknown[]) : ReturnType<Fn> => {
  const [value, setValue] = React.useState(() => selector.get(...args));

  React.useEffect(() => {    
    const subscription = Selector.onUpstreamInvalidation(selector, () => {
      const nextValue = selector.get(...args);
      setValue(nextValue)
    });

    return () => {
      subscription.unsubscribe();
      selector.dispose();
    }
  }, [...args]);

  return value;
}