import { Entity, Atom, Selector, SelectorCallback, SelectorAsyncCallback } from '../models';
import { useEntity } from './useEntity';
import { useSelector } from './useSelector';
import { useAtom } from './useAtom';

// export function useStateBuild<A extends SelectorAsyncCallback>(selector: Selector<A>) : ReturnType<typeof useSelectorAsync<A>>;
export function useStateBuild<A extends SelectorCallback>(selector: Selector<A>) : ReturnType<typeof useSelector<A>>;
export function useStateBuild<A>(atom: Atom<A>) : ReturnType<typeof useAtom<A>>;
export function useStateBuild(entity: Entity) : Entity;
export function useStateBuild(arg) {
  if (arg instanceof Selector) {
    return useSelector(arg);
  }

  if (arg instanceof Atom) {
    return useAtom(arg);
  }

  if (arg instanceof Entity) {
    return useEntity(arg);
  }

  throw new Error('Argument type is not supported');
}