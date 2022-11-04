import React from 'react';
import { Atom, AtomSelector } from './Atom';
import { useEntity } from './useEntity';

export function useAtom<A>(selector: AtomSelector<A>) : A;
export function useAtom<A>(atom: Atom<A>) : [A, (nextValue: A) => void];
export function useAtom(atom) {
  if (atom instanceof AtomSelector) {
    return useAtomSelector(atom);
  }

  const entity = useEntity(atom);
  const value = entity.get();
  const setValue = React.useCallback((nextAtomValue) => {
    entity.set(nextAtomValue);
  }, []);

  return [
    value,
    setValue,
  ]
}

export const useAtomSelector = <A>(selector: AtomSelector<A>) : A => {
  const [value, setValue] = React.useState(() => selector.select());

  React.useEffect(() => {
    const subscription = AtomSelector.tree.events.subscribe(selector, (messsage) => {
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