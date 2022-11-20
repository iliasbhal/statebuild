import React from 'react';
import { Selector } from '../models';

export const useSelector = <A>(selector: Selector<A>) : A => {
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