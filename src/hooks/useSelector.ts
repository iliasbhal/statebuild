import React from 'react';
import { Selector, SelectorCallback } from '../models';

export const useSelector = <Fn extends SelectorCallback>(selector: Selector<Fn>) : ReturnType<Fn> => {
  const [value, setValue] = React.useState(() => selector.get());

  React.useEffect(() => {
    const subscription = Selector.subsribeToSelectorChanges(selector, () => {
      setTimeout(() => {
        const nextValue = selector.get();
        setValue(nextValue)
      });
    });

    return () => {
      subscription.unsubscribe()
    }
  },[]);

  return value;
}