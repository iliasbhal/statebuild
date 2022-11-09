import React from 'react';
import { Atom } from './Atom';
import { Selector } from './Selector';
import { useEntity } from './useEntity';
import { useSelector } from './useSelector';

export function useAtom<A>(selector: Selector<A>) : A;
export function useAtom<A>(atom: Atom<A>) : [A, (nextValue: A) => void];
export function useAtom(atom) {
  if (atom instanceof Selector) {
    return useSelector(atom);
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
