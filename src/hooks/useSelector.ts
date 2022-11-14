import React from 'react';
import { Entity, Selector } from '../models';

export const useSelector = <A>(selector: Selector<A>) : A => {
  const [value, setValue] = React.useState(() => selector.get());

  React.useEffect(() => {
    const subscription = Selector.subsribeToSelectorChanges(selector, setValue);
    return () => {
      subscription.unsubscribe()
    }
  },[]);

  return value;
}