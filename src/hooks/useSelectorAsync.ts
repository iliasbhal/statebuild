import React from 'react';
import { Selector, SelectorAsyncCallback } from '../models';
import { useSelector } from './useSelector';

export const useSelectorAsync = <Fn extends SelectorAsyncCallback>(selector: Selector<Fn>) => {
  const value = useSelector(selector);
  return useInitiatedPromise(value);
}

const useInitiatedPromise = <P extends Promise<any>>(promise: P) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<Awaited<P> | null>(null);

  React.useEffect(() => {
    let abort = false;

    setIsLoading(true);
    setError(null);
    // setData(null); // Keep the previous value

    promise
      .then((data) => {
        if (abort) return;
        setData(data);
      })
      .catch((err) => {
        if (abort) return;
        setError(err);
      })
      .finally(() => {
        if (abort) return;
        setIsLoading(false);
      })

    return () => {
      abort = true;
    }
  }, [promise])

  return [data, {
    isLoading,
    error,
  }] as const
}