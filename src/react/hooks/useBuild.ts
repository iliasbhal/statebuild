import { useInstance } from './useInstance';
import { useSelector } from './useSelector';
import { useReaction } from './useReaction';


export const useBuild = {
  Instance: useInstance,
  Select: useSelector,
  Reaction: useReaction,
}