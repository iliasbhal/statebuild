import React from 'react';
import { Selector } from './Selector';

export const useSelector = <A>(selector: Selector<A>) : A => {
  const [value, setValue] = React.useState(() => selector.get());

  React.useEffect(() => {
    const coreSelector = Selector.selectorInstanceByCallable.get(selector) || selector;
    const subscription = Selector.tree.events.subscribe(coreSelector, (messsage) => {
      setTimeout(() => {
        setValue(() => selector.get())
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  },[]);

  return value;
}