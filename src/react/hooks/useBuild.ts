import { useEntity } from './useEntity';
import { useSelector } from './useSelector';
import { useReaction } from './useReaction';


export const useBuild = {
  Instance: useEntity,
  Select: useSelector,
  Reaction: useReaction,
}