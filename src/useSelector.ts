import React from 'react';
import { Selector } from './Selector';

export const useSelector = <A>(selector: Selector<A>) : A => {
  const [value, setValue] = React.useState(() => selector.select());

  React.useEffect(() => {
    const subscription = Selector.tree.events.subscribe(selector, (messsage) => {
      setTimeout(() => {
        setValue(() => selector.select())
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  },[]);

  return value;
}