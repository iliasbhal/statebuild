import React from 'react';
import { Atom } from '../../models/Atom';
import { useEntity } from './useEntity';

export function useAtom<A>(atom: Atom<A>) {
  const entity = useEntity(atom);
  const value = entity.get();
  const setValue = React.useCallback(
    (nextAtomValue: A) => entity.set(nextAtomValue),
    [],
  );

  return [
    value,
    setValue,
  ] as const;
}
