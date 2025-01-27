import React from 'react';
import { Reaction } from '../../core/Reaction';

export function useReaction<R extends () => void>(reaction: R) {
  React.useEffect(() => {
    const result = new Reaction(reaction);
    result.start();

    return () => {
      result.dispose();
    };
  }, []);
}
