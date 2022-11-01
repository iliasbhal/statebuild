import React from 'react';
import { Atom } from './Atom';
import { useEntity } from './useEntity';

type UseAtom<Value> =  [Value, (next: Value) => void]

export const useAtom = <A>(atom: Atom<A>) : UseAtom<A> => {
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